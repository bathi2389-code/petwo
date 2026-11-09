import { describe, expect, it } from 'vitest';
import { envSchema, isPaymentsEnabled } from './env';

const baseProductionEnv = {
  NODE_ENV: 'production',
  CORS_ORIGINS: 'https://provider.example,https://admin.example',
  FIREBASE_PROJECT_ID: 'petwo-95436',
  FIREBASE_PRIVATE_KEY: 'not-validated-here',
  FIREBASE_CLIENT_EMAIL: 'firebase-admin@example.iam.gserviceaccount.com',
  FIREBASE_STORAGE_BUCKET: 'petwo-95436.appspot.com',
  JWT_SECRET: 'production_jwt_secret_value_at_least_32_chars',
};

describe('Environment configuration for MVP payments', () => {
  it('allows production startup without any Razorpay credentials (payments disabled by default)', () => {
    const result = envSchema.safeParse(baseProductionEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_ENABLED).toBe(false);
      expect(result.data.RAZORPAY_KEY_ID).toBeUndefined();
      expect(result.data.RAZORPAY_KEY_SECRET).toBeUndefined();
      expect(result.data.RAZORPAY_WEBHOOK_SECRET).toBeUndefined();
      expect(isPaymentsEnabled(result.data)).toBe(false);
    }
  });

  it('treats empty string Razorpay credentials as undefined when disabled', () => {
    const result = envSchema.safeParse({
      ...baseProductionEnv,
      PAYMENTS_ENABLED: 'false',
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_ENABLED).toBe(false);
      expect(result.data.RAZORPAY_KEY_ID).toBeUndefined();
      expect(isPaymentsEnabled(result.data)).toBe(false);
    }
  });

  it('fails validation when PAYMENTS_ENABLED is true but Razorpay credentials are missing', () => {
    const missingKeysResult = envSchema.safeParse({
      ...baseProductionEnv,
      PAYMENTS_ENABLED: 'true',
    });
    expect(missingKeysResult.success).toBe(false);
    if (!missingKeysResult.success) {
      const paths = missingKeysResult.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('RAZORPAY_KEY_ID');
      expect(paths).toContain('RAZORPAY_KEY_SECRET');
    }
  });

  it('fails validation when PAYMENTS_ENABLED is true but RAZORPAY_KEY_SECRET is missing', () => {
    const missingSecretResult = envSchema.safeParse({
      ...baseProductionEnv,
      PAYMENTS_ENABLED: true,
      RAZORPAY_KEY_ID: 'rzp_live_testkey123',
    });
    expect(missingSecretResult.success).toBe(false);
    if (!missingSecretResult.success) {
      const paths = missingSecretResult.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('RAZORPAY_KEY_SECRET');
    }
  });

  it('succeeds validation and enables payments when PAYMENTS_ENABLED is true and credentials are provided', () => {
    const result = envSchema.safeParse({
      ...baseProductionEnv,
      PAYMENTS_ENABLED: 'true',
      RAZORPAY_KEY_ID: 'rzp_live_testkey123',
      RAZORPAY_KEY_SECRET: 'rzp_sec_testsecret123',
      RAZORPAY_WEBHOOK_SECRET: 'rzp_wh_testwebhook123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_ENABLED).toBe(true);
      expect(result.data.RAZORPAY_KEY_ID).toBe('rzp_live_testkey123');
      expect(isPaymentsEnabled(result.data)).toBe(true);
    }
  });

  it('keeps payments disabled if credentials exist but PAYMENTS_ENABLED is false', () => {
    const result = envSchema.safeParse({
      ...baseProductionEnv,
      PAYMENTS_ENABLED: 'false',
      RAZORPAY_KEY_ID: 'rzp_live_testkey123',
      RAZORPAY_KEY_SECRET: 'rzp_sec_testsecret123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_ENABLED).toBe(false);
      expect(isPaymentsEnabled(result.data)).toBe(false);
    }
  });
});

describe('Firebase email verification configuration', () => {
  it('allows production setup without a paid OTP delivery service', () => {
    expect(envSchema.safeParse(baseProductionEnv).success).toBe(true);
  });
});
