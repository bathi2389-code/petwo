import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Pet, PetSpecies, PetGender, VaccinationRecord, MedicalRecord } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreatePetSchema = z.object({
  name: z.string().min(1).max(50),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  breed: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unknown']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weight: z.number().positive().max(200).optional(),
  color: z.string().max(50).optional(),
  photoURL: z.string().url().optional(),
  microchipId: z.string().max(50).optional(),
  registrationNo: z.string().max(50).optional(),
  isNeutered: z.boolean().optional(),
  allergies: z.array(z.string()).max(20).optional(),
  specialNotes: z.string().max(1000).optional(),
});

const UpdatePetSchema = CreatePetSchema.partial();

const AddVaccinationSchema = z.object({
  vaccineName: z.string().min(1).max(100),
  administeredBy: z.string().max(100).optional(),
  administeredAt: z.string().datetime(),
  nextDueAt: z.string().datetime().optional(),
  batchNo: z.string().max(50).optional(),
  documentURL: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

const AddMedicalRecordSchema = z.object({
  type: z.enum(['consultation', 'diagnosis', 'treatment', 'surgery', 'lab_result', 'prescription']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  diagnosedBy: z.string().max(100).optional(),
  recordedAt: z.string().datetime(),
  attachments: z.array(z.string().url()).max(10).optional(),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    notes: z.string().optional(),
  })).optional(),
  followUpAt: z.string().datetime().optional(),
  providerId: z.string().optional(),
  bookingId: z.string().optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function petRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /pets — Get all pets for authenticated customer
   */
  app.get('/', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.PETS)
      .where('ownerId', '==', request.user!.uid)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const pets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return reply.send({ success: true, data: pets });
  });

  /**
   * POST /pets — Create new pet profile
   */
  app.post('/', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreatePetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const id = nanoid();
    const now = new Date().toISOString();

    const pet: Pet = {
      id,
      ownerId: request.user!.uid,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...parsed.data,
    };

    await db.collection(COLLECTIONS.PETS).doc(id).set(pet);
    return reply.status(201).send({ success: true, data: pet });
  });

  /**
   * GET /pets/:petId — Get specific pet
   */
  app.get('/:petId', {
    preHandler: [authenticate],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.PETS).doc(request.params.petId).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Pet not found.' },
      });
    }

    const pet = doc.data() as Pet;

    // Customers can only see their own pets; providers/admins can see authorized pets
    if (request.user!.role === 'customer' && pet.ownerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    return reply.send({ success: true, data: { ...pet, id: doc.id } });
  });

  /**
   * PUT /pets/:petId — Update pet profile
   */
  app.put('/:petId', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = UpdatePetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const petRef = db.collection(COLLECTIONS.PETS).doc(request.params.petId);
    const doc = await petRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Pet not found.' },
      });
    }

    if ((doc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    await petRef.update({ ...parsed.data, updatedAt: new Date().toISOString() });
    const updated = await petRef.get();
    return reply.send({ success: true, data: { ...updated.data(), id: updated.id } });
  });

  /**
   * DELETE /pets/:petId — Soft-delete pet
   */
  app.delete('/:petId', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const petRef = db.collection(COLLECTIONS.PETS).doc(request.params.petId);
    const doc = await petRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Pet not found.' },
      });
    }

    if ((doc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    await petRef.update({ isActive: false, updatedAt: new Date().toISOString() });
    return reply.send({ success: true, data: { message: 'Pet profile deleted.' } });
  });

  // ─── Vaccinations ─────────────────────────────────────────────────────────

  /**
   * GET /pets/:petId/vaccinations
   */
  app.get('/:petId/vaccinations', {
    preHandler: [authenticate],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();

    // Verify ownership
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(request.params.petId).get();
    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    if (request.user!.role === 'customer' && (petDoc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const snapshot = await db.collection(COLLECTIONS.VACCINATION_RECORDS)
      .where('petId', '==', request.params.petId)
      .orderBy('administeredAt', 'desc')
      .get();

    return reply.send({ success: true, data: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
  });

  /**
   * POST /pets/:petId/vaccinations
   */
  app.post('/:petId/vaccinations', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AddVaccinationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(request.params.petId).get();
    if (!petDoc.exists || (petDoc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const id = nanoid();
    const record: VaccinationRecord = {
      id,
      petId: request.params.petId,
      createdAt: new Date().toISOString(),
      ...parsed.data,
    };

    await db.collection(COLLECTIONS.VACCINATION_RECORDS).doc(id).set(record);
    return reply.status(201).send({ success: true, data: record });
  });

  // ─── Medical Records ──────────────────────────────────────────────────────

  /**
   * GET /pets/:petId/medical-records
   */
  app.get('/:petId/medical-records', {
    preHandler: [authenticate],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(request.params.petId).get();

    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    if (request.user!.role === 'customer' && (petDoc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const snapshot = await db.collection(COLLECTIONS.MEDICAL_RECORDS)
      .where('petId', '==', request.params.petId)
      .orderBy('recordedAt', 'desc')
      .get();

    return reply.send({ success: true, data: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
  });

  /**
   * POST /pets/:petId/medical-records
   */
  app.post('/:petId/medical-records', {
    preHandler: [authenticate],
    schema: { tags: ['Pets'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AddMedicalRecordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(request.params.petId).get();

    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    // Customers can only add to their own pets; providers can add to pets they've served
    if (request.user!.role === 'customer' && (petDoc.data() as Pet).ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    const id = nanoid();
    const record: MedicalRecord = {
      id,
      petId: request.params.petId,
      createdAt: new Date().toISOString(),
      ...parsed.data,
    };

    await db.collection(COLLECTIONS.MEDICAL_RECORDS).doc(id).set(record);
    return reply.status(201).send({ success: true, data: record });
  });
}
