import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isAdmin } from '../../middleware/auth.middleware';
import type { Customer } from '@petco/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  photoURL: z.string().url().optional(),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    country: z.literal('IN'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }).optional(),
  notificationPreferences: z.object({
    bookingUpdates: z.boolean(),
    promotions: z.boolean(),
    reminders: z.boolean(),
    sms: z.boolean(),
    email: z.boolean(),
    push: z.boolean(),
  }).optional(),
});

const SaveProviderSchema = z.object({
  providerId: z.string().min(1),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function customerRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /customers/me
   * Get authenticated customer's profile
   */
  app.get('/me', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Customers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.CUSTOMERS).doc(request.user!.uid).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Customer profile not found.' },
      });
    }

    return reply.send({ success: true, data: { ...doc.data(), id: doc.id } });
  });

  /**
   * PUT /customers/me
   * Update customer profile
   */
  app.put('/me', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Customers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = UpdateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(request.user!.uid);

    const doc = await customerRef.get();
    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Customer profile not found.' },
      });
    }

    const updates = { ...parsed.data, updatedAt: new Date().toISOString() };
    await customerRef.update(updates);

    const updated = await customerRef.get();
    return reply.send({ success: true, data: { ...updated.data(), id: updated.id } });
  });

  /**
   * POST /customers/me/saved-providers
   * Save/unsave a provider
   */
  app.post('/me/saved-providers', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Customers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = SaveProviderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { providerId } = parsed.data;
    const db = getDb();

    // Verify provider exists
    const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(providerId).get();
    if (!providerDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Provider not found.' },
      });
    }

    const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(request.user!.uid);
    const customer = (await customerRef.get()).data() as Customer;

    const isSaved = customer.savedProviders.includes(providerId);
    const { FieldValue } = await import('firebase-admin/firestore');

    if (isSaved) {
      await customerRef.update({
        savedProviders: FieldValue.arrayRemove(providerId),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await customerRef.update({
        savedProviders: FieldValue.arrayUnion(providerId),
        updatedAt: new Date().toISOString(),
      });
    }

    return reply.send({
      success: true,
      data: { saved: !isSaved, providerId },
    });
  });

  /**
   * GET /customers/me/saved-providers
   * Get saved providers list
   */
  app.get('/me/saved-providers', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Customers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const customerDoc = await db.collection(COLLECTIONS.CUSTOMERS).doc(request.user!.uid).get();

    if (!customerDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Customer profile not found.' },
      });
    }

    const { savedProviders } = customerDoc.data() as Customer;

    if (!savedProviders.length) {
      return reply.send({ success: true, data: [] });
    }

    // Fetch all saved providers in parallel
    const providerDocs = await Promise.all(
      savedProviders.map(id => db.collection(COLLECTIONS.PROVIDERS).doc(id).get()),
    );

    const providers = providerDocs
      .filter(doc => doc.exists)
      .map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({ success: true, data: providers });
  });

  /**
   * DELETE /customers/me
   * Soft-delete customer account (GDPR compliance)
   */
  app.delete('/me', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Customers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const { getAuth } = await import('../../config/firebase');
    const now = new Date().toISOString();

    const batch = db.batch();

    // Soft-delete customer
    batch.update(db.collection(COLLECTIONS.CUSTOMERS).doc(request.user!.uid), {
      isActive: false,
      deletedAt: now,
      updatedAt: now,
    });

    // Deactivate user
    batch.update(db.collection(COLLECTIONS.USERS).doc(request.user!.uid), {
      isActive: false,
      deletedAt: now,
      updatedAt: now,
    });

    await batch.commit();

    // Revoke Firebase tokens
    await getAuth().revokeRefreshTokens(request.user!.uid);

    return reply.send({
      success: true,
      data: { message: 'Account deactivated successfully. Data retained for 30 days per policy.' },
    });
  });

  // ─── Admin: Customer Management ─────────────────────────────────────────────

  /**
   * GET /customers — Admin only
   */
  app.get('/', {
    preHandler: [authenticate, isAdmin],
    schema: { tags: ['Customers', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 20, search } = request.query as Record<string, string | number>;
    const db = getDb();

    let query = db.collection(COLLECTIONS.CUSTOMERS).orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const customers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: customers,
      meta: { total: customers.length, page: Number(page), limit: Number(limit) },
    });
  });
}
