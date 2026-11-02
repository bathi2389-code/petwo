import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isAnyAuthenticatedUser } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { Pet } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const UpdateMicrochipSchema = z.object({
  microchipId: z.string().regex(/^\d{15}$/, 'Microchip must be 15-digit ISO 11784/11785 compliant format'),
  implantationDate: z.string().datetime().optional(),
  implantedByClinic: z.string().min(2).optional(),
});

const GrantConsentSchema = z.object({
  providerId: z.string().min(1),
  durationDays: z.number().int().min(1).max(30).default(7),
  purpose: z.enum(['appointment_visit', 'second_opinion', 'surgery_prep', 'emergency']),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function healthPassportRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /health-passport/:petId
   * Retrieve Digital Pet Health Passport with complete vaccine ledger & QR verification token
   */
  app.get('/:petId', {
    preHandler: [authenticate, isAnyAuthenticatedUser],
    schema: { tags: ['Digital Health Passport'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { petId } = request.params;
    const db = getDb();
    const uid = request.user!.uid;

    const petDoc = await db.collection(COLLECTIONS.PETS).doc(petId).get();
    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    const pet = petDoc.data() as Pet;

    // Consent check if provider
    if (request.user!.role === 'provider') {
      const consentSnap = await db.collection('medicalConsents')
        .where('petId', '==', petId)
        .where('providerId', '==', uid)
        .where('status', '==', 'active')
        .get();

      const hasValidConsent = consentSnap.docs.some(d => dayjs().isBefore(dayjs(d.data().expiresAt)));
      if (!hasValidConsent && pet.ownerId !== uid) {
        return reply.status(403).send({
          success: false,
          error: { code: 'AUTH_003', message: 'No active medical consent granted by pet parent.' },
        });
      }
    } else if (pet.ownerId !== uid && request.user!.role !== 'admin') {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }

    // Fetch vaccination history
    const vaxSnap = await db.collection(COLLECTIONS.VACCINATION_RECORDS)
      .where('petId', '==', petId)
      .orderBy('administeredAt', 'desc')
      .get();

    const vaccinations = vaxSnap.docs.map(d => d.data());

    // Compute mandatory vaccine schedule
    const schedule = calculateRecommendedVaccines(pet.species, pet.dob);

    const passportNumber = `PET-PASS-${pet.species.toUpperCase()}-${pet.id.slice(0, 6).toUpperCase()}`;

    const passport = {
      passportNumber,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        dob: pet.dob,
        weight: pet.weight,
        microchipId: pet.microchipId || 'NOT_IMPLANTED',
        isMicrochipped: !!pet.microchipId,
      },
      verificationQRCodeData: `https://petwo.in/verify/passport/${passportNumber}`,
      vaccinationLedger: vaccinations,
      upcomingVaccinationSchedule: schedule,
      healthStatus: vaccinations.length > 0 ? 'Up-to-Date' : 'Pending Boosters',
      issuedAt: pet.createdAt,
      lastAuditSync: new Date().toISOString(),
    };

    return reply.send({ success: true, data: passport });
  });

  /**
   * PUT /health-passport/:petId/microchip
   * Link ISO 15-digit microchip to digital passport
   */
  app.put('/:petId/microchip', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Digital Health Passport'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { petId } = request.params;
    const body = UpdateMicrochipSchema.parse(request.body);
    const db = getDb();

    const petRef = db.collection(COLLECTIONS.PETS).doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists || petDoc.data()?.ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Unauthorized pet profile.' } });
    }

    await petRef.update({
      microchipId: body.microchipId,
      microchipDetails: {
        implantedAt: body.implantationDate || new Date().toISOString(),
        implantedBy: body.implantedByClinic || 'Verified Veterinary Partner',
      },
      updatedAt: new Date().toISOString(),
    });

    return reply.send({
      success: true,
      message: '15-digit ISO microchip registered and sealed on pet passport.',
      microchipId: body.microchipId,
    });
  });

  /**
   * POST /health-passport/:petId/consents
   * Owner grants treating clinic time-limited access to health records (DPDPA 2023 compliant)
   */
  app.post('/:petId/consents', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Digital Health Passport'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { petId } = request.params;
    const body = GrantConsentSchema.parse(request.body);
    const db = getDb();

    const petDoc = await db.collection(COLLECTIONS.PETS).doc(petId).get();
    if (!petDoc.exists || petDoc.data()?.ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Unauthorized.' } });
    }

    const consentId = `CONSENT-${nanoid(6).toUpperCase()}`;
    const now = dayjs();
    const expiresAt = now.add(body.durationDays, 'day').toISOString();

    const consentRecord = {
      id: consentId,
      petId,
      ownerId: request.user!.uid,
      providerId: body.providerId,
      purpose: body.purpose,
      status: 'active',
      grantedAt: now.toISOString(),
      expiresAt,
    };

    await db.collection('medicalConsents').doc(consentId).set(consentRecord);

    return reply.status(201).send({
      success: true,
      data: consentRecord,
      message: `Medical access consent granted to provider for ${body.durationDays} days.`,
    });
  });
}

function calculateRecommendedVaccines(species: string, dobString?: string) {
  const isCanine = species.toLowerCase() === 'dog';
  const isFeline = species.toLowerCase() === 'cat';

  if (isCanine) {
    return [
      { name: 'Anti-Rabies Vaccine (ARV)', frequency: 'Annual Booster', mandatory: true, status: 'Scheduled' },
      { name: 'DHPPiL (7-in-1 / 9-in-1)', frequency: 'Annual Booster', mandatory: true, status: 'Scheduled' },
      { name: 'Canine Coronavirus (CCV)', frequency: 'Annual Booster', mandatory: false, status: 'Optional' },
      { name: 'Kennel Cough (Bordetella)', frequency: 'Every 6-12 Months', mandatory: true, status: 'Required for Boarding' },
      { name: 'Broad-Spectrum Deworming', frequency: 'Every 3 Months', mandatory: true, status: 'Routine' },
    ];
  } else if (isFeline) {
    return [
      { name: 'Anti-Rabies Vaccine (ARV)', frequency: 'Annual Booster', mandatory: true, status: 'Scheduled' },
      { name: 'Feline Tricat (FVRCP)', frequency: 'Annual Booster', mandatory: true, status: 'Scheduled' },
      { name: 'Feline Leukemia Virus (FeLV)', frequency: 'Annual Booster', mandatory: false, status: 'Recommended' },
      { name: 'Feline Deworming', frequency: 'Every 3 Months', mandatory: true, status: 'Routine' },
    ];
  }

  return [
    { name: 'General Health & Deworming Check', frequency: 'Every 6 Months', mandatory: true, status: 'Routine' },
  ];
}
