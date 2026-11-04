import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from './webhook.routes';
import { authenticate, isCustomer, isProvider, isAdmin, isProviderOrAdmin } from '../../middleware/auth.middleware';
import { generateBookingNumber, computeCommission } from '../../utils/helpers';
import { BOOKING as BOOKING_CONFIG } from '@petwo/shared';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { Booking, BookingStatus, BookingPricing, CommissionDetails, Service, Provider } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateBookingSchema = z.object({
  petId: z.string().min(1),
  providerId: z.string().min(1),
  locationId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().optional(),
  bookingType: z.enum(['appointment', 'boarding', 'home_service']).default('appointment'),
  scheduledAt: z.string().datetime(),
  // Boarding
  checkOutAt: z.string().datetime().optional(),
  // Home service
  serviceAddress: z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string().length(6),
    country: z.literal('IN'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }).optional(),
  couponCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
  specialInstructions: z.string().max(1000).optional(),
});

const CancelBookingSchema = z.object({
  reason: z.string().min(5).max(500),
});

const RescheduleBookingSchema = z.object({
  scheduledAt: z.string().datetime(),
  staffId: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['confirmed', 'in_progress', 'completed', 'no_show']),
  note: z.string().max(500).optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function bookingRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /bookings — Create a new booking
   */
  app.post('/', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const data = parsed.data;
    const db = getDb();
    const customerId = request.user!.uid;

    // ── Validate pet ownership ──
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(data.petId).get();
    if (!petDoc.exists || petDoc.data()!.ownerId !== customerId) {
      return reply.status(403).send({
        success: false,
        error: { code: 'BKG_005', message: 'Pet does not belong to this customer.' },
      });
    }

    // ── Validate provider is verified ──
    const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(data.providerId).get();
    if (!providerDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Provider not found.' },
      });
    }

    const provider = providerDoc.data() as Provider;
    if (provider.verificationStatus !== 'approved') {
      return reply.status(400).send({
        success: false,
        error: { code: 'PRV_001', message: 'Provider is not verified.' },
      });
    }

    // ── Validate service ──
    const serviceDoc = await db.collection(COLLECTIONS.SERVICES).doc(data.serviceId).get();
    if (!serviceDoc.exists || !serviceDoc.data()!.isActive) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Service not found or inactive.' },
      });
    }

    const service = serviceDoc.data() as Service;

    // ── Check slot availability ──
    const scheduledAt = dayjs(data.scheduledAt);
    const scheduledEnd = scheduledAt.add(service.duration || 60, 'minute');

    if (scheduledAt.isBefore(dayjs())) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BKG_001', message: 'Cannot book in the past.' },
      });
    }

    if (scheduledAt.isAfter(dayjs().add(BOOKING_CONFIG.ADVANCE_BOOKING_DAYS, 'day'))) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BKG_001',
          message: `Bookings can only be made up to ${BOOKING_CONFIG.ADVANCE_BOOKING_DAYS} days in advance.`,
        },
      });
    }

    // ── Calculate pricing ──
    const serviceAmount = service.price.amount; // in paisa
    const taxAmount = Math.round(serviceAmount * 0.18); // 18% GST

    // Validate and apply coupon if provided
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;

    if (data.couponCode) {
      const couponResult = await validateAndApplyCoupon(
        data.couponCode,
        customerId,
        serviceAmount,
        data.serviceId,
        data.providerId,
        db,
      );

      if (!couponResult.success) {
        return reply.status(400).send({
          success: false,
          error: { code: couponResult.code!, message: couponResult.message! },
        });
      }

      discountAmount = couponResult.discountAmount!;
      appliedCouponCode = data.couponCode.toUpperCase();
    }

    const totalAmount = Math.max(0, serviceAmount + taxAmount - discountAmount);

    // ── Fetch service category commission rate ──
    const categoryDoc = await db.collection(COLLECTIONS.SERVICE_CATEGORIES).doc(service.categoryId).get();
    const commissionRate = categoryDoc.exists
      ? categoryDoc.data()!.commissionRate
      : 15; // Default 15%

    const { commissionAmount, taxOnCommission, netProviderAmount } = computeCommission(
      totalAmount,
      commissionRate,
    );

    // ── Prepare booking payload ──
    const id = nanoid();
    const now = new Date().toISOString();

    const pricing: BookingPricing = {
      serviceAmount,
      taxAmount,
      discountAmount,
      couponCode: appliedCouponCode,
      totalAmount,
      currency: 'INR',
    };

    const commission: CommissionDetails = {
      rate: commissionRate,
      amount: commissionAmount,
      taxOnCommission,
      netProviderAmount,
      settled: false,
    };

    const booking: Booking = {
      id,
      bookingNumber: generateBookingNumber(),
      bookingType: data.bookingType,
      customerId,
      petId: data.petId,
      providerId: data.providerId,
      locationId: data.locationId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      status: 'pending_confirmation',
      scheduledAt: scheduledAt.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      checkOutAt: data.checkOutAt,
      serviceAddress: data.serviceAddress,
      notes: data.notes,
      specialInstructions: data.specialInstructions,
      pricing,
      commission,
      history: [{
        status: 'pending_confirmation',
        timestamp: now,
        actor: customerId,
      }],
      createdAt: now,
      updatedAt: now,
    };

    // ── Atomic Slot Hold & Concurrency Control via Firestore Transaction ──
    const slotKey = `slot_${data.providerId}_${data.locationId}_${data.staffId || 'any'}_${scheduledAt.unix()}`;
    const slotLockRef = db.collection('slotLocks').doc(slotKey);

    try {
      await db.runTransaction(async (transaction) => {
        const slotDoc = await transaction.get(slotLockRef);
        if (slotDoc.exists) {
          const slotData = slotDoc.data();
          const lockExpires = slotData?.expiresAt ? dayjs(slotData.expiresAt) : null;
          if (lockExpires && lockExpires.isAfter(dayjs()) && slotData?.status !== 'released') {
            throw new Error('SLOT_LOCKED');
          }
        }

        // Query active overlapping bookings
        const conflictingSnapshot = await db.collection(COLLECTIONS.BOOKINGS)
          .where('providerId', '==', data.providerId)
          .where('locationId', '==', data.locationId)
          .where('status', 'in', ['confirmed', 'in_progress'])
          .get();

        const hasConflict = conflictingSnapshot.docs.some(doc => {
          const b = doc.data() as Booking;
          if (data.staffId && b.staffId && b.staffId !== data.staffId) return false;
          const bStart = dayjs(b.scheduledAt);
          const bEnd = dayjs(b.scheduledEnd);
          return scheduledAt.isBefore(bEnd) && scheduledEnd.isAfter(bStart);
        });

        if (hasConflict) {
          throw new Error('SLOT_CONFLICT');
        }

        // Atomic lock document write
        transaction.set(slotLockRef, {
          slotKey,
          bookingId: id,
          customerId,
          providerId: data.providerId,
          locationId: data.locationId,
          staffId: data.staffId || null,
          scheduledAt: scheduledAt.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          status: 'held',
          expiresAt: dayjs().add(15, 'minute').toISOString(),
          createdAt: now,
        });

        // Write the booking document atomically in the same transaction
        transaction.set(db.collection(COLLECTIONS.BOOKINGS).doc(id), booking);
      });
    } catch (err: any) {
      if (err.message === 'SLOT_LOCKED' || err.message === 'SLOT_CONFLICT') {
        return reply.status(409).send({
          success: false,
          error: { code: 'BKG_001', message: 'Selected time slot is not available or currently locked by another customer.' },
        });
      }
      throw err;
    }

    // Increment coupon usage count asynchronously
    if (appliedCouponCode) {
      const { FieldValue } = await import('firebase-admin/firestore');
      db.collection(COLLECTIONS.COUPONS)
        .where('code', '==', appliedCouponCode)
        .get()
        .then(snap => {
          if (!snap.empty) {
            snap.docs[0].ref.update({ usedCount: FieldValue.increment(1) });
          }
        });
    }

    return reply.status(201).send({ success: true, data: booking });
  });

  /**
   * GET /bookings/my — Get customer's bookings
   */
  app.get('/my', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, page = 1, limit = 20 } = request.query as Record<string, string | number>;
    const db = getDb();

    let query = db.collection(COLLECTIONS.BOOKINGS)
      .where('customerId', '==', request.user!.uid)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status) as typeof query;
    }

    const snapshot = await query.limit(Number(limit)).get();
    const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({ success: true, data: bookings, meta: { page: Number(page), limit: Number(limit) } });
  });

  /**
   * GET /bookings/provider — Get provider's bookings
   */
  app.get('/provider', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, date, page = 1, limit = 50 } = request.query as Record<string, string | number>;
    const db = getDb();

    let query = db.collection(COLLECTIONS.BOOKINGS)
      .where('providerId', '==', request.user!.uid)
      .orderBy('scheduledAt', 'asc');

    if (status) {
      query = query.where('status', '==', status) as typeof query;
    }

    if (date) {
      const startOfDay = dayjs(date as string).startOf('day').toISOString();
      const endOfDay = dayjs(date as string).endOf('day').toISOString();
      query = query
        .where('scheduledAt', '>=', startOfDay)
        .where('scheduledAt', '<=', endOfDay) as typeof query;
    }

    const snapshot = await query.limit(Number(limit)).get();
    const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({ success: true, data: bookings, meta: { page: Number(page), limit: Number(limit) } });
  });

  /**
   * GET /bookings/:bookingId — Get booking details
   */
  app.get('/:bookingId', {
    preHandler: [authenticate],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.BOOKINGS).doc(request.params.bookingId).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Booking not found.' },
      });
    }

    const booking = doc.data() as Booking;

    // Access control: customer sees own bookings, provider sees their own
    const user = request.user!;
    if (
      user.role === 'customer' && booking.customerId !== user.uid ||
      user.role === 'provider' && booking.providerId !== user.uid
    ) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    return reply.send({ success: true, data: { ...booking, id: doc.id } });
  });

  /**
   * PUT /bookings/:bookingId/confirm — Provider confirms booking
   */
  app.put('/:bookingId/confirm', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(request.params.bookingId);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }

    const booking = doc.data() as Booking;

    if (booking.providerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    if (booking.status !== 'pending_confirmation') {
      return reply.status(400).send({
        success: false,
        error: { code: 'BKG_002', message: `Cannot confirm booking in status: ${booking.status}.` },
      });
    }

    const now = new Date().toISOString();
    const event = { status: 'confirmed' as BookingStatus, timestamp: now, actor: request.user!.uid };

    await bookingRef.update({
      status: 'confirmed',
      history: [...booking.history, event],
      updatedAt: now,
    });

    // TODO: Send push notification to customer

    return reply.send({ success: true, data: { message: 'Booking confirmed.', bookingId: booking.id } });
  });

  /**
   * PUT /bookings/:bookingId/cancel — Cancel booking (customer or provider)
   */
  app.put('/:bookingId/cancel', {
    preHandler: [authenticate],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = CancelBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(request.params.bookingId);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }

    const booking = doc.data() as Booking;
    const user = request.user!;

    // Access control
    if (user.role === 'customer' && booking.customerId !== user.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }
    if (user.role === 'provider' && booking.providerId !== user.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const cancellableStatuses: BookingStatus[] = ['pending_confirmation', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BKG_002', message: `Cannot cancel booking in status: ${booking.status}.` },
      });
    }

    // Refund eligibility
    const hoursUntilAppointment = dayjs(booking.scheduledAt).diff(dayjs(), 'hour');
    const refundEligible = hoursUntilAppointment >= BOOKING_CONFIG.CANCELLATION_FREE_HOURS;
    const refundAmount = refundEligible ? booking.pricing.totalAmount : 0;

    const cancelledBy = user.role === 'customer' ? 'customer' : 'provider';
    const newStatus: BookingStatus = cancelledBy === 'customer'
      ? 'cancelled_by_customer'
      : 'cancelled_by_provider';

    const now = new Date().toISOString();

    await bookingRef.update({
      status: newStatus,
      cancellation: {
        cancelledBy,
        reason: parsed.data.reason,
        cancelledAt: now,
        refundEligible,
        refundAmount,
      },
      history: [...booking.history, { status: newStatus, timestamp: now, actor: user.uid }],
      updatedAt: now,
    });

    // TODO: Initiate refund if eligible

    return reply.send({
      success: true,
      data: {
        message: 'Booking cancelled.',
        refundEligible,
        refundAmount,
        currency: 'INR',
      },
    });
  });

  /**
   * PUT /bookings/:bookingId/reschedule — Reschedule booking
   */
  app.put('/:bookingId/reschedule', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = RescheduleBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(request.params.bookingId);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }

    const booking = doc.data() as Booking;

    if (booking.customerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    if (!['pending_confirmation', 'confirmed'].includes(booking.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BKG_004', message: 'Booking cannot be rescheduled in its current state.' },
      });
    }

    // Count reschedules in history
    const rescheduleCount = booking.history.filter(h => h.note === 'rescheduled').length;
    if (rescheduleCount >= BOOKING_CONFIG.MAX_RESCHEDULES) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BKG_004', message: `Maximum reschedules (${BOOKING_CONFIG.MAX_RESCHEDULES}) reached.` },
      });
    }

    const serviceDoc = await db.collection(COLLECTIONS.SERVICES).doc(booking.serviceId).get();
    const service = serviceDoc.data() as Service;
    const newStart = dayjs(parsed.data.scheduledAt);
    const newEnd = newStart.add(service.duration || 60, 'minute');

    const now = new Date().toISOString();

    await bookingRef.update({
      scheduledAt: newStart.toISOString(),
      scheduledEnd: newEnd.toISOString(),
      staffId: parsed.data.staffId ?? booking.staffId,
      status: 'pending_confirmation', // Requires provider re-confirmation
      history: [...booking.history, {
        status: 'pending_confirmation' as BookingStatus,
        timestamp: now,
        actor: request.user!.uid,
        note: 'rescheduled',
      }],
      updatedAt: now,
    });

    return reply.send({ success: true, data: { message: 'Booking rescheduled. Awaiting provider confirmation.' } });
  });

  /**
   * PUT /bookings/:bookingId/status — Provider updates booking status
   */
  app.put('/:bookingId/status', {
    preHandler: [authenticate, isProviderOrAdmin],
    schema: { tags: ['Bookings'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = UpdateStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(request.params.bookingId);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }

    const booking = doc.data() as Booking;
    const user = request.user!;

    if (user.role === 'provider' && booking.providerId !== user.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const now = new Date().toISOString();

    await bookingRef.update({
      status: parsed.data.status,
      history: [...booking.history, {
        status: parsed.data.status,
        timestamp: now,
        actor: user.uid,
        note: parsed.data.note,
      }],
      updatedAt: now,
    });

    return reply.send({ success: true, data: { message: `Booking status updated to: ${parsed.data.status}` } });
  });
}

// ─── Coupon Validation Helper ─────────────────────────────────────────────────

async function validateAndApplyCoupon(
  code: string,
  customerId: string,
  orderAmount: number,
  serviceId: string,
  providerId: string,
  db: FirebaseFirestore.Firestore,
): Promise<{
  success: boolean;
  discountAmount?: number;
  code?: string;
  message?: string;
}> {
  const snapshot = await db.collection(COLLECTIONS.COUPONS)
    .where('code', '==', code.toUpperCase())
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { success: false, code: 'CPN_001', message: 'Coupon not found or inactive.' };
  }

  const coupon = snapshot.docs[0].data();
  const now = dayjs();

  if (now.isBefore(dayjs(coupon.validFrom)) || now.isAfter(dayjs(coupon.validTo))) {
    return { success: false, code: 'CPN_002', message: 'Coupon has expired.' };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { success: false, code: 'CPN_003', message: 'Coupon usage limit reached.' };
  }

  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    return {
      success: false,
      code: 'CPN_005',
      message: `Minimum order amount of ₹${coupon.minOrderAmount / 100} required.`,
    };
  }

  if (coupon.applicableProviders?.length && !coupon.applicableProviders.includes(providerId)) {
    return { success: false, code: 'CPN_004', message: 'Coupon not applicable for this provider.' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  return { success: true, discountAmount };
}
