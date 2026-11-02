import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import axios from 'axios';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Pet } from '@petco/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const TriageRequestSchema = z.object({
  petId: z.string().min(1),
  symptoms: z.string().min(10).max(2000),
  durationHours: z.number().positive().optional(),
  observedChanges: z.array(z.string()).optional(), // e.g. ["loss_of_appetite", "vomiting", "lethargy"]
  isPainExhibited: z.boolean().optional(),
  currentMedications: z.array(z.string()).optional(),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function aiTriageRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /ai-triage/assess
   * AI-powered preliminary pet health triage using Gemini 3.8 Flash
   */
  app.post('/assess', {
    preHandler: [authenticate, isCustomer],
    schema: {
      tags: ['AI Triage'],
      summary: 'Evaluate pet symptoms using Gemini 3.8 Flash Veterinary Logic',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = TriageRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { petId, symptoms, durationHours, observedChanges, isPainExhibited, currentMedications } = parsed.data;
    const db = getDb();

    // Fetch pet context
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(petId).get();
    if (!petDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Pet profile not found.' },
      });
    }

    const pet = petDoc.data() as Pet;
    if (pet.ownerId !== request.user!.uid) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    // Build veterinary clinical prompt
    const prompt = `You are PETCO's Clinical Triage Assistant designed by board-certified veterinarians in India.
Assess the following pet symptoms and provide an immediate structured triage response in JSON format.

PET PROFILE:
- Species: ${pet.species}
- Breed: ${pet.breed}
- Gender: ${pet.gender}
- Weight: ${pet.weight ? `${pet.weight} kg` : 'Unknown'}
- Known Allergies: ${pet.allergies?.join(', ') || 'None'}
- Special Notes: ${pet.specialNotes || 'None'}

REPORTED OBSERVATIONS:
- Symptoms: ${symptoms}
- Symptom Duration: ${durationHours ? `${durationHours} hours` : 'Unspecified'}
- Observed Behavioral Changes: ${observedChanges?.join(', ') || 'None reported'}
- Showing Signs of Pain: ${isPainExhibited ? 'YES' : 'NO'}
- Current Medications: ${currentMedications?.join(', ') || 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "severity": "emergency" | "urgent" | "routine" | "home_care",
  "urgencySummary": "Concise 1-2 sentence assessment",
  "primaryHypotheses": ["Possibility 1", "Possibility 2"],
  "immediateFirstAid": ["Action 1", "Action 2"],
  "redFlagSigns": ["Danger sign 1 that necessitates immediate ER visit"],
  "recommendedAction": "Book 24/7 ER Vet" | "Book In-Clinic Consultation" | "Schedule Tele-consult" | "Monitor at home",
  "suggestedCategorySlug": "veterinary" | "home-services",
  "questionsForVet": ["Question to ask attending veterinarian"]
}`;

    let triageResult;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          },
          { timeout: 15000 }
        );

        const candidateText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        triageResult = JSON.parse(candidateText);
      } catch (err) {
        request.log.error(err, 'Gemini API call failed, falling back to rule-based triage heuristic');
        triageResult = generateFallbackTriage(symptoms, isPainExhibited);
      }
    } else {
      // Offline/Deterministic fallback triage engine
      triageResult = generateFallbackTriage(symptoms, isPainExhibited);
    }

    const triageId = nanoid();
    const now = new Date().toISOString();

    const record = {
      id: triageId,
      customerId: request.user!.uid,
      petId,
      petName: pet.name,
      petSpecies: pet.species,
      symptoms,
      result: triageResult,
      createdAt: now,
      disclaimer: 'PETCO AI Triage is an advisory decision-support system and does not constitute a veterinary medical diagnosis. If your pet exhibits collapse, pale gums, seizure, or acute breathing distress, proceed immediately to the nearest 24/7 veterinary emergency hospital.',
    };

    // Save to Firestore audit history
    await db.collection('aiTriageSessions').doc(triageId).set(record);

    return reply.status(200).send({
      success: true,
      data: record,
    });
  });

  /**
   * GET /ai-triage/history
   * Retrieve pet's past triage evaluations
   */
  app.get('/history', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['AI Triage'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    let q = db.collection('aiTriageSessions')
      .where('customerId', '==', request.user!.uid)
      .orderBy('createdAt', 'desc')
      .limit(20);

    if (request.query.petId) {
      q = q.where('petId', '==', request.query.petId) as typeof q;
    }

    const snap = await q.get();
    return reply.send({
      success: true,
      data: snap.docs.map(d => ({ ...d.data(), id: d.id })),
    });
  });
}

function generateFallbackTriage(symptoms: string, isPain?: boolean) {
  const lower = symptoms.toLowerCase();
  const isEmergency = lower.includes('blood') || lower.includes('collapse') ||
    lower.includes('poison') || lower.includes('breathing') || lower.includes('seizure');

  if (isEmergency || isPain) {
    return {
      severity: 'emergency',
      urgencySummary: 'Symptoms indicate potential acute distress requiring in-person veterinary intervention.',
      primaryHypotheses: ['Acute systemic distress', 'Toxin ingestion / Respiratory compromise'],
      immediateFirstAid: [
        'Keep pet calm and warm in a well-ventilated carrier',
        'Do NOT administer human medications (e.g. paracetamol is toxic to cats & dogs)',
        'Proceed immediately to the nearest 24/7 emergency veterinary facility in Hyderabad',
      ],
      redFlagSigns: ['Pale or blue gums', 'Unresponsiveness', 'Persistent vomiting of blood'],
      recommendedAction: 'Book 24/7 ER Vet',
      suggestedCategorySlug: 'veterinary',
      questionsForVet: ['What emergency diagnostic panel is required?', 'Is oxygen therapy indicated?'],
    };
  }

  return {
    severity: 'routine',
    urgencySummary: 'Symptoms appear mild to moderate. Scheduled consultation recommended within 24-48 hours.',
    primaryHypotheses: ['Mild gastroenteritis', 'Dietary indiscretion', 'Transient malaise'],
    immediateFirstAid: [
      'Provide continuous access to fresh clean drinking water to prevent dehydration',
      'Offer a bland diet (boiled rice with lean chicken or pumpkin) in small portions',
      'Monitor temperature and bowel movements over the next 12 hours',
    ],
    redFlagSigns: ['Lethargy lasting over 24 hours', 'Repeated vomiting without keeping fluids down'],
    recommendedAction: 'Book In-Clinic Consultation',
    suggestedCategorySlug: 'veterinary',
    questionsForVet: ['Could this be related to recent dietary changes or tick exposure?'],
  };
}
