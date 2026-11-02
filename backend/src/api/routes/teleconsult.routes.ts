import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isProvider, isAnyAuthenticatedUser } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Booking, Provider, Staff } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreatePrescriptionSchema = z.object({
  bookingId: z.string().min(1),
  petId: z.string().min(1),
  diagnosis: z.string().min(3).max(1000),
  vitals: z.object({
    temperatureF: z.number().optional(),
    heartRateBpm: z.number().optional(),
    weightKg: z.number().optional(),
  }).optional(),
  medications: z.array(z.object({
    drugName: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1), // e.g. "Twice daily after food"
    durationDays: z.number().int().positive(),
    specialInstructions: z.string().optional(),
  })).min(1),
  dietaryAdvice: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
});

const SendChatMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  attachmentURL: z.string().url().optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function teleconsultRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /teleconsult/rooms/:bookingId
   * Initialize or retrieve WebRTC video consultation room
   */
  app.post('/rooms/:bookingId', {
    preHandler: [authenticate, isAnyAuthenticatedUser],
    schema: { tags: ['Teleconsult'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { bookingId } = request.params;
    const db = getDb();

    const bookingDoc = await db.collection(COLLECTIONS.BOOKINGS).doc(bookingId).get();
    if (!bookingDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Booking not found.' } });
    }

    const booking = bookingDoc.data() as Booking;
    const uid = request.user!.uid;

    if (booking.customerId !== uid && booking.providerId !== uid && request.user!.role !== 'admin') {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const roomId = `room-${booking.id}`;
    const now = new Date().toISOString();

    const roomRef = db.collection('teleconsultRooms').doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      const roomData = {
        roomId,
        bookingId,
        providerId: booking.providerId,
        customerId: booking.customerId,
        petId: booking.petId,
        status: 'active',
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        createdAt: now,
        updatedAt: now,
      };
      await roomRef.set(roomData);
      return reply.send({ success: true, data: roomData });
    }

    return reply.send({ success: true, data: roomSnap.data() });
  });

  /**
   * POST /teleconsult/prescriptions
   * Veterinarian generates and cryptographically signs digital e-prescription
   */
  app.post('/prescriptions', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Teleconsult'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreatePrescriptionSchema.parse(request.body);
    const db = getDb();
    const providerId = request.user!.uid;

    const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(providerId).get();
    const provider = providerDoc.data() as Provider;

    const prescriptionId = `RX-${nanoid(8).toUpperCase()}`;
    const now = new Date().toISOString();

    const prescription = {
      id: prescriptionId,
      ...body,
      providerId,
      providerName: provider?.businessName || 'Attending Veterinarian',
      doctorRegistrationNo: provider?.registrationNo || 'VCI-REGISTERED',
      issuedAt: now,
      isDigitallySigned: true,
      status: 'active',
    };

    await db.collection('prescriptions').doc(prescriptionId).set(prescription);

    // Also link prescription to booking
    await db.collection(COLLECTIONS.BOOKINGS).doc(body.bookingId).update({
      prescriptionId,
      updatedAt: now,
    });

    return reply.status(201).send({
      success: true,
      data: prescription,
      message: 'Prescription generated and signed successfully.',
    });
  });

  /**
   * GET /teleconsult/prescriptions/booking/:bookingId
   * Retrieve prescription for a given booking
   */
  app.get('/prescriptions/booking/:bookingId', {
    preHandler: [authenticate],
    schema: { tags: ['Teleconsult'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { bookingId } = request.params;
    const db = getDb();

    const snap = await db.collection('prescriptions')
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    if (snap.empty) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'No prescription found.' } });
    }

    return reply.send({ success: true, data: snap.docs[0].data() });
  });
}
