import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';
import { z } from 'zod';
import { getAuth, getDb, COLLECTIONS } from './webhook.routes';
import { authenticate } from '../../middleware/auth.middleware';
import { normalizePhoneNumber, isValidIndianPhone } from '../../utils/helpers';
import { OTP, UserRole } from '@petwo/shared';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SendOtpSchema = z.object({
  phone: z.string().refine(isValidIndianPhone, 'Invalid Indian phone number'),
});

const VerifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
  role: z.enum(['customer', 'provider']).default('customer'),
  displayName: z.string().min(2).max(100).optional(),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /auth/otp/send
   * Send OTP to phone number via MSG91
   */
  app.post('/otp/send', {
    schema: {
      tags: ['Auth'],
      summary: 'Send OTP to phone number',
      body: {
        type: 'object',
        required: ['phone'],
        properties: { phone: { type: 'string' } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = SendOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Invalid phone number', details: parsed.error.format() },
      });
    }

    const { phone } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(phone);
    const db = getDb();

    // Rate limit: check if OTP was sent in the last RESEND_COOLDOWN_SECONDS
    const otpRef = db.collection(COLLECTIONS.OTP_CACHE).doc(normalizedPhone);
    const existing = await otpRef.get();

    if (existing.exists) {
      const data = existing.data()!;
      const sentAt = dayjs(data.sentAt);
      const cooldownEnd = sentAt.add(OTP.RESEND_COOLDOWN_SECONDS, 'second');
      if (dayjs().isBefore(cooldownEnd)) {
        const waitSeconds = cooldownEnd.diff(dayjs(), 'second');
        return reply.status(429).send({
          success: false,
          error: {
            code: 'SYS_003',
            message: `Please wait ${waitSeconds} seconds before requesting another OTP.`,
          },
        });
      }
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = dayjs().add(OTP.EXPIRES_MINUTES, 'minute').toISOString();

    // Store cryptographically salted OTP hash
    const hashedOtp = hashOtp(otp, normalizedPhone);
    await otpRef.set({
      phone: normalizedPhone,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      sentAt: new Date().toISOString(),
    });

    // Use real SMS whenever MSG91 is configured, including local development.
    // Only expose a development OTP when no MSG91 credentials are configured.
    const { env } = await import('../../config/env');
    const hasMsg91AuthKey = Boolean(env.MSG91_AUTH_KEY);
    const hasMsg91Template = Boolean(env.MSG91_TEMPLATE_ID_OTP);
    const msg91Configured = hasMsg91AuthKey && hasMsg91Template;
    const msg91PartiallyConfigured = hasMsg91AuthKey !== hasMsg91Template;

    if (msg91PartiallyConfigured || (!msg91Configured && env.NODE_ENV === 'production')) {
      await otpRef.delete();
      return reply.status(503).send({
        success: false,
        error: {
          code: 'SMS_001',
          message: 'SMS delivery is not configured. Set both MSG91_AUTH_KEY and MSG91_TEMPLATE_ID_OTP.',
        },
      });
    }

    if (msg91Configured) {
      try {
        await sendOtpViaSms(normalizedPhone, otp);
      } catch (error) {
        await otpRef.delete();
        request.log.error({ err: error }, 'MSG91 OTP delivery failed');
        return reply.status(502).send({
          success: false,
          error: {
            code: 'SMS_002',
            message: 'MSG91 could not send the OTP. Check your MSG91 template and account configuration, then try again.',
          },
        });
      }
    }

    request.log.info({ phone: `${normalizedPhone.slice(0, 3)}******${normalizedPhone.slice(-2)}`, delivery: msg91Configured ? 'msg91' : 'development' }, 'OTP requested');

    return reply.status(200).send({
      success: true,
      data: {
        message: msg91Configured ? 'OTP sent to your mobile number.' : 'Development OTP generated. Configure MSG91 to send real SMS.',
        expiresIn: OTP.EXPIRES_MINUTES * 60,
        ...(!msg91Configured && env.NODE_ENV === 'development' && { otp }),
      },
    });
  });

  /**
   * POST /auth/otp/verify
   * Verify OTP and return Firebase custom token
   */
  app.post('/otp/verify', {
    schema: {
      tags: ['Auth'],
      summary: 'Verify OTP and authenticate user',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = VerifyOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { phone, otp, role, displayName } = parsed.data;
    const normalizedPhone = normalizePhoneNumber(phone);
    const db = getDb();
    const auth = getAuth();

    const otpRef = db.collection(COLLECTIONS.OTP_CACHE).doc(normalizedPhone);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return reply.status(400).send({
        success: false,
        error: { code: 'AUTH_006', message: 'OTP not found. Please request a new OTP.' },
      });
    }

    const otpData = otpDoc.data()!;

    // Check expiry
    if (dayjs().isAfter(dayjs(otpData.expiresAt))) {
      await otpRef.delete();
      return reply.status(400).send({
        success: false,
        error: { code: 'AUTH_005', message: 'OTP has expired. Please request a new OTP.' },
      });
    }

    // Check max attempts
    if (otpData.attempts >= OTP.MAX_ATTEMPTS) {
      await otpRef.delete();
      return reply.status(400).send({
        success: false,
        error: { code: 'AUTH_007', message: 'Maximum OTP attempts reached. Please request a new OTP.' },
      });
    }

    // Verify OTP using constant-time salted comparison
    const isMatch = verifyOtpConstantTime(otp, normalizedPhone, otpData.otp);
    if (!isMatch) {
      await otpRef.update({ attempts: otpData.attempts + 1 });
      return reply.status(400).send({
        success: false,
        error: {
          code: 'AUTH_006',
          message: `Invalid OTP. ${OTP.MAX_ATTEMPTS - otpData.attempts - 1} attempts remaining.`,
        },
      });
    }

    // OTP valid — delete from cache
    await otpRef.delete();

    // Find or create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByPhoneNumber(normalizedPhone);
    } catch {
      // User doesn't exist — create them
      firebaseUser = await auth.createUser({
        phoneNumber: normalizedPhone,
        displayName: displayName ?? `User ${normalizedPhone.slice(-4)}`,
      });
    }

    const uid = firebaseUser.uid;

    // Upsert user record in Firestore
    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
    const userDoc = await userRef.get();

    const now = new Date().toISOString();

    if (!userDoc.exists) {
      const effectiveRole: UserRole = role;
      await userRef.set({
        id: uid,
        phone: normalizedPhone,
        displayName: displayName ?? `User ${normalizedPhone.slice(-4)}`,
        role: effectiveRole,
        isActive: true,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      // Create role-specific profile
      if (effectiveRole === 'customer') {
        await db.collection(COLLECTIONS.CUSTOMERS).doc(uid).set({
          id: uid,
          userId: uid,
          phone: normalizedPhone,
          firstName: displayName?.split(' ')[0] ?? '',
          lastName: displayName?.split(' ').slice(1).join(' ') ?? '',
          savedProviders: [],
          notificationPreferences: {
            bookingUpdates: true,
            promotions: true,
            reminders: true,
            sms: true,
            email: true,
            push: true,
          },
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      await userRef.update({ updatedAt: now });
    }

    // Create Firebase custom token
    const customToken = await auth.createCustomToken(uid, {
      role: userDoc.exists ? userDoc.data()!.role : role,
    });

    return reply.status(200).send({
      success: true,
      data: {
        customToken,
        uid,
        isNewUser: !userDoc.exists,
        role: userDoc.exists ? userDoc.data()!.role : role,
        message: 'Authentication successful.',
      },
    });
  });

  /**
   * GET /auth/me
   * Get current authenticated user's profile
   */
  app.get('/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user info',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const db = getDb();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(request.user!.uid).get();

    if (!userDoc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'User not found.' },
      });
    }

    return reply.send({ success: true, data: { ...userDoc.data(), id: userDoc.id } });
  });

  /**
   * POST /auth/logout
   * Revoke all refresh tokens (Firebase side)
   */
  app.post('/logout', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Logout and revoke tokens',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    await getAuth().revokeRefreshTokens(request.user!.uid);
    return reply.send({ success: true, data: { message: 'Logged out successfully.' } });
  });
}

