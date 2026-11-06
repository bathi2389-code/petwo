import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { whatsapp } from '../../services/whatsapp.service';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProviderOrAdmin } from '../../middleware/auth.middleware';
import type { Booking } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SendConfirmationSchema = z.object({ bookingNumber: z.string().min(5) });

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function whatsappRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /whatsapp/webhook — Meta WhatsApp webhook verification challenge
   */
  app.get('/webhook', {
    schema: { tags: ['WhatsApp Integration'] },
  }, async (request: any, reply: FastifyReply) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!verifyToken) {
      return reply.status(503).send('WhatsApp webhook verification is not configured.');
    }

    if (mode === 'subscribe' && token === verifyToken) {
      return reply.status(200).send(challenge);
    }
    return reply.status(403).send('Verification token mismatch');
  });

  /**
   * POST /whatsapp/webhook — Handle incoming WhatsApp interactive button taps
   */
  app.post('/webhook', {
    schema: { tags: ['WhatsApp Integration'] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.body as any;

    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message?.type === 'interactive') {
        const buttonReply = message.interactive?.button_reply?.id;
        const sender = message.from;

        request.log.info({ buttonReply, sender }, 'Received WhatsApp button response');

        if (buttonReply?.startsWith('RESCHEDULE_')) {
          const bookingNumber = buttonReply.replace('RESCHEDULE_', '');
          // Handle reschedule flow via WhatsApp bridge
          request.log.info({ bookingNumber }, 'Triggered WhatsApp reschedule request');
        }
      }
    } catch (err) {
      request.log.warn(err, 'Failed to parse WhatsApp webhook');
    }

    return reply.status(200).send({ status: 'received' });
  });

  /**
   * POST /whatsapp/send-confirmation — Dispatches confirmation template
   */
  app.post('/send-confirmation', {
    preHandler: [authenticate, isProviderOrAdmin],
    schema: { tags: ['WhatsApp Integration'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = SendConfirmationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ success: false, error: { code: 'VAL_001', message: 'Booking number is required.' } });
    }

    const db = getDb();
    const bookingSnapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .where('bookingNumber', '==', parsed.data.bookingNumber)
      .limit(1)
      .get();
    if (bookingSnapshot.empty) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }
    const booking = bookingSnapshot.docs[0].data() as Booking;
    if (request.user!.role === 'provider' && booking.providerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }
    if (booking.status !== 'confirmed') {
      return reply.status(409).send({ success: false, error: { code: 'BKG_002', message: 'Only confirmed bookings can receive a confirmation message.' } });
    }

    const [providerDoc, customerDoc, petDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROVIDERS).doc(booking.providerId).get(),
      db.collection(COLLECTIONS.CUSTOMERS).doc(booking.customerId).get(),
      db.collection(COLLECTIONS.PETS).doc(booking.petId).get(),
    ]);
    const provider = providerDoc.data();
    const customer = customerDoc.data();
    const pet = petDoc.data();
    if (!customer?.phone || !provider || !pet) {
      return reply.status(409).send({ success: false, error: { code: 'BKG_002', message: 'Booking contact details are incomplete.' } });
    }

    try {
      const result = await whatsapp.sendBookingConfirmation({
        recipientPhone: customer.phone,
        customerName: customer.firstName || 'Pet parent',
        petName: pet.name || 'Pet',
        bookingNumber: booking.bookingNumber,
        providerName: provider.businessName || 'Your care provider',
        appointmentDate: new Date(booking.scheduledAt).toLocaleDateString('en-IN'),
        appointmentTime: new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      return reply.send({ success: true, data: result });
    } catch (error) {
      const message = (error as Error).message;
      request.log.warn({ err: { message } }, 'WhatsApp confirmation delivery failed');
      const notConfigured = message.includes('not configured');
      return reply.status(notConfigured ? 503 : 502).send({
        success: false,
        error: { code: notConfigured ? 'MSG_001' : 'MSG_002', message: notConfigured ? 'WhatsApp delivery is not configured.' : 'WhatsApp could not deliver the message.' },
      });
    }
  });
}
