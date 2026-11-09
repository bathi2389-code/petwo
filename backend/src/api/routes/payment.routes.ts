import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isAdmin } from '../../middleware/auth.middleware';
import { env, isPaymentsEnabled } from '../../config/env';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { Booking, Payment } from '@petwo/shared';

// ─── Razorpay Client ─────────────────────────────────────────────────────────

let razorpayClient: Razorpay | null = null;

/**
 * Returns an initialized Razorpay instance when payments are enabled.
 * Throws if payments are disabled or credentials are missing.
 */
export function getRazorpayClient(): Razorpay {
  if (!isPaymentsEnabled()) {
    throw new Error('Payments are disabled; cannot initialize Razorpay client');
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayClient;
}

/**
 * Injects a mock Razorpay client or resets the singleton for testing.
 */
export function setRazorpayClientForTesting(client: Razorpay | null): void {
  razorpayClient = client;
}

/**
 * Fastify preHandler guard: returns HTTP 503 when payments are disabled.
 */
export async function requirePaymentsEnabled(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!isPaymentsEnabled()) {
    reply.status(503).send({
      success: false,
      error: {
        code: 'PAY_503',
        message: 'Payments are temporarily disabled',
      },
    });
    return;
  }
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  bookingId: z.string().min(1),
});

