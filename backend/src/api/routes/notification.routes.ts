import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Notification } from '@petco/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['android', 'ios', 'web']).optional(),
});

const NotificationQuerySchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function notificationRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /notifications/me — Get authenticated user's notifications (paginated)
   */
  app.get('/me', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = NotificationQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { isRead, page, limit } = parsed.data;
    const db = getDb();
    const userId = request.user!.uid;

    let query = db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId) as FirebaseFirestore.Query;

    if (isRead !== undefined) {
      query = query.where('isRead', '==', isRead === 'true');
    }

    query = query.orderBy('createdAt', 'desc');

    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();
    const notifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // Count unread notifications for the badge count
    const unreadSnap = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    return reply.send({
      success: true,
      data: notifications,
      meta: {
        page,
        limit,
        hasMore: notifications.length === limit,
        unreadCount: unreadSnap.size,
      },
    });
  });

  /**
   * PUT /notifications/:id/read — Mark a single notification as read
   */
  app.put('/:id/read', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(request.params.id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Notification not found.' },
      });
    }

    const notification = doc.data() as Notification;

    if (notification.userId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    if (notification.isRead) {
      return reply.send({ success: true, data: { message: 'Notification already marked as read.' } });
    }

    const now = new Date().toISOString();
    await notifRef.update({ isRead: true, readAt: now });

    return reply.send({ success: true, data: { message: 'Notification marked as read.' } });
  });

  /**
   * PUT /notifications/read-all — Mark all of the user's notifications as read
   */
  app.put('/read-all', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const userId = request.user!.uid;
    const now = new Date().toISOString();

    const unreadSnap = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    if (unreadSnap.empty) {
      return reply.send({ success: true, data: { message: 'No unread notifications.', updated: 0 } });
    }

    // Batch update — Firestore batch supports up to 500 writes
    const BATCH_SIZE = 500;
    let updated = 0;

    for (let i = 0; i < unreadSnap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = unreadSnap.docs.slice(i, i + BATCH_SIZE);
      for (const doc of chunk) {
        batch.update(doc.ref, { isRead: true, readAt: now });
      }
      await batch.commit();
      updated += chunk.length;
    }

    return reply.send({ success: true, data: { message: 'All notifications marked as read.', updated } });
  });

  /**
   * DELETE /notifications/:id — Delete a notification (owner only)
   */
  app.delete('/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(request.params.id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Notification not found.' },
      });
    }

    const notification = doc.data() as Notification;

    if (notification.userId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    await notifRef.delete();

    return reply.send({ success: true, data: { message: 'Notification deleted.' } });
  });

  /**
   * POST /notifications/register-token — Save FCM device token to user doc
   */
  app.post('/register-token', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { token, platform } = parsed.data;
    const db = getDb();
    const userId = request.user!.uid;

    const { FieldValue } = await import('firebase-admin/firestore');

    // Store FCM tokens as an array on the user doc (deduplicate using arrayUnion)
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      fcmTokens: FieldValue.arrayUnion({
        token,
        platform: platform ?? 'android',
        registeredAt: new Date().toISOString(),
      }),
      updatedAt: new Date().toISOString(),
    });

    return reply.send({ success: true, data: { message: 'Device token registered successfully.' } });
  });

  /**
   * DELETE /notifications/unregister-token — Remove an FCM token (e.g., on logout)
   */
  app.delete('/unregister-token', {
    preHandler: [authenticate],
    schema: { tags: ['Notifications'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { token, platform } = parsed.data;
    const db = getDb();
    const userId = request.user!.uid;

    const { FieldValue } = await import('firebase-admin/firestore');

    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      fcmTokens: FieldValue.arrayRemove({
        token,
        platform: platform ?? 'android',
      }),
      updatedAt: new Date().toISOString(),
    });

    return reply.send({ success: true, data: { message: 'Device token removed.' } });
  });
}
