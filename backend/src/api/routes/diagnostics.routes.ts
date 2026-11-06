import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer, isProviderOrAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Pet } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const BookLabTestSchema = z.object({
  petId: z.string().min(1),
  testPackageId: z.string().min(1),
  collectionAddress: z.object({
    line1: z.string(),
    city: z.string().default('Hyderabad'),
    pincode: z.string().length(6),
  }),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(['07:00-09:00', '09:00-11:00', '11:00-13:00', '16:00-18:00']),
  fastingConfirmed: z.boolean().default(true),
  specialInstructions: z.string().optional(),
});

const UploadTestResultsSchema = z.object({
  reportURL: z.string().url(),
  abnormalFindings: z.array(z.string()).optional(),
  pathologistSummary: z.string().min(5).max(1000),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function diagnosticRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /diagnostics/tests — Directory of veterinary laboratory diagnostic tests
   */
  app.get('/tests', {
    schema: { tags: ['Diagnostics & Pathology'] },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const tests = [
      {
        id: 'pkg_cbc_biochem',
        name: 'Complete Health Panel (CBC + 16-Biochemistry Parameters)',
        description: 'Complete blood count, Kidney (Creatinine, BUN), Liver (ALT, ALKP), Blood Sugar & Total Protein.',
        pricePaisa: 185000, // ₹1,850
        sampleType: 'Whole Blood (EDTA) + Serum',
        turnaroundHours: 12,
        fastingHours: 8,
      },
      {
        id: 'pkg_tick_fever',
        name: 'Tick Fever PCR Panel (Ehrlichia, Anaplasma, Babesia)',
        description: 'Gold-standard DNA detection for hemoprotozoan vector infections common in Hyderabad.',
        pricePaisa: 240000, // ₹2,400
        sampleType: 'Whole Blood (EDTA)',
        turnaroundHours: 24,
        fastingHours: 0,
      },
      {
        id: 'pkg_senior_pet',
        name: 'Senior Pet Geriatric Profile & Thyroid (Total T4)',
        description: 'Recommended annually for dogs & cats above 7 years: Complete CBC, LFT, KFT, Electrolytes & Thyroid.',
        pricePaisa: 295000, // ₹2,950
        sampleType: 'Blood & Urine',
        turnaroundHours: 18,
        fastingHours: 10,
      },
      {
        id: 'pkg_skin_cytology',
        name: 'Dermatology & Skin Scraping Cytology',
        description: 'Microscopic examination for demodectic/sarcoptic mange mites, Malassezia yeast & fungal spores.',
        pricePaisa: 95000, // ₹950
        sampleType: 'Skin Scraping / Impression Smear',
        turnaroundHours: 8,
        fastingHours: 0,
      },
    ];

    return reply.send({ success: true, data: tests });
  });

  /**
   * POST /diagnostics/orders — Book home sample collection in Hyderabad
   */
  app.post('/orders', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['Diagnostics & Pathology'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = BookLabTestSchema.parse(request.body);
    const db = getDb();

    const petDoc = await db.collection(COLLECTIONS.PETS).doc(body.petId).get();
    if (!petDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Pet not found.' } });
    }

    const orderId = `LAB-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();

    const labOrder = {
      id: orderId,
      ...body,
      customerId: request.user!.uid,
      petName: petDoc.data()?.name || 'Pet',
      status: 'phlebotomist_assigned',
      assignedPhlebotomist: {
        name: 'Ramesh Varma',
        phone: '+919849011223',
        vehicle: 'Refrigerated Sample Transport Bike',
      },
      createdAt: now,
    };

    await db.collection('diagnosticOrders').doc(orderId).set(labOrder);

    return reply.status(201).send({
      success: true,
      data: labOrder,
      message: 'Home sample collection confirmed. Certified veterinary phlebotomist will arrive during selected slot.',
    });
  });

  /**
   * PUT /diagnostics/orders/:id/results — Diagnostic Lab publishes results
   */
  app.put('/orders/:id/results', {
    preHandler: [authenticate, isProviderOrAdmin],
    schema: { tags: ['Diagnostics & Pathology'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { id } = request.params;
    const body = UploadTestResultsSchema.parse(request.body);
    const db = getDb();
    const now = new Date().toISOString();

    const orderRef = db.collection('diagnosticOrders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Diagnostic order not found.' } });
    }

    const orderData = orderDoc.data()!;

    await orderRef.update({
      status: 'results_published',
      results: {
        ...body,
        publishedAt: now,
      },
      updatedAt: now,
    });

    // Automatically append to pet's medical records
    await db.collection(COLLECTIONS.MEDICAL_RECORDS).add({
      petId: orderData.petId,
      type: 'lab_result',
      title: 'Diagnostic Laboratory Report',
      description: body.pathologistSummary,
      attachments: [body.reportURL],
      recordedAt: now,
      createdAt: now,
    });

    return reply.send({
      success: true,
      message: 'Diagnostic test results published and synced to pet medical record.',
    });
  });
}
