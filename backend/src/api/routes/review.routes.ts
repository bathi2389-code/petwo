import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider, isAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Review, Booking } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(150).optional(),
  body: z.string().max(2000).optional(),
  photoURLs: z.array(z.string().url()).max(5).optional(),
});

const ProviderResponseSchema = z.object({
  response: z.string().min(1).max(1000),
});

const AdminStatusSchema = z.object({
  status: z.enum(['published', 'flagged', 'removed']),
  adminNote: z.string().max(500).optional(),
});

const ReviewQuerySchema = z.object({
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function reviewRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /reviews — Public listing of published reviews, filtered by providerId or serviceId
   */
  app.get('/', {
    schema: { tags: ['Reviews'] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = ReviewQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { providerId, serviceId, rating, page, limit } = parsed.data;
    const db = getDb();

    let query = db.collection(COLLECTIONS.REVIEWS)
      .where('status', '==', 'published') as FirebaseFirestore.Query;

    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }
    if (serviceId) {
      query = query.where('serviceId', '==', serviceId);
    }
    if (rating) {
      query = query.where('rating', '==', rating);
    }

    query = query.orderBy('createdAt', 'desc');

    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();
    const reviews = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: reviews,
      meta: { page, limit, hasMore: reviews.length === limit },
    });
  });

  /**
   * GET /reviews/:reviewId — Get a single review (public, only if published)
   */
  app.get('/:reviewId', {
    schema: { tags: ['Reviews'] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.REVIEWS).doc(request.params.reviewId).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Review not found.' },
      });
    }

    const review = doc.data() as Review;

    // Non-admins can only see published reviews publicly
    if (review.status !== 'published') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Review not found.' },
      });
    }

    return reply.send({ success: true, data: { ...review, id: doc.id } });
  });

  /**
   * POST /reviews — Submit a review (customer who completed booking only, one per booking)
   */
  app.post('/', {
    preHandler: [authenticate],
    schema: { tags: ['Reviews'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const data = parsed.data;
    const db = getDb();
    const userId = request.user!.uid;

    // Must be a customer
    if (request.user!.role !== 'customer') {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Only customers can submit reviews.' },
      });
    }

    // ── Validate booking ──
    const bookingDoc = await db.collection(COLLECTIONS.BOOKINGS).doc(data.bookingId).get();
    if (!bookingDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Booking not found.' },
      });
    }

    const booking = bookingDoc.data() as Booking;

    // Booking must belong to this customer
    if (booking.customerId !== userId) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'This booking does not belong to you.' },
      });
    }

    // Booking must be completed
    if (booking.status !== 'completed') {
      return reply.status(400).send({
        success: false,
        error: { code: 'RES_003', message: 'Reviews can only be submitted for completed bookings.' },
      });
    }

    // One review per booking: check for existing review
    const existingSnap = await db.collection(COLLECTIONS.REVIEWS)
      .where('bookingId', '==', data.bookingId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return reply.status(409).send({
        success: false,
        error: { code: 'RES_002', message: 'A review for this booking already exists.' },
      });
    }

    const id = nanoid();
    const now = new Date().toISOString();

    const review: Review = {
      id,
      bookingId: data.bookingId,
      customerId: userId,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      rating: data.rating,
      title: data.title,
      body: data.body,
      photoURLs: data.photoURLs,
      status: 'pending', // Requires admin publish
      isVerified: true,  // Linked to actual completed booking
      helpfulCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.REVIEWS).doc(id).set(review);

    // Update booking with rating snapshot
    await db.collection(COLLECTIONS.BOOKINGS).doc(data.bookingId).update({
      rating: {
        score: data.rating,
        review: data.body,
        ratedAt: now,
        isPublic: true,
      },
      updatedAt: now,
    });

    return reply.status(201).send({ success: true, data: review });
  });

  /**
   * PUT /reviews/:reviewId/response — Provider responds to a review
   */
  app.put('/:reviewId/response', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Reviews'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = ProviderResponseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(request.params.reviewId);
    const doc = await reviewRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Review not found.' },
      });
    }

    const review = doc.data() as Review;

    // Only the provider whose review this belongs to can respond
    if (review.providerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    if (review.status !== 'published') {
      return reply.status(400).send({
        success: false,
        error: { code: 'RES_003', message: 'Can only respond to published reviews.' },
      });
    }

    const now = new Date().toISOString();
    await reviewRef.update({
      providerResponse: parsed.data.response,
      providerRespondedAt: now,
      updatedAt: now,
    });

    return reply.send({ success: true, data: { message: 'Response submitted successfully.' } });
  });

  /**
   * PUT /reviews/:reviewId/status — Admin: publish, flag, or remove a review
   */
  app.put('/:reviewId/status', {
    preHandler: [authenticate, isAdmin],
    schema: { tags: ['Reviews', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AdminStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(request.params.reviewId);
    const doc = await reviewRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Review not found.' },
      });
    }

    const now = new Date().toISOString();
    await reviewRef.update({
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
      updatedAt: now,
    });

    // When a review is published, recompute provider's average rating asynchronously
    if (parsed.data.status === 'published') {
      const review = doc.data() as Review;
      recomputeProviderRating(review.providerId, db).catch(() => {});
    }

    return reply.send({
      success: true,
      data: { message: `Review status updated to: ${parsed.data.status}` },
    });
  });

  /**
   * POST /reviews/:reviewId/helpful — Mark a review as helpful (authenticated users)
   */
  app.post('/:reviewId/helpful', {
    preHandler: [authenticate],
    schema: { tags: ['Reviews'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(request.params.reviewId);
    const doc = await reviewRef.get();

    if (!doc.exists || (doc.data() as Review).status !== 'published') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Review not found.' },
      });
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    await reviewRef.update({
      helpfulCount: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });

    return reply.send({ success: true, data: { message: 'Marked as helpful.' } });
  });
}

// ─── Helper: Recompute Provider Rating ────────────────────────────────────────

async function recomputeProviderRating(
  providerId: string,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  const snap = await db.collection(COLLECTIONS.REVIEWS)
    .where('providerId', '==', providerId)
    .where('status', '==', 'published')
    .get();

  if (snap.empty) return;

  const total = snap.docs.reduce((sum, doc) => sum + (doc.data() as Review).rating, 0);
  const average = Math.round((total / snap.size) * 10) / 10;

  await db.collection(COLLECTIONS.PROVIDERS).doc(providerId).update({
    rating: average,
    reviewCount: snap.size,
    updatedAt: new Date().toISOString(),
  });
}
