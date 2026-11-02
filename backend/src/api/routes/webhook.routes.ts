import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { env } from '../../config/env';
import type { Payment, Booking, PaymentStatus, BookingStatus } from '@petwo/shared';

export default async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // Raw body parser or hook for webhook signature validation if needed
  /**
   * POST /webhooks/razorpay
   * Razorpay Webhook Handler
   */
  app.post('/razorpay', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Razorpay webhook receiver',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['x-razorpay-signature'] as string;

    if (!signature) {
      request.log.warn('Webhook missing x-razorpay-signature header');
      return reply.status(400).send({ error: 'Missing signature' });
    }

    const payloadString = typeof request.body === 'string'
      ? request.body
      : JSON.stringify(request.body);

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    // Constant-time signature verification in production
    if (env.NODE_ENV === 'production') {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        request.log.error('Invalid Razorpay webhook signature');
        return reply.status(400).send({ error: 'Invalid signature' });
      }
    }

    const event = request.body as {
      id?: string;
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            order_id?: string;
            amount: number;
            status: string;
            method?: string;
            error_code?: string;
            error_description?: string;
          };
        };
        refund?: {
          entity?: {
            id: string;
            payment_id: string;
            amount: number;
            status: string;
          };
        };
      };
    };

    const db = getDb();
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const eventId = (request.headers['x-razorpay-event-id'] as string) || event.id || `${eventType}_${paymentEntity?.id || nanoid()}`;

    // Webhook Idempotency: Deduplicate repeated webhooks from gateway retries
    const eventRef = db.collection('webhookEvents').doc(eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      request.log.info({ eventId }, 'Duplicate webhook event received; returning 200 idempotent');
      return reply.status(200).send({ success: true, received: true, duplicate: true });
    }
    await eventRef.set({
      eventId,
      eventType,
      processedAt: new Date().toISOString(),
    });

    request.log.info({ event: eventType, eventId }, 'Processing Razorpay webhook event');

    try {
      if (eventType === 'payment.captured') {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          const paymentSnap = await db.collection(COLLECTIONS.PAYMENTS)
            .where('gatewayOrderId', '==', paymentEntity.order_id)
            .limit(1)
            .get();

          if (!paymentSnap.empty) {
            const paymentDoc = paymentSnap.docs[0];
            const payment = paymentDoc.data() as Payment;
            const now = new Date().toISOString();

            if (payment.status !== 'captured') {
              await paymentDoc.ref.update({
                gatewayPaymentId: paymentEntity.id,
                status: 'captured' as PaymentStatus,
                method: (paymentEntity.method as Payment['method']) ?? 'card',
                updatedAt: now,
              });

              if (payment.bookingId) {
                const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(payment.bookingId);
                const bDoc = await bookingRef.get();
                if (bDoc.exists) {
                  const booking = bDoc.data() as Booking;
                  await bookingRef.update({
                    status: 'confirmed' as BookingStatus,
                    'payment.status': 'captured',
                    'payment.paidAt': now,
                    history: [
                      ...(booking.history || []),
                      {
                        status: 'confirmed' as BookingStatus,
                        timestamp: now,
                        actor: 'webhook:razorpay',
                        note: 'Payment verified via webhook',
                      },
                    ],
                    updatedAt: now,
                  });
                }
              }
            }
          }
        }
      } else if (eventType === 'payment.failed') {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          const paymentSnap = await db.collection(COLLECTIONS.PAYMENTS)
            .where('gatewayOrderId', '==', paymentEntity.order_id)
            .limit(1)
            .get();

          if (!paymentSnap.empty) {
            const paymentDoc = paymentSnap.docs[0];
            const now = new Date().toISOString();

            await paymentDoc.ref.update({
              status: 'failed' as PaymentStatus,
              errorCode: paymentEntity.error_code ?? 'UNKNOWN',
              errorDescription: paymentEntity.error_description ?? 'Payment failed',
              updatedAt: now,
            });
          }
        }
      } else if (eventType === 'refund.processed') {
        const refundEntity = event.payload?.refund?.entity;
        if (refundEntity?.payment_id) {
          const paymentSnap = await db.collection(COLLECTIONS.PAYMENTS)
            .where('gatewayPaymentId', '==', refundEntity.payment_id)
            .limit(1)
            .get();

          if (!paymentSnap.empty) {
            const paymentDoc = paymentSnap.docs[0];
            const payment = paymentDoc.data() as Payment;
            const now = new Date().toISOString();

            await paymentDoc.ref.update({
              status: 'refunded' as PaymentStatus,
              updatedAt: now,
            });

            if (payment.bookingId) {
              await db.collection(COLLECTIONS.BOOKINGS).doc(payment.bookingId).update({
                status: 'refunded' as BookingStatus,
                updatedAt: now,
              });
            }
          }
        }
      }
    } catch (err) {
      request.log.error(err, 'Error processing webhook event');
      // Still return 200 to prevent Razorpay retry loops on internal processing issues
      return reply.status(200).send({ received: true, error: 'Internal processing warning' });
    }

    return reply.status(200).send({ received: true });
  });
}
