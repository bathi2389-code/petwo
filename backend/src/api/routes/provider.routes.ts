import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider, isAdmin, isProviderOrAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Provider, ProviderType, VerificationStatus, ProviderDocument, ProviderSortOption } from '@petwo/shared';
import { haversineDistanceKm, isValidCoordinates, encodeGeohash } from '../../utils/geospatial';
import { calculateRecommendationScore, calculateBayesianRating } from '../../utils/recommendation';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().length(6),
  country: z.literal('IN').default('IN'),
  coordinates: CoordinatesSchema.optional(),
});

const RegisterProviderSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessType: z.enum([
    'individual_vet', 'veterinary_clinic', 'veterinary_hospital',
    'grooming_salon', 'physiotherapy_centre', 'boarding_facility', 'daycare_facility',
    'diagnostic_centre', 'pet_trainer', 'pet_sitter', 'pet_walker',
  ]),
  description: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),
  contact: z.object({
    phone: z.string().min(10),
    email: z.string().email(),
    whatsapp: z.string().optional(),
  }),
  address: AddressSchema.optional(),
  coordinates: CoordinatesSchema.optional(),
  registrationNo: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  gstNumber: z.string().optional(),
});

const UpdateProviderSchema = RegisterProviderSchema.partial().extend({
  description: z.string().max(2000).optional(),
  logoURL: z.string().url().optional(),
  coverPhotoURL: z.string().url().optional(),
  address: AddressSchema.optional(),
  coordinates: CoordinatesSchema.optional(),
});

const SearchProvidersSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(200).default(50),
  category: z.string().optional(),
  businessType: z.string().optional(),
  query: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(['recommended', 'highest_rated', 'nearest', 'most_reviewed']).default('recommended'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const AddLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: AddressSchema,
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

    // Validate and store coordinates & geohash
    const coords = parsed.data.coordinates || parsed.data.address?.coordinates;
    if (coords) {
      if (!isValidCoordinates(coords.lat, coords.lng)) {
        return reply.status(422).send({
          success: false,
          error: { code: 'VAL_002', message: 'Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.' },
        });
      }
      updates.coordinates = { lat: coords.lat, lng: coords.lng };
      updates.geohash = encodeGeohash(coords.lat, coords.lng);
      if (updates.address && typeof updates.address === 'object') {
        (updates.address as any).coordinates = { lat: coords.lat, lng: coords.lng };
      }
    }

    if (hasSensitiveChanges) {
      updates.verificationStatus = 'pending';
      updates.verifiedAt = null;
    }

    await providerRef.update(updates);

    // Keep primary location in sync if address was updated
    if (parsed.data.address) {
      const locSnap = await db.collection(COLLECTIONS.PROVIDER_LOCATIONS)
        .where('providerId', '==', request.user!.uid)
        .where('isPrimary', '==', true)
        .limit(1)
        .get();

      if (!locSnap.empty) {
        await locSnap.docs[0].ref.update({
          address: parsed.data.address,
          updatedAt: new Date().toISOString(),
        });
      }
    }

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

    const { lat, lng, radiusKm, category, businessType, query, minRating, sortBy, page, limit } = parsed.data;
    const db = getDb();

    // Check customer coordinates validity if supplied
    const hasCustomerCoords = lat != null && lng != null;
    if (hasCustomerCoords && !isValidCoordinates(lat, lng)) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_002', message: 'Invalid latitude or longitude provided.' },
      });
    }

    // Query active & approved providers without restrictive DB-level ordering
    // (This guarantees newly verified providers with 0 reviews are NOT dropped)
    let fsQuery = db.collection(COLLECTIONS.PROVIDERS)
      .where('verificationStatus', '==', 'approved')
      .where('isActive', '==', true) as FirebaseFirestore.Query;

    if (businessType) {
      fsQuery = fsQuery.where('businessType', '==', businessType);
    }

    const snapshot = await fsQuery.get();
    let providers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Provider));

    // Calculate distance and recommendation metrics for each provider
    providers = providers.map(p => {
      let distanceKm: number | null = null;
      const pCoords = p.coordinates || p.address?.coordinates;

      if (hasCustomerCoords && pCoords && isValidCoordinates(pCoords.lat, pCoords.lng)) {
        try {
          distanceKm = haversineDistanceKm(lat!, lng!, pCoords.lat, pCoords.lng);
        } catch {
          distanceKm = null;
        }
      }

      // Compute multi-factor recommendation score & Bayesian rating
      const rec = calculateRecommendationScore({
        averageRating: typeof p.rating === 'number' ? p.rating : 4.0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
        verificationStatus: p.verificationStatus,
        reliabilityScore: p.reliabilityScore,
        distanceKm,
        createdAt: p.createdAt,
      });

      return {
        ...p,
        distanceKm: distanceKm ?? undefined,
        weightedRating: rec.weightedRating,
        reliabilityScore: rec.reliabilityScore,
        recommendationScore: rec.recommendationScore,
        isNewProvider: rec.isNewProvider,
      };
    });

    // Distance radius filter (only filters out if customer provided coords AND provider has coords outside radius)
    if (hasCustomerCoords && radiusKm) {
      providers = providers.filter(p => {
        if (p.distanceKm == null) return true; // keep providers without known coords
        return p.distanceKm <= radiusKm;
      });
    }

    // Filter by minRating (evaluated against Bayesian weighted rating or raw rating)
    if (minRating) {
      providers = providers.filter(p => {
        const effectiveRating = p.rating ?? p.weightedRating ?? 0;
        return effectiveRating >= minRating;
      });
    }

    // Text search filter
    if (query) {
      const q = query.toLowerCase();
      providers = providers.filter(p =>
        p.businessName.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.address?.city?.toLowerCase().includes(q) ||
        p.address?.line1?.toLowerCase().includes(q),
      );
    }

    // Sort based on requested option
    switch (sortBy) {
      case 'highest_rated':
        providers.sort((a, b) => {
          const diff = (b.weightedRating ?? 0) - (a.weightedRating ?? 0);
          if (Math.abs(diff) > 0.01) return diff;
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        });
        break;

      case 'nearest':
        providers.sort((a, b) => {
          // Providers with known distance come first in ascending order
          const distA = a.distanceKm != null ? a.distanceKm : Infinity;
          const distB = b.distanceKm != null ? b.distanceKm : Infinity;
          if (distA !== distB) return distA - distB;
          // Tie-break with recommendation score
          return (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);
        });
        break;

      case 'most_reviewed':
        providers.sort((a, b) => {
          const reviewDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
          if (reviewDiff !== 0) return reviewDiff;
          return (b.rating ?? 0) - (a.rating ?? 0);
        });
        break;

      case 'recommended':
      default:
        providers.sort((a, b) => {
          return (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);
        });
        break;
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedProviders = providers.slice(start, start + limit);

    return reply.send({
      success: true,
      data: paginatedProviders,
      meta: {
        total: providers.length,
        page,
        limit,
        hasMore: start + limit < providers.length,
        sortBy,
      },
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
    const { PROVIDER_SUBSCRIPTION_LIMITS } = await import('@petwo/shared');
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

    // Validate coordinates if provided
    if (parsed.data.address.coordinates) {
      const { lat, lng } = parsed.data.address.coordinates;
      if (!isValidCoordinates(lat, lng)) {
        return reply.status(422).send({
          success: false,
          error: { code: 'VAL_002', message: 'Invalid coordinates in location address.' },
        });
      }
    }

    const location = {
      id,
      providerId: request.user!.uid,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...parsed.data,
    };

    await db.collection(COLLECTIONS.PROVIDER_LOCATIONS).doc(id).set(location);

    // If marked as primary or if it's the first location, sync to provider record
    if (parsed.data.isPrimary || existingLocations.empty) {
      const pUpdates: Record<string, unknown> = {
        address: parsed.data.address,
        updatedAt: now,
      };
      if (parsed.data.address.coordinates) {
        pUpdates.coordinates = parsed.data.address.coordinates;
        pUpdates.geohash = encodeGeohash(parsed.data.address.coordinates.lat, parsed.data.address.coordinates.lng);
      }
      await db.collection(COLLECTIONS.PROVIDERS).doc(request.user!.uid).update(pUpdates);
    }

    return reply.status(201).send({ success: true, data: location });
  });

  /**
   * PUT /providers/me/locations/:locationId — Update an existing location
   */
  app.put('/me/locations/:locationId', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Providers'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AddLocationSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const locRef = db.collection(COLLECTIONS.PROVIDER_LOCATIONS).doc(request.params.locationId);
    const doc = await locRef.get();

    if (!doc.exists || doc.data()!.providerId !== request.user!.uid) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Location not found.' } });
    }

    if (parsed.data.address?.coordinates) {
      const { lat, lng } = parsed.data.address.coordinates;
      if (!isValidCoordinates(lat, lng)) {
        return reply.status(422).send({
          success: false,
          error: { code: 'VAL_002', message: 'Invalid coordinates in location address.' },
        });
      }
    }

    const now = new Date().toISOString();
    const updates = {
      ...parsed.data,
      updatedAt: now,
    };

    await locRef.update(updates);

    if (parsed.data.isPrimary || doc.data()!.isPrimary) {
      const pUpdates: Record<string, unknown> = { updatedAt: now };
      if (parsed.data.address) {
        pUpdates.address = parsed.data.address;
        if (parsed.data.address.coordinates) {
          pUpdates.coordinates = parsed.data.address.coordinates;
          pUpdates.geohash = encodeGeohash(parsed.data.address.coordinates.lat, parsed.data.address.coordinates.lng);
        }
      }
      await db.collection(COLLECTIONS.PROVIDERS).doc(request.user!.uid).update(pUpdates);
    }

    const updated = await locRef.get();
    return reply.send({ success: true, data: { ...updated.data(), id: updated.id } });
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