const VerifyPaymentSchema = z.object({
  bookingId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const RefundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().optional(), // partial refund amount in paisa; omit for full refund
  reason: z.string().min(5).max(200),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function paymentRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /payments/orders
   * Create a Razorpay order for a booking
   */
  app.post('/orders', {
    preHandler: [requirePaymentsEnabled, authenticate, isCustomer],
    schema: { tags: ['Payments'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isPaymentsEnabled()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'PAY_503', message: 'Payments are temporarily disabled' },
      });
    }

    const parsed = CreateOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { bookingId } = parsed.data;
    const db = getDb();

    // Fetch and validate booking
    const bookingDoc = await db.collection(COLLECTIONS.BOOKINGS).doc(bookingId).get();
    if (!bookingDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Booking not found.' },
      });
    }

    const booking = bookingDoc.data() as Booking;

    if (booking.customerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    if (booking.payment?.status === 'captured') {
      return reply.status(409).send({
        success: false,
        error: { code: 'PAY_002', message: 'Payment already completed for this booking.' },
      });
    }

    // Create Razorpay order
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: booking.pricing.totalAmount, // already in paisa
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: {
        bookingId,
        customerId: booking.customerId,
        providerId: booking.providerId,
        platform: 'PETWO',
      },
    });

    // Persist payment record
    const paymentId = nanoid();
    const now = new Date().toISOString();

    const payment: Payment = {
      id: paymentId,
      bookingId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      gateway: 'razorpay',
      gatewayOrderId: order.id,
      amount: booking.pricing.totalAmount,
      currency: 'INR',
      status: 'created',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).set(payment);

    // Update booking with payment reference
    await db.collection(COLLECTIONS.BOOKINGS).doc(bookingId).update({
      payment: {
        paymentId,
        status: 'created',
      },
      updatedAt: now,
    });

    return reply.status(201).send({
      success: true,
      data: {
        orderId: order.id,
        amount: booking.pricing.totalAmount,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID!,
        bookingNumber: booking.bookingNumber,
        prefill: {
          // Frontend can pre-fill customer details
          contact: '', // Don't expose phone in response
        },
      },
    });
  });

  /**
   * POST /payments/verify
   * Verify Razorpay payment signature and capture payment
   */
  app.post('/verify', {
    preHandler: [requirePaymentsEnabled, authenticate, isCustomer],
    schema: { tags: ['Payments'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isPaymentsEnabled()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'PAY_503', message: 'Payments are temporarily disabled' },
      });
    }

    const parsed = VerifyPaymentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    // Verify signature with timing-safe comparison
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const sigBuf = Buffer.from(razorpaySignature, 'utf-8');
    const expBuf = Buffer.from(expectedSignature, 'utf-8');
    const isSignatureValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isSignatureValid) {
      return reply.status(400).send({
        success: false,
        error: { code: 'PAY_003', message: 'Payment signature verification failed.' },
      });
    }

    const db = getDb();

    // Find payment by order ID
    const paymentSnapshot = await db.collection(COLLECTIONS.PAYMENTS)
      .where('gatewayOrderId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (paymentSnapshot.empty) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Payment record not found.' },
      });
    }

    const paymentRef = paymentSnapshot.docs[0].ref;
    const payment = paymentSnapshot.docs[0].data() as Payment;

    if (payment.bookingId !== bookingId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'PAY_003', message: 'Booking ID mismatch.' },
      });
    }

    if (payment.status === 'captured') {
      return reply.status(409).send({
        success: false,
        error: { code: 'PAY_002', message: 'Payment already captured.' },
      });
    }

    // Fetch payment details from Razorpay to get method and other metadata
    const razorpay = getRazorpayClient();
    const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
    const now = new Date().toISOString();

    // Update payment record
    await paymentRef.update({
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      status: 'captured',
      method: rzpPayment.method ?? 'unknown',
      updatedAt: now,
    });

    // Update booking: mark as confirmed and payment captured
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
    const bookingDoc = await bookingRef.get();
    const booking = bookingDoc.data() as Booking;

    await bookingRef.update({
      status: 'confirmed',
      'payment.status': 'captured',
      'payment.paidAt': now,
      history: [...(booking.history || []), {
        status: 'confirmed',
        timestamp: now,
        actor: 'system',
        note: 'Payment captured via Razorpay',
      }],
      updatedAt: now,
    });

    // ── Dispatch Instant WhatsApp Alert to Doctor & Customer (Non-blocking) ──
    try {
      const { WhatsAppService } = await import('../../services/whatsapp.service');
      const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(booking.providerId).get();
      const customerDoc = await db.collection(COLLECTIONS.CUSTOMERS).doc(booking.customerId).get();
      const petDoc = await db.collection(COLLECTIONS.PETS).doc(booking.petId).get();

      const providerData = providerDoc.data();
      const customerData = customerDoc.data();
      const petData = petDoc.data();

      const doctorPhone = providerData?.contactPhone || providerData?.phone;
      if (doctorPhone) {
        WhatsAppService.getInstance().sendBookingConfirmation({
          recipientPhone: doctorPhone,
          customerName: customerData?.name || 'Pet Parent',
          petName: petData?.name || 'Pet',
          bookingNumber: booking.bookingNumber,
          providerName: providerData?.businessName || 'Your Clinic',
          appointmentDate: dayjs(booking.scheduledAt).format('DD MMM YYYY'),
          appointmentTime: dayjs(booking.scheduledAt).format('hh:mm A'),
        }).catch((err) => request.log.warn({ err }, 'WhatsApp alert to doctor failed'));
      }
    } catch (notifyErr) {
      request.log.warn({ notifyErr }, 'Non-blocking doctor notification error');
    }

    return reply.send({
      success: true,
      data: {
        message: 'Payment verified and captured successfully.',
        paymentId: payment.id,
        bookingId,
        amount: payment.amount,
        currency: 'INR',
      },
    });
  });

  /**
   * POST /payments/refund — Initiate a refund (Admin only)
   */
  app.post('/refund', {
    preHandler: [requirePaymentsEnabled, authenticate, isAdmin],
    schema: { tags: ['Payments', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isPaymentsEnabled()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'PAY_503', message: 'Payments are temporarily disabled' },
      });
    }

    const parsed = RefundSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { paymentId, amount, reason } = parsed.data;
    const db = getDb();

    const paymentDoc = await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).get();
    if (!paymentDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Payment not found.' },
      });
    }

    const payment = paymentDoc.data() as Payment;

    if (!['captured'].includes(payment.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'PAY_004', message: 'Payment is not eligible for refund.' },
      });
    }

    if (!payment.gatewayPaymentId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'PAY_004', message: 'No gateway payment ID found.' },
      });
    }

    const refundAmount = amount ?? payment.amount;

    // Create Razorpay refund
    const razorpay = getRazorpayClient();
    const rzpRefund = await razorpay.payments.refund(payment.gatewayPaymentId, {
      amount: refundAmount,
      notes: { reason, initiatedBy: request.user!.uid },
    });

    const refundId = nanoid();
    const now = new Date().toISOString();

    // Record refund
    const { FieldValue } = await import('firebase-admin/firestore');
    await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).update({
      status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
      refunds: FieldValue.arrayUnion({
        id: refundId,
        paymentId,
        gatewayRefundId: rzpRefund.id,
        amount: refundAmount,
        reason,
        status: 'processed',
        initiatedBy: request.user!.uid,
        processedAt: now,
        createdAt: now,
      }),
      updatedAt: now,
    });

    return reply.send({
      success: true,
      data: {
        message: 'Refund initiated successfully.',
        refundId: rzpRefund.id,
        amount: refundAmount,
        currency: 'INR',
      },
    });
  });

  /**
   * GET /payments/:paymentId — Get payment details
   */
  app.get('/:paymentId', {
    preHandler: [authenticate],
    schema: { tags: ['Payments'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.PAYMENTS).doc(request.params.paymentId).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Payment not found.' },
      });
    }

    const payment = doc.data() as Payment;
    const user = request.user!;

    if (user.role === 'customer' && payment.customerId !== user.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }
    if (user.role === 'provider' && payment.providerId !== user.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    return reply.send({ success: true, data: { ...payment, id: doc.id } });
  });
}
