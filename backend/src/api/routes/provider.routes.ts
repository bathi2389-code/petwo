import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider, isAdmin, isProviderOrAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Provider, ProviderType, VerificationStatus, ProviderDocument } from '@petco/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterProviderSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessType: z.enum([
    'individual_vet', 'veterinary_clinic', 'veterinary_hospital',
    'grooming_salon', 'boarding_facility', 'daycare_facility',
    'diagnostic_centre', 'pet_trainer', 'pet_sitter', 'pet_walker',
  ]),
  description: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
    whatsapp: z.string().optional(),
  }),
  registrationNo: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  gstNumber: z.string().optional(),
});

const UpdateProviderSchema = RegisterProviderSchema.partial().extend({
  description: z.string().max(2000).optional(),
  logoURL: z.string().url().optional(),
  coverPhotoURL: z.string().url().optional(),
});

const SearchProvidersSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(50).default(10),
  category: z.string().optional(),
  businessType: z.string().optional(),
  query: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const AddLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().length(6),
    country: z.literal('IN'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
  }),
  operatingHours: z.array(z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    isOpen: z.boolean(),
    slots: z.array(z.object({
      start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    })),
  })).length(7),
  amenities: z.array(z.string()).optional(),
  isPrimary: z.boolean().default(false),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function providerRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /providers/register — Register as a new provider
   */
  app.post('/register', {
    preHandler: [authenticate],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterProviderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const { getAuth } = await import('../../config/firebase');
    const userId = request.user!.uid;

    // Check if already registered as provider
    const existing = await db.collection(COLLECTIONS.PROVIDERS).doc(userId).get();
    if (existing.exists) {
      return reply.status(409).send({
        success: false,
        error: { code: 'RES_002', message: 'Provider profile already exists.' },
      });
    }

    const now = new Date().toISOString();
    const provider: Provider = {
      id: userId,
      userId,
      businessName: parsed.data.businessName,
      businessType: parsed.data.businessType as ProviderType,
      description: parsed.data.description,
      tagline: parsed.data.tagline,
      contact: parsed.data.contact,
      verificationStatus: 'pending',
      documents: [],
      registrationNo: parsed.data.registrationNo,
      panNumber: parsed.data.panNumber,
      gstNumber: parsed.data.gstNumber,
      subscription: {
        tier: 'starter',
        status: 'active',
      },
      isFeatured: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.PROVIDERS).doc(userId).set(provider);

    // Update user role to 'provider'
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      role: 'provider',
      updatedAt: now,
    });

    // Update Firebase custom claims
    await getAuth().setCustomUserClaims(userId, { role: 'provider' });

    return reply.status(201).send({ success: true, data: provider });
  });

  /**
   * GET /providers/me — Get authenticated provider's own profile
   */
  app.get('/me', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.PROVIDERS).doc(request.user!.uid).get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Provider profile not found.' } });
    }

    return reply.send({ success: true, data: { ...doc.data(), id: doc.id } });
  });

  /**
   * PUT /providers/me — Update provider profile
   */
  app.put('/me', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = UpdateProviderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const providerRef = db.collection(COLLECTIONS.PROVIDERS).doc(request.user!.uid);
    const doc = await providerRef.get();

    if (!doc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Provider not found.' } });
    }

    // Certain fields require re-verification
    const sensitiveFields = ['businessName', 'businessType', 'registrationNo', 'panNumber', 'gstNumber'];
    const hasSensitiveChanges = sensitiveFields.some(f => f in parsed.data);

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    if (hasSensitiveChanges) {
      updates.verificationStatus = 'pending';
      updates.verifiedAt = null;
    }

    await providerRef.update(updates);
    const updated = await providerRef.get();
    return reply.send({ success: true, data: { ...updated.data(), id: updated.id } });
  });

  /**
   * GET /providers/search — Public search endpoint
   */
  app.get('/search', {
    schema: { tags: ['Providers'] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = SearchProvidersSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Invalid search parameters', details: parsed.error.format() },
      });
    }

    const { category, businessType, query, minRating, page, limit } = parsed.data;
    const db = getDb();

    // Build Firestore query for verified, active providers
    let fsQuery = db.collection(COLLECTIONS.PROVIDERS)
      .where('verificationStatus', '==', 'approved')
      .where('isActive', '==', true)
      .orderBy('rating', 'desc');

    if (businessType) {
      fsQuery = fsQuery.where('businessType', '==', businessType) as typeof fsQuery;
    }

    if (minRating) {
      fsQuery = fsQuery.where('rating', '>=', minRating) as typeof fsQuery;
    }

    const snapshot = await fsQuery.limit(limit * page).get();
    let providers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // Simple text filter (Algolia handles this in production)
    if (query) {
      const q = query.toLowerCase();
      providers = providers.filter(p =>
        (p as Provider).businessName.toLowerCase().includes(q) ||
        (p as Provider).description?.toLowerCase().includes(q) ||
        (p as Provider).tagline?.toLowerCase().includes(q),
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedProviders = providers.slice(start, start + limit);

    return reply.send({
      success: true,
      data: paginatedProviders,
      meta: { total: providers.length, page, limit, hasMore: start + limit < providers.length },
    });
  });

  /**
   * GET /providers/:providerId — Get public provider profile
   */
  app.get('/:providerId', {
    schema: { tags: ['Providers'] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.PROVIDERS).doc(request.params.providerId).get();

    if (!doc.exists || !doc.data()!.isActive) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Provider not found.' } });
    }

    // Remove sensitive fields from public response
    const data = doc.data()!;
    const { bankDetails, gstNumber, panNumber, ...publicData } = data;

    return reply.send({ success: true, data: { ...publicData, id: doc.id } });
  });

  // ─── Locations ─────────────────────────────────────────────────────────────

  /**
   * GET /providers/me/locations
   */
  app.get('/me/locations', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.PROVIDER_LOCATIONS)
      .where('providerId', '==', request.user!.uid)
      .where('isActive', '==', true)
      .get();

    return reply.send({ success: true, data: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
  });

  /**
   * POST /providers/me/locations
   */
  app.post('/me/locations', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = AddLocationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();

    // Check subscription limit
    const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(request.user!.uid).get();
    const provider = providerDoc.data() as Provider;
    const { PROVIDER_SUBSCRIPTION_LIMITS } = await import('@petco/shared');
    const tierLimits = PROVIDER_SUBSCRIPTION_LIMITS[provider.subscription.tier];

    const existingLocations = await db.collection(COLLECTIONS.PROVIDER_LOCATIONS)
      .where('providerId', '==', request.user!.uid)
      .where('isActive', '==', true)
      .get();

    if (existingLocations.size >= tierLimits.maxLocations) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'PRV_003',
          message: `Your ${provider.subscription.tier} plan allows up to ${tierLimits.maxLocations} location(s). Upgrade to add more.`,
        },
      });
    }

    const id = nanoid();
    const now = new Date().toISOString();

    const location = {
      id,
      providerId: request.user!.uid,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...parsed.data,
    };

    await db.collection(COLLECTIONS.PROVIDER_LOCATIONS).doc(id).set(location);
    return reply.status(201).send({ success: true, data: location });
  });

  // ─── Availability ──────────────────────────────────────────────────────────

  /**
   * GET /providers/:providerId/availability
   */
  app.get('/:providerId/availability', {
    schema: { tags: ['Providers'] },
  }, async (request: any, reply: FastifyReply) => {
    const { date, serviceId } = request.query;
    const { providerId } = request.params;
    const db = getDb();

    const targetDate = date ? new Date(date) : new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[targetDate.getDay()];

    // Get provider's primary location schedule
    const locationSnapshot = await db.collection(COLLECTIONS.PROVIDER_LOCATIONS)
      .where('providerId', '==', providerId)
      .where('isPrimary', '==', true)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (locationSnapshot.empty) {
      return reply.send({ success: true, data: { slots: [], date, message: 'No primary location found.' } });
    }

    const location = locationSnapshot.docs[0].data();
    const daySchedule = location.operatingHours?.find((s: { day: string }) => s.day === dayName);

    if (!daySchedule?.isOpen) {
      return reply.send({ success: true, data: { slots: [], date, message: 'Closed on this day.' } });
    }

    // Get existing bookings for this date
    const dateStr = targetDate.toISOString().split('T')[0];
    const bookingSnapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .where('providerId', '==', providerId)
      .where('status', 'in', ['confirmed', 'in_progress', 'pending_confirmation'])
      .get();

    const existingBookings = bookingSnapshot.docs
      .filter(doc => doc.data().scheduledAt.startsWith(dateStr))
      .map(doc => doc.data());

    // Generate 30-min slots from operating hours
    const slots = [];
    for (const slot of daySchedule.slots) {
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      let current = startH * 60 + startM;
      const end = endH * 60 + endM;

      while (current + 30 <= end) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((current + 30) / 60)).padStart(2, '0')}:${String((current + 30) % 60).padStart(2, '0')}`;

        const isBooked = existingBookings.some(b => {
          const bStart = new Date(b.scheduledAt).getHours() * 60 + new Date(b.scheduledAt).getMinutes();
          const bEnd = new Date(b.scheduledEnd).getHours() * 60 + new Date(b.scheduledEnd).getMinutes();
          return current < bEnd && (current + 30) > bStart;
        });

        slots.push({ startTime: slotStart, endTime: slotEnd, isBooked, date: dateStr });
        current += 30;
      }
    }

    return reply.send({ success: true, data: { slots, date: dateStr } });
  });
}
