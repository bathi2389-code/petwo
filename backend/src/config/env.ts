import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID_OTP: z.string().optional(),
  MSG91_SENDER_ID: z.string().default('PETCOI'),

  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_API_KEY: z.string().optional(),
  ALGOLIA_INDEX_PROVIDERS: z.string().default('petco_providers'),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// In test mode, provide safe fallback values for integration testing
const testDefaults = process.env.NODE_ENV === 'test' ? {
  FIREBASE_PROJECT_ID: 'petco-test-suite',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5\n-----END PRIVATE KEY-----',
  FIREBASE_CLIENT_EMAIL: 'qa-tester@petco-test.iam.gserviceaccount.com',
  FIREBASE_STORAGE_BUCKET: 'petco-test.appspot.com',
  JWT_SECRET: 'test_jwt_secret_super_secure_32_chars_long_key_12345',
  RAZORPAY_KEY_ID: 'rzp_test_qa12345678',
  RAZORPAY_KEY_SECRET: 'rzp_secret_qa12345678',
  RAZORPAY_WEBHOOK_SECRET: 'rzp_wh_secret_qa12345678',
  LOG_LEVEL: 'fatal',
} : {};

const rawEnv = { ...testDefaults, ...process.env };
const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
