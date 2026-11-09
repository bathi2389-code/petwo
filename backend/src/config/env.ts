import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGINS: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  PAYMENTS_ENABLED: z.preprocess((val) => {
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0' || lower === '') return false;
    }
    return val;
  }, z.boolean().default(false)),

  RAZORPAY_KEY_ID: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(1).optional()),
  RAZORPAY_KEY_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(1).optional()),
  RAZORPAY_WEBHOOK_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(1).optional()),

  GEMINI_API_KEY: z.string().optional(),

  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_API_KEY: z.string().optional(),
  ALGOLIA_INDEX_PROVIDERS: z.string().default('petwo_providers'),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
}).superRefine((values, context) => {
  if (values.NODE_ENV === 'production' && !values.CORS_ORIGINS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: 'Set CORS_ORIGINS to the exact production web app origins.',
    });
  }
  if (Boolean(values.WHATSAPP_API_KEY) !== Boolean(values.WHATSAPP_PHONE_NUMBER_ID)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['WHATSAPP_PHONE_NUMBER_ID'],
      message: 'Set both WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID to enable outbound WhatsApp messages.',
    });
  }
  if (values.PAYMENTS_ENABLED) {
    if (!values.RAZORPAY_KEY_ID) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RAZORPAY_KEY_ID'],
        message: 'RAZORPAY_KEY_ID is required when PAYMENTS_ENABLED is true.',
      });
    }
    if (!values.RAZORPAY_KEY_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RAZORPAY_KEY_SECRET'],
        message: 'RAZORPAY_KEY_SECRET is required when PAYMENTS_ENABLED is true.',
      });
    }
  }
});

// In test mode, provide safe fallback values for integration testing
const testDefaults = process.env.NODE_ENV === 'test' ? {
  FIREBASE_PROJECT_ID: 'petwo-test-suite',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5\n-----END PRIVATE KEY-----',
  FIREBASE_CLIENT_EMAIL: 'qa-tester@petwo-test.iam.gserviceaccount.com',
  FIREBASE_STORAGE_BUCKET: 'petwo-test.appspot.com',
  JWT_SECRET: 'test_jwt_secret_super_secure_32_chars_long_key_12345',
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

let paymentsEnabledOverride: boolean | null = null;

/**
 * Allows integration tests to toggle payments enabled state in-memory.
 * Pass `null` to reset to the environment variable value.
 */
export function setPaymentsEnabledForTesting(enabled: boolean | null): void {
  paymentsEnabledOverride = enabled;
}

/**
 * Returns true only when payments are enabled and valid credentials are present.
 * Disabled by default for MVP.
 */
export function isPaymentsEnabled(config?: Partial<Env>): boolean {
  if (paymentsEnabledOverride !== null && !config) {
    return paymentsEnabledOverride;
  }
  const target = config ?? env;
  return Boolean(target.PAYMENTS_ENABLED && target.RAZORPAY_KEY_ID && target.RAZORPAY_KEY_SECRET);
}
