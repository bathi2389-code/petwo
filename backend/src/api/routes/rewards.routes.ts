import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RedeemPointsSchema = z.object({
  pointsToRedeem: z.number().int().min(100).max(5000), // Min 100 points
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function rewardsRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /rewards/balance — Retrieve user loyalty balance & badges
   */
  app.get('/balance', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['PawRewards Loyalty'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const uid = request.user!.uid;

    const rewardDoc = await db.collection('pawRewards').doc(uid).get();

    if (!rewardDoc.exists) {
      const initialProfile = {
        userId: uid,
        balancePoints: 150, // Welcome bonus of 150 points
        lifetimeEarned: 150,
        tier: 'Silver Paw',
        badges: [
          { id: 'welcome_paw', title: 'Welcome to PETWO', icon: '🐾', unlockedAt: new Date().toISOString() },
        ],
        updatedAt: new Date().toISOString(),
      };
      await db.collection('pawRewards').doc(uid).set(initialProfile);
      return reply.send({ success: true, data: initialProfile });
    }

    return reply.send({ success: true, data: rewardDoc.data() });
  });

  /**
   * POST /rewards/redeem — Convert points into discount voucher
   */
  app.post('/redeem', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['PawRewards Loyalty'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { pointsToRedeem } = RedeemPointsSchema.parse(request.body);
    const db = getDb();
    const uid = request.user!.uid;

    const rewardRef = db.collection('pawRewards').doc(uid);
    const rewardDoc = await rewardRef.get();
    const currentBalance = rewardDoc.data()?.balancePoints || 0;

    if (currentBalance < pointsToRedeem) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VAL_001', message: `Insufficient points. You have ${currentBalance} points.` },
      });
    }

    // 100 points = ₹50 voucher (5000 paisa)
    const discountRupees = Math.floor(pointsToRedeem / 2);
    const voucherCode = `PAWREWARD-${nanoid(4).toUpperCase()}`;
    const now = new Date().toISOString();

    // Deduct points
    await rewardRef.update({
      balancePoints: currentBalance - pointsToRedeem,
      updatedAt: now,
    });

    // Create user-specific discount coupon
    await db.collection(COLLECTIONS.COUPONS).doc(voucherCode).set({
      id: voucherCode,
      code: voucherCode,
      description: `PawRewards Loyalty Redemption: ₹${discountRupees} OFF`,
      discountType: 'flat',
      discountValue: discountRupees * 100, // in paisa
      minOrderAmount: 40000, // ₹400 min order
      userUsageLimit: 1,
      usedCount: 0,
      validFrom: now,
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      fundedBy: 'platform',
      isActive: true,
      createdAt: now,
    });

    // Log transaction
    await db.collection('pawRewardsLedger').add({
      userId: uid,
      type: 'redemption',
      pointsDelta: -pointsToRedeem,
      voucherCode,
      discountValuePaisa: discountRupees * 100,
      timestamp: now,
    });

    return reply.send({
      success: true,
      data: {
        redeemedPoints: pointsToRedeem,
        discountValueRupees: discountRupees,
        couponCode: voucherCode,
        newBalance: currentBalance - pointsToRedeem,
      },
      message: `Redeemed ${pointsToRedeem} points for voucher ${voucherCode} (₹${discountRupees} off).`,
    });
  });

  /**
   * GET /rewards/history — Points transaction audit ledger
   */
  app.get('/history', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['PawRewards Loyalty'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const uid = request.user!.uid;

    const snap = await db.collection('pawRewardsLedger')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();

    return reply.send({
      success: true,
      data: snap.docs.map(d => ({ ...d.data(), id: d.id })),
    });
  });
}
