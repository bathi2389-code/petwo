import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getAuth, getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, authenticateVerifiedFirebaseUser } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CustomerProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  pet: z.object({
    name: z.string().trim().min(1).max(50),
    species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
    breed: z.string().trim().min(1).max(100),
    gender: z.enum(['male', 'female', 'unknown']),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance): Promise<void> {

  app.post('/customer/profile', {
    preHandler: [authenticateVerifiedFirebaseUser],
    config: { rateLimit: { max: 10, timeWindow: 15 * 60 * 1000 } },
  }, async (request, reply) => {
    const parsed = CustomerProfileSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(422).send({ success: false, error: { code: 'VAL_001', message: 'Enter a valid customer name and pet profile.' } });
    const identity = request.firebaseIdentity!;
    const db = getDb();
    const provider = await db.collection(COLLECTIONS.PROVIDERS).where('contact.email', '==', identity.email).limit(1).get();
    if (!provider.empty) return reply.status(409).send({ success: false, error: { code: 'AUTH_003', message: 'This email belongs to a provider account.' } });
    const userRef = db.collection(COLLECTIONS.USERS).doc(identity.uid);
    const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(identity.uid);
    const duplicate = await db.collection(COLLECTIONS.CUSTOMERS).where('email', '==', identity.email).limit(1).get();
    if (!duplicate.empty && duplicate.docs[0].id !== identity.uid) return reply.status(409).send({ success: false, error: { code: 'AUTH_003', message: 'A customer profile already exists for this email. Contact support to link it safely.' } });
    const now = new Date().toISOString();
    const displayName = parsed.data.displayName;
    const nameParts = displayName.split(/\s+/);
    const petId = nanoid();
    const petRef = db.collection(COLLECTIONS.PETS).doc(petId);
    const result = await db.runTransaction(async (transaction) => {
      const [userDoc, customerDoc] = await Promise.all([transaction.get(userRef), transaction.get(customerRef)]);
      if (userDoc.exists && userDoc.data()?.role !== 'customer') return { error: 'role-conflict' as const };
      if (userDoc.exists && userDoc.data()?.isActive === false) return { error: 'inactive' as const };
      transaction.set(userRef, { id: identity.uid, email: identity.email, isEmailVerified: true, displayName, role: 'customer', isActive: true, ...(userDoc.exists ? { updatedAt: now } : { createdAt: now, updatedAt: now }) }, { merge: true });
      transaction.set(customerRef, { id: identity.uid, userId: identity.uid, firstName: nameParts[0], lastName: nameParts.slice(1).join(' '), email: identity.email, updatedAt: now, ...(!customerDoc.exists ? { savedProviders: [], notificationPreferences: { bookingUpdates: true, promotions: true, reminders: true, sms: false, email: true, push: true }, createdAt: now } : {}) }, { merge: true });
      if (!customerDoc.exists && parsed.data.pet) transaction.create(petRef, { id: petId, ownerId: identity.uid, ...parsed.data.pet, isActive: true, createdAt: now, updatedAt: now });
      return { isNewUser: !customerDoc.exists };
    });
    if ('error' in result) return reply.status(result.error === 'inactive' ? 403 : 409).send({ success: false, error: { code: result.error === 'inactive' ? 'AUTH_004' : 'AUTH_003', message: result.error === 'inactive' ? 'This account is deactivated. Contact PETWO support.' : 'This email is reserved for another account type.' } });
    return reply.send({ success: true, data: { role: 'customer', uid: identity.uid, isNewUser: result.isNewUser } });
  });

  /**
   * GET /auth/me
   * Get current authenticated user's profile
   */
  app.get('/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user info',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(request.user!.uid).get();

    if (!userDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'User not found.' },
      });
    }

    return reply.send({ success: true, data: { ...userDoc.data(), id: userDoc.id } });
  });

  /**
   * POST /auth/logout
   * Revoke all refresh tokens (Firebase side)
   */
  app.post('/logout', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout and revoke tokens',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    await getAuth().revokeRefreshTokens(request.user!.uid);
    return reply.send({ success: true, data: { message: 'Logged out successfully.' } });
  });
}

