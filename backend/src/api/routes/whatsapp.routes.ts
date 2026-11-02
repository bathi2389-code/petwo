import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { whatsapp } from '../../services/whatsapp.service';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProviderOrAdmin } from '../../middleware/auth.middleware';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SendCustomAlertSchema = z.object({
  recipientPhone: z.string().min(10),
  customerName: z.string().min(2),
  petName: z.string().min(1),
  bookingNumber: z.string().min(5),
  providerName: z.string().min(2),
  appointmentDate: z.string().min(3),
  appointmentTime: z.string().min(3),
});

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

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'petwo_whatsapp_token_2026';

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
    const body = SendCustomAlertSchema.parse(request.body);

    const result = await whatsapp.sendBookingConfirmation(body);
    return reply.send({ success: true, data: result });
  });
}
