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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
