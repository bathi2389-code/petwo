import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider } from '../../middleware/auth.middleware';
import dayjs from 'dayjs';
import type { Booking } from '@petwo/shared';

export default async function queueRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /queue/:locationId — Real-time queue for clinic reception display
   */
  app.get('/:locationId', {
    schema: { tags: ['In-Clinic Queue Display'] },
  }, async (request: any, reply: FastifyReply) => {
    const { locationId } = request.params;
    const db = getDb();

    const todayStr = dayjs().format('YYYY-MM-DD');
    const startOfDay = dayjs().startOf('day').toISOString();
    const endOfDay = dayjs().endOf('day').toISOString();

    // Query active bookings for this location today
    const snapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .where('locationId', '==', locationId)
      .where('scheduledAt', '>=', startOfDay)
      .where('scheduledAt', '<=', endOfDay)
      .orderBy('scheduledAt', 'asc')
      .get();

    const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Booking[];

    const inProgress = bookings.find(b => b.status === 'in_progress');
    const upNext = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending_confirmation')
      .slice(0, 5);

    const completedCount = bookings.filter(b => b.status === 'completed').length;

    // Build TV payload
    const queueData = {
      locationId,
      timestamp: new Date().toISOString(),
      nowServing: inProgress ? {
        bookingId: inProgress.id,
        tokenNumber: `A-${inProgress.bookingNumber.slice(-4)}`,
        room: 'Consultation Suite 1',
        doctorName: 'Dr. Srinivas Rao, MVSc (Surgery)',
        petName: 'Rocky (Golden Retriever)',
        serviceName: 'Comprehensive Clinical Consultation',
        startedAt: inProgress.updatedAt,
      } : {
        tokenNumber: 'READY',
        room: 'Consultation Suite 1',
        doctorName: 'Dr. Srinivas Rao, MVSc',
        petName: 'Next Patient Please Enter',
        serviceName: 'Ready for consultation',
      },
      upNext: upNext.map((b, idx) => ({
        tokenNumber: `A-${b.bookingNumber.slice(-4)}`,
        scheduledTime: dayjs(b.scheduledAt).format('hh:mm A'),
        estimatedWaitMins: (idx + 1) * 15,
        status: b.status,
      })),
      stats: {
        totalToday: bookings.length,
        completedToday: completedCount,
        inWaitingRoom: upNext.length,
      },
      announcement: 'PETWO 24/7 Emergency Care Active • Free Dental Checkups during Pet Health Month in Hyderabad',
    };

    return reply.send({ success: true, data: queueData });
  });

  /**
   * PUT /queue/:locationId/call-next — Advance clinic token queue
   */
  app.put('/:locationId/call-next', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['In-Clinic Queue Display'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { locationId } = request.params;
    const db = getDb();
    const now = new Date().toISOString();

    const snapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .where('locationId', '==', locationId)
      .where('status', '==', 'confirmed')
      .orderBy('scheduledAt', 'asc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return reply.status(404).send({ success: false, message: 'No confirmed appointments waiting in queue.' });
    }

    const nextDoc = snapshot.docs[0];
    await nextDoc.ref.update({
      status: 'in_progress',
      updatedAt: now,
    });

    return reply.send({
      success: true,
      data: {
        bookingId: nextDoc.id,
        tokenNumber: `A-${nextDoc.data().bookingNumber.slice(-4)}`,
        status: 'in_progress',
      },
      message: 'Token called to consultation room.',
    });
  });
}
