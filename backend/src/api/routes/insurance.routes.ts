import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Pet } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const GenerateQuoteSchema = z.object({
  petId: z.string().min(1),
  planTier: z.enum(['emergency_trauma', 'comprehensive_surgery', 'platinum_all_risk']),
  sumInsuredRupees: z.number().int().min(50000).max(500000), // ₹50,000 to ₹5,00,000
});

const FileClaimPreAuthSchema = z.object({
  petId: z.string().min(1),
  hospitalProviderId: z.string().min(1),
  estimatedCostPaisa: z.number().int().positive(),
  admittingDiagnosis: z.string().min(3).max(500),
  attendingDoctorNotes: z.string().optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function insuranceRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /insurance/plans — Curated Indian pet insurance coverage tiers
   */
  app.get('/plans', {
    schema: { tags: ['Pet Insurance Marketplace'] },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const plans = [
      {
        id: 'plan_trauma',
        tier: 'emergency_trauma',
        name: 'Emergency Trauma & Accidental Cover',
        sumInsured: 10000000, // ₹1,00,000
        premiumYearly: 349900, // ₹3,499/year
        features: [
          'Immediate accidental trauma stabilization',
          'Fractures, wound suturing & emergency sedation',
          'Snakebite anti-venom and toxicity management',
          '24/7 Cashless admission across verified Hyderabad hospitals',
        ],
        waitingPeriodDays: 0,
        underwriter: 'Digit General Insurance Partner',
      },
      {
        id: 'plan_comprehensive',
        tier: 'comprehensive_surgery',
        name: 'Comprehensive Surgery & Major Illness',
        sumInsured: 25000000, // ₹2,50,000
        premiumYearly: 799900, // ₹7,999/year
        features: [
          'All trauma features included',
          'Gastric torsion (GDV), foreign body removal & orthopedic surgery',
          'Post-operative ICU boarding & medication',
          'Advanced digital radiography & ultrasonography reimbursement',
        ],
        waitingPeriodDays: 15,
        underwriter: 'Bajaj Allianz General Insurance Partner',
      },
      {
        id: 'plan_platinum',
        tier: 'platinum_all_risk',
        name: 'Platinum Comprehensive & OPD Wellness',
        sumInsured: 50000000, // ₹5,00,000
        premiumYearly: 1499900, // ₹14,999/year
        features: [
          'All surgery and critical care features',
          'Annual health checks & vaccination cost reimbursement',
          'Pre-existing hereditary condition coverage (after 90 days)',
          'Dedicated pet medical concierge service in Hyderabad',
        ],
        waitingPeriodDays: 30,
        underwriter: 'PETWO Underwriting Syndicate',
      },
    ];

    return reply.send({ success: true, data: plans });
  });

  /**
   * POST /insurance/quotes — Compute pet-specific premium quote
   */
  app.post('/quotes', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pet Insurance Marketplace'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { petId, planTier, sumInsuredRupees } = GenerateQuoteSchema.parse(request.body);
    const db = getDb();

    const petDoc = await db.collection(COLLECTIONS.PETS).doc(petId).get();
    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    const pet = petDoc.data() as Pet;
    const basePremiumRupees = Math.round(sumInsuredRupees * 0.035); // ~3.5% risk premium

    const quoteId = `QUOTE-${nanoid(8).toUpperCase()}`;
    const quote = {
      quoteId,
      petId,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      planTier,
      sumInsuredPaisa: sumInsuredRupees * 100,
      annualPremiumPaisa: basePremiumRupees * 100,
      gst18PercentPaisa: Math.round(basePremiumRupees * 100 * 0.18),
      totalPayablePaisa: Math.round(basePremiumRupees * 100 * 1.18),
      cashlessNetworkHospitalsInHyderabad: 18,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return reply.send({ success: true, data: quote });
  });

  /**
   * POST /insurance/claims/pre-auth — Trigger instant cashless hospital pre-authorization
   */
  app.post('/claims/pre-auth', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Pet Insurance Marketplace'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = FileClaimPreAuthSchema.parse(request.body);
    const db = getDb();

    const claimId = `CLAIM-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();

    const claimRecord = {
      id: claimId,
      ...body,
      customerId: request.user!.uid,
      status: 'pre_authorized',
      approvedCoveragePaisa: Math.round(body.estimatedCostPaisa * 0.9), // 90% cashless coverage
      deductiblePaisa: Math.round(body.estimatedCostPaisa * 0.1), // 10% co-pay
      guaranteeLetterReference: `PETWO-GOP-${nanoid(8).toUpperCase()}`,
      authorizedAt: now,
    };

    await db.collection('insuranceClaims').doc(claimId).set(claimRecord);

    return reply.status(201).send({
      success: true,
      data: claimRecord,
      message: 'Cashless pre-authorization approved. Guarantee of Payment letter dispatched to hospital desk.',
    });
  });
}
