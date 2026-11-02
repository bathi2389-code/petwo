import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider, isAdmin } from '../../middleware/auth.middleware';
import { PROVIDER_SUBSCRIPTION_LIMITS } from '@petwo/shared';
import { nanoid } from 'nanoid';
import type { Service, Provider } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateServiceSchema = z.object({
  locationId: z.string().min(1),
  categoryId: z.string().min(1),
  staffIds: z.array(z.string()).optional(),
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  price: z.object({
    amount: z.number().int().positive(), // in paisa
    currency: z.literal('INR').default('INR'),
    priceType: z.enum(['fixed', 'starting_from', 'per_hour', 'per_night']),
  }),
  duration: z.number().int().min(0).max(1440), // minutes, 0 = TBD
  bufferTime: z.number().int().min(0).max(120).optional(),
  maxCapacity: z.number().int().positive().optional(),
  allowedPetSpecies: z.array(
    z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  ).optional(),
  tags: z.array(z.string()).max(10).optional(),
  imageURLs: z.array(z.string().url()).max(5).optional(),
  isFeatured: z.boolean().default(false),
});

const UpdateServiceSchema = CreateServiceSchema.partial().omit({ locationId: true });

const ServiceQuerySchema = z.object({
  providerId: z.string().optional(),
  locationId: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function serviceRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /services — Public listing of services (filterable by providerId or locationId)
   */
  app.get('/', {
    schema: { tags: ['Services'] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = ServiceQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { providerId, locationId, categoryId, isActive, page, limit } = parsed.data;
    const db = getDb();

    let query = db.collection(COLLECTIONS.SERVICES) as FirebaseFirestore.Query;

    // For public listing, only show active services by default
    const activeFilter = isActive !== undefined ? isActive : true;
    query = query.where('isActive', '==', activeFilter);

    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }
    if (locationId) {
      query = query.where('locationId', '==', locationId);
    }
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    query = query.orderBy('createdAt', 'desc');

    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();
    const services = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: services,
      meta: { page, limit, total: services.length, hasMore: services.length === limit },
    });
  });

  /**
   * GET /services/:serviceId — Get a single service (public)
   */
  app.get('/:serviceId', {
    schema: { tags: ['Services'] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.SERVICES).doc(request.params.serviceId).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Service not found.' },
      });
    }

    return reply.send({ success: true, data: { ...doc.data(), id: doc.id } });
  });

  /**
   * POST /services — Create a new service (provider only)
   */
  app.post('/', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Services'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const data = parsed.data;
    const db = getDb();
    const providerId = request.user!.uid;

    // ── Fetch provider to check subscription limits ──
    const providerDoc = await db.collection(COLLECTIONS.PROVIDERS).doc(providerId).get();
    if (!providerDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Provider profile not found.' },
      });
    }

    const provider = providerDoc.data() as Provider;

    // Verify location belongs to this provider
    const locationDoc = await db.collection(COLLECTIONS.PROVIDER_LOCATIONS).doc(data.locationId).get();
    if (!locationDoc.exists || locationDoc.data()!.providerId !== providerId) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Location does not belong to this provider.' },
      });
    }

    // Check subscription service limit
    const tier = provider.subscription?.tier ?? 'starter';
    const limits = PROVIDER_SUBSCRIPTION_LIMITS[tier];
    const existingServicesSnap = await db.collection(COLLECTIONS.SERVICES)
      .where('providerId', '==', providerId)
      .where('isActive', '==', true)
      .get();

    if (existingServicesSnap.size >= limits.maxServices) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'PRV_005',
          message: `Your ${tier} plan allows a maximum of ${limits.maxServices} active services. Please upgrade to add more.`,
        },
      });
    }

    const id = nanoid();
    const now = new Date().toISOString();

    const service: Service = {
      id,
      providerId,
      locationId: data.locationId,
      categoryId: data.categoryId,
      staffIds: data.staffIds,
      name: data.name,
      description: data.description,
      price: data.price,
      duration: data.duration,
      bufferTime: data.bufferTime,
      maxCapacity: data.maxCapacity,
      allowedPetSpecies: data.allowedPetSpecies,
      tags: data.tags,
      imageURLs: data.imageURLs,
      isFeatured: data.isFeatured,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.SERVICES).doc(id).set(service);

    return reply.status(201).send({ success: true, data: service });
  });

  /**
   * PUT /services/:serviceId — Update a service (provider owns it)
   */
  app.put('/:serviceId', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Services'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = UpdateServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(request.params.serviceId);
    const doc = await serviceRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Service not found.' },
      });
    }

    const service = doc.data() as Service;

    if (service.providerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    const now = new Date().toISOString();
    const updates = { ...parsed.data, updatedAt: now };

    await serviceRef.update(updates);

    return reply.send({ success: true, data: { ...service, ...updates, id: doc.id } });
  });

  /**
   * DELETE /services/:serviceId — Soft-delete (deactivate) a service (provider owns it)
   */
  app.delete('/:serviceId', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Services'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(request.params.serviceId);
    const doc = await serviceRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Service not found.' },
      });
    }

    const service = doc.data() as Service;

    if (service.providerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    // Soft-delete: deactivate instead of hard delete to preserve booking history
    await serviceRef.update({ isActive: false, updatedAt: new Date().toISOString() });

    return reply.send({ success: true, data: { message: 'Service deactivated successfully.' } });
  });

  /**
   * GET /services/provider/mine — Authenticated provider's own services (all statuses)
   */
  app.get('/provider/mine', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Services'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { locationId, categoryId, page = '1', limit = '20' } = request.query as Record<string, string>;
    const db = getDb();
    const providerId = request.user!.uid;

    let query = db.collection(COLLECTIONS.SERVICES)
      .where('providerId', '==', providerId) as FirebaseFirestore.Query;

    if (locationId) {
      query = query.where('locationId', '==', locationId);
    }
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    query = query.orderBy('createdAt', 'desc');

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const snapshot = await query.offset(offset).limit(limitNum).get();
    const services = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: services,
      meta: { page: pageNum, limit: limitNum, hasMore: services.length === limitNum },
    });
  });

  /**
   * PUT /services/:serviceId/toggle — Toggle service active/inactive (provider or admin)
   */
  app.put('/:serviceId/toggle', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Services'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(request.params.serviceId);
    const doc = await serviceRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Service not found.' },
      });
    }

    const service = doc.data() as Service;

    if (service.providerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    const newIsActive = !service.isActive;
    await serviceRef.update({ isActive: newIsActive, updatedAt: new Date().toISOString() });

    return reply.send({
      success: true,
      data: { message: `Service ${newIsActive ? 'activated' : 'deactivated'} successfully.`, isActive: newIsActive },
    });
  });
}
