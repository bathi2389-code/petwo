import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const validProductionEnv = {
  NODE_ENV: 'production', CORS_ORIGINS: 'https://provider.example,https://admin.example',
  FIREBASE_PROJECT_ID: 'petwo-95436', FIREBASE_PRIVATE_KEY: 'not-validated-here',
  FIREBASE_CLIENT_EMAIL: 'firebase-admin@example.iam.gserviceaccount.com', FIREBASE_STORAGE_BUCKET: 'petwo-95436.appspot.com',
  JWT_SECRET: 'production_jwt_secret_value_at_least_32_chars', RAZORPAY_KEY_ID: 'configured-by-deployment',
  RAZORPAY_KEY_SECRET: 'configured-by-deployment', RAZORPAY_WEBHOOK_SECRET: 'configured-by-deployment',
};

describe('Firebase email verification configuration', () => {
  it('allows production setup without a paid OTP delivery service', () => {
    expect(envSchema.safeParse(validProductionEnv).success).toBe(true);
  });
});
