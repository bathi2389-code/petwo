import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isAdmin } from '../../middleware/auth.middleware';
import { createAuditLog } from '../../middleware/audit.middleware';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { Provider, Booking, Payment, Settlement, Coupon, AuditLog, ServiceCategory } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const VerifyProviderSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended', 'under_review']),
  notes: z.string().max(1000).optional(),
});

const ProviderQuerySchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'suspended']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});


const AdminCustomerQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const AdminBookingQuerySchema = z.object({
  status: z.string().optional(),
  providerId: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const CommissionConfigSchema = z.object({
  categoryId: z.string().min(1),
  commissionRate: z.number().min(0).max(100),
});

const CreateCouponSchema = z.object({
  code: z.string().min(3).max(30).transform(v => v.toUpperCase()),
  description: z.string().min(3).max(500),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive(),
  maxDiscountAmount: z.number().positive().optional(),
  minOrderAmount: z.number().positive().optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProviders: z.array(z.string()).optional(),
  usageLimit: z.number().positive().optional(),
  userUsageLimit: z.number().positive().default(1),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  fundedBy: z.enum(['platform', 'provider']).default('platform'),
  fundedByProviderId: z.string().optional(),
  isActive: z.boolean().default(true),
});

const UpdateCouponSchema = CreateCouponSchema.partial();

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Enforce admin auth on all routes in this plugin
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', isAdmin);


  /**
   * GET /admin/customers — Real customer registrations from the users collection.
   * Customer signup creates both users/{uid} and customers/{uid}; users is the
   * role-authoritative collection, so this avoids showing providers/admins here.
   */
  app.get('/customers', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = AdminCustomerQuerySchema.parse(request.query);
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'customer')
      .get();

    type AdminCustomerRecord = {
      id: string;
      displayName?: unknown;
      email?: unknown;
      createdAt?: unknown;
      updatedAt?: unknown;
      isActive?: unknown;
      [key: string]: unknown;
    };

    const search = query.q?.toLowerCase();
    const users: AdminCustomerRecord[] = snapshot.docs
      .map<AdminCustomerRecord>(doc => ({
        ...(doc.data() as Record<string, unknown>),
        id: doc.id,
      }))
      .filter(user => {
        if (!search) return true;
        return String(user.displayName ?? '').toLowerCase().includes(search)
          || String(user.email ?? '').toLowerCase().includes(search);
      })
      .sort((a, b) => String(b.createdAt ?? b.updatedAt ?? '').localeCompare(String(a.createdAt ?? a.updatedAt ?? '')));

    const start = (query.page - 1) * query.limit;
    const pageUsers = users.slice(start, start + query.limit);
    const data = await Promise.all(pageUsers.map(async user => {
      const profile = await db.collection(COLLECTIONS.CUSTOMERS).doc(user.id).get();
      return {
        ...user,
        ...(profile.exists ? profile.data() : {}),
        id: user.id,
        role: 'customer',
        isActive: user.isActive !== false,
      };
    }));

    return reply.send({
      success: true,
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total: users.length,
        hasMore: start + query.limit < users.length,
      },
    });
  });

  /**
   * GET /admin/providers — List providers with optional status filter
   */
  app.get('/providers', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ProviderQuerySchema.parse(request.query);
    const db = getDb();

    // Filter in memory after a single ordered collection read. This avoids
    // requiring a Firestore composite index for status + createdAt.
    const snapshot = await db.collection(COLLECTIONS.PROVIDERS)
      .orderBy('createdAt', 'desc')
      .get();
    const allProviders = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(provider => !query.status || provider.verificationStatus === query.status);
    const start = (query.page - 1) * query.limit;
    const paginated = allProviders.slice(start, start + query.limit);

    return reply.send({
      success: true,
      data: paginated,
      meta: {
        page: query.page,
        limit: query.limit,
        total: allProviders.length,
        hasMore: start + query.limit < allProviders.length,
      },
    });
  });

  /**
   * PUT /admin/providers/:id/verify — Approve or reject provider verification
   */
  app.put('/providers/:id/verify', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const body = VerifyProviderSchema.parse(request.body);
    const db = getDb();
    const providerRef = db.collection(COLLECTIONS.PROVIDERS).doc(id);
    const doc = await providerRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Provider not found.' },
      });
    }

    const before = doc.data() as Provider;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      verificationStatus: body.status,
      verificationNotes: body.notes ?? null,
      updatedAt: now,
    };

    if (body.status === 'approved') {
      updates.verifiedAt = now;
    }

    await providerRef.update(updates);

    // Audit log
    await createAuditLog({
      actorId: request.user!.uid,
      actorRole: request.user!.role,
      action: `PROVIDER_VERIFICATION_${body.status.toUpperCase()}`,
      resourceType: 'provider',
      resourceId: id,
      before: { verificationStatus: before.verificationStatus },
      after: updates,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    const updated = await providerRef.get();
    return reply.send({
      success: true,
      data: { ...updated.data(), id: updated.id },
      message: `Provider status updated to ${body.status}.`,
    });
  });

  /**
   * GET /admin/bookings — All platform bookings with filters
   */
  app.get('/bookings', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = AdminBookingQuerySchema.parse(request.query);
    const db = getDb();

    // Apply optional filters in memory to avoid composite-index-only failures
    // on admin queries that combine status/provider/customer with createdAt.
    const snapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .orderBy('createdAt', 'desc')
      .get();
    let bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Booking[];

    if (query.status) bookings = bookings.filter(booking => booking.status === query.status);
    if (query.providerId) bookings = bookings.filter(booking => booking.providerId === query.providerId);
    if (query.customerId) bookings = bookings.filter(booking => booking.customerId === query.customerId);

    if (query.dateFrom) {
      bookings = bookings.filter(b => dayjs(b.scheduledAt).isAfter(dayjs(query.dateFrom)) || dayjs(b.scheduledAt).isSame(dayjs(query.dateFrom)));
    }
    if (query.dateTo) {
      bookings = bookings.filter(b => dayjs(b.scheduledAt).isBefore(dayjs(query.dateTo)) || dayjs(b.scheduledAt).isSame(dayjs(query.dateTo)));
    }

    const start = (query.page - 1) * query.limit;
    const paginated = bookings.slice(start, start + query.limit);

    return reply.send({
      success: true,
      data: paginated,
      meta: {
        page: query.page,
        limit: query.limit,
        total: bookings.length,
        hasMore: start + query.limit < bookings.length,
      },
    });
  });

  /**
   * GET /admin/analytics/overview — Core platform KPIs
   */
  app.get('/analytics/overview', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();

    const [bookingsSnap, providersSnap, customersSnap, paymentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.BOOKINGS).get(),
      db.collection(COLLECTIONS.PROVIDERS).get(),
      db.collection(COLLECTIONS.CUSTOMERS).get(),
      db.collection(COLLECTIONS.PAYMENTS).where('status', '==', 'captured').get(),
    ]);

    let totalGrossRevenue = 0;
    let totalCommissionRevenue = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    bookingsSnap.forEach(doc => {
      const b = doc.data() as Booking;
      if (b.status === 'completed') {
        completedBookings++;
        totalGrossRevenue += b.pricing?.totalAmount ?? 0;
        totalCommissionRevenue += b.commission?.amount ?? 0;
      } else if (b.status?.includes('cancelled')) {
        cancelledBookings++;
      }
    });

    let verifiedProviders = 0;
    let pendingProviders = 0;

    providersSnap.forEach(doc => {
      const p = doc.data() as Provider;
      if (p.verificationStatus === 'approved') verifiedProviders++;
      if (p.verificationStatus === 'pending') pendingProviders++;
    });

    return reply.send({
      success: true,
      data: {
        kpis: {
          totalBookings: bookingsSnap.size,
          completedBookings,
          cancelledBookings,
          totalCustomers: customersSnap.size,
          totalProviders: providersSnap.size,
          verifiedProviders,
          pendingProviders,
          grossMerchandiseValue: totalGrossRevenue, // in paisa
          commissionRevenue: totalCommissionRevenue, // in paisa
          capturedPaymentsCount: paymentsSnap.size,
        },
        currency: 'INR',
        generatedAt: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /admin/payments — All platform payments
   */
  app.get('/payments', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    const { status } = request.query;

    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.PAYMENTS)
      .orderBy('createdAt', 'desc')
      .get();
    const all = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(payment => !status || payment.status === status);
    const start = (page - 1) * limit;

    return reply.send({
      success: true,
      data: all.slice(start, start + limit),
      meta: { page, limit, total: all.length, hasMore: start + limit < all.length },
    });
  });

  /**
   * GET /admin/settlements — All settlements
   */
  app.get('/settlements', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);
    const { status } = request.query;

    const db = getDb();
    let q = db.collection(COLLECTIONS.SETTLEMENTS).orderBy('createdAt', 'desc');
    if (status) {
      q = q.where('status', '==', status) as typeof q;
    }

    const snapshot = await q.limit(limit * page).get();
    const all = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const start = (page - 1) * limit;

    return reply.send({
      success: true,
      data: all.slice(start, start + limit),
      meta: { page, limit, total: all.length, hasMore: start + limit < all.length },
    });
  });

  /**
   * POST /admin/commissions/config — Configure commission rate for service category
   */
  app.post('/commissions/config', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CommissionConfigSchema.parse(request.body);
    const db = getDb();
    const catRef = db.collection(COLLECTIONS.SERVICE_CATEGORIES).doc(body.categoryId);
    const doc = await catRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Category not found.' },
      });
    }

    const before = doc.data() as ServiceCategory;
    await catRef.update({
      commissionRate: body.commissionRate,
      updatedAt: new Date().toISOString(),
    });

    await createAuditLog({
      actorId: request.user!.uid,
      actorRole: request.user!.role,
      action: 'UPDATE_COMMISSION_CONFIG',
      resourceType: 'serviceCategory',
      resourceId: body.categoryId,
      before: { commissionRate: before.commissionRate },
      after: { commissionRate: body.commissionRate },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: { categoryId: body.categoryId, commissionRate: body.commissionRate },
      message: 'Commission rate updated successfully.',
    });
  });

  /**
   * GET /admin/audit-logs — Paginated audit logs
   */
  app.get('/audit-logs', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 25);
    const db = getDb();

    const snapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
      .orderBy('createdAt', 'desc')
      .limit(limit * page)
      .get();

    const all = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const start = (page - 1) * limit;

    return reply.send({
      success: true,
      data: all.slice(start, start + limit),
      meta: { page, limit, total: all.length, hasMore: start + limit < all.length },
    });
  });

  /**
   * POST /admin/coupons — Create a discount coupon
   */
  app.post('/coupons', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreateCouponSchema.parse(request.body);
    const db = getDb();

    // Check duplicate code
    const existing = await db.collection(COLLECTIONS.COUPONS).where('code', '==', body.code).limit(1).get();
    if (!existing.empty) {
      return reply.status(409).send({
        success: false,
        error: { code: 'RES_002', message: 'A coupon with this code already exists.' },
      });
    }

    const id = nanoid();
    const now = new Date().toISOString();

    const coupon: Coupon = {
      id,
      ...body,
      usedCount: 0,
      createdAt: now,
    };

    await db.collection(COLLECTIONS.COUPONS).doc(id).set(coupon);

    await createAuditLog({
      actorId: request.user!.uid,
      actorRole: request.user!.role,
      action: 'CREATE_COUPON',
      resourceType: 'coupon',
      resourceId: id,
      after: coupon as unknown as Record<string, unknown>,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send({ success: true, data: coupon });
  });

  /**
   * PUT /admin/coupons/:id — Update coupon
   */
  app.put('/coupons/:id', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const body = UpdateCouponSchema.parse(request.body);
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.COUPONS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Coupon not found.' },
      });
    }

    await docRef.update(body);
    const updated = await docRef.get();

    return reply.send({ success: true, data: { ...updated.data(), id: updated.id } });
  });

  /**
   * DELETE /admin/coupons/:id — Deactivate coupon
   */
  app.delete('/coupons/:id', {
    schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.COUPONS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Coupon not found.' },
      });
    }

    await docRef.update({ isActive: false });
    return reply.send({ success: true, message: 'Coupon deactivated.' });
  });
}
