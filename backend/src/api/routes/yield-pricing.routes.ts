import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isProvider } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateYieldRuleSchema = z.object({
  serviceId: z.string().optional(), // Specific service or omit for facility-wide
  ruleType: z.enum(['off_peak_discount', 'peak_surge']),
  multiplier: z.number().min(0.5).max(2.0), // e.g. 0.85 for 15% discount, 1.15 for 15% surge
  daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  label: z.string().min(2).max(100),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function yieldPricingRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /yield-pricing/:providerId/rules — List active yield management rules
   */
  app.get('/:providerId/rules', {
    schema: { tags: ['Dynamic Yield Pricing'] },
  }, async (request: any, reply: FastifyReply) => {
    const { providerId } = request.params;
    const db = getDb();

    const snap = await db.collection('yieldPricingRules')
      .where('providerId', '==', providerId)
      .where('isActive', '==', true)
      .get();

    return reply.send({
      success: true,
      data: snap.docs.map(d => ({ ...d.data(), id: d.id })),
    });
  });

  /**
   * POST /yield-pricing/rules — Create dynamic slot price adjustment
   */
  app.post('/rules', {
    preHandler: [authenticate, isProvider],
    schema: { tags: ['Dynamic Yield Pricing'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreateYieldRuleSchema.parse(request.body);
    const db = getDb();
    const providerId = request.user!.uid;

    const ruleId = `YIELD-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();

    const ruleRecord = {
      id: ruleId,
      providerId,
      ...body,
      isActive: true,
      createdAt: now,
    };

    await db.collection('yieldPricingRules').doc(ruleId).set(ruleRecord);

    return reply.status(201).send({
      success: true,
      data: ruleRecord,
      message: `Dynamic yield pricing rule "${body.label}" activated.`,
    });
  });

  /**
   * GET /yield-pricing/compute — Calculate effective slot price with yield multiplier
   */
  app.get('/compute', {
    schema: {
      tags: ['Dynamic Yield Pricing'],
      querystring: {
        type: 'object',
        required: ['providerId', 'basePricePaisa', 'day', 'time'],
        properties: {
          providerId: { type: 'string' },
          basePricePaisa: { type: 'number' },
          day: { type: 'string' },
          time: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply: FastifyReply) => {
    const { providerId, basePricePaisa, day, time } = request.query;
    const basePaisa = Number(basePricePaisa);
    const db = getDb();

    const snap = await db.collection('yieldPricingRules')
      .where('providerId', '==', providerId)
      .where('isActive', '==', true)
      .get();

    let multiplier = 1.0;
    let appliedRuleLabel = 'Standard Rate';

    for (const doc of snap.docs) {
      const rule = doc.data();
      if (rule.daysOfWeek.includes(day.toLowerCase())) {
        if (time >= rule.startTime && time <= rule.endTime) {
          multiplier = rule.multiplier;
          appliedRuleLabel = rule.label;
          break;
        }
      }
    }

    const effectivePaisa = Math.round(basePaisa * multiplier);
    const deltaPaisa = effectivePaisa - basePaisa;

    return reply.send({
      success: true,
      data: {
        basePricePaisa: basePaisa,
        multiplier,
        appliedRuleLabel,
        effectivePricePaisa: effectivePaisa,
        savingsPaisa: deltaPaisa < 0 ? Math.abs(deltaPaisa) : 0,
        surgePaisa: deltaPaisa > 0 ? deltaPaisa : 0,
      },
    });
  });
}