// ─── Cryptographic OTP Helpers ──────────────────────────────────────────────────

export function hashOtp(otp: string, salt: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters before generating OTP hashes.');
  return crypto.createHmac('sha256', secret).update(`${salt}:${otp}`).digest('hex');
}

export function verifyOtpConstantTime(inputOtp: string, salt: string, storedHash: string): boolean {
  if (!inputOtp || !storedHash) return false;
  const computedHash = hashOtp(inputOtp, salt);
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function sendOtpViaSms(phone: string, otp: string): Promise<void> {
  const { env } = await import('../../config/env');
  if (!env.MSG91_AUTH_KEY || !env.MSG91_TEMPLATE_ID_OTP) {
    throw new Error('MSG91 auth key and OTP template ID are both required.');
  }

  // MSG91's OTP API accepts a caller-generated OTP, so the same code can be
  // securely hashed in Firestore and verified by our backend.
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', env.MSG91_TEMPLATE_ID_OTP);
  url.searchParams.set('mobile', phone.replace('+', ''));
  url.searchParams.set('otp', otp);
  url.searchParams.set('otp_length', '6');
  url.searchParams.set('otp_expiry', String(OTP.EXPIRES_MINUTES));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      authkey: env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({}),
  });

  const payload = await response.json().catch(() => null) as { type?: string; message?: string } | null;
  if (!response.ok || payload?.type?.toLowerCase() !== 'success') {
    throw new Error(`MSG91 OTP request failed (HTTP ${response.status}).`);
  }
}
