import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { initializeFirebase } from './config/firebase';

// Route plugins
import authRoutes from './api/routes/auth.routes';
import customerRoutes from './api/routes/customer.routes';
import petRoutes from './api/routes/pet.routes';
import providerRoutes from './api/routes/provider.routes';
import serviceRoutes from './api/routes/service.routes';
import bookingRoutes from './api/routes/booking.routes';
import paymentRoutes from './api/routes/payment.routes';
import reviewRoutes from './api/routes/review.routes';
import notificationRoutes from './api/routes/notification.routes';
import supportRoutes from './api/routes/support.routes';
import adminRoutes from './api/routes/admin.routes';
import webhookRoutes from './api/routes/webhook.routes';
import aiTriageRoutes from './api/routes/ai-triage.routes';
import teleconsultRoutes from './api/routes/teleconsult.routes';
import emergencyRoutes from './api/routes/emergency.routes';
import whatsappRoutes from './api/routes/whatsapp.routes';
import iotTrackerRoutes from './api/routes/iot-tracker.routes';
import queueRoutes from './api/routes/queue.routes';
import healthPassportRoutes from './api/routes/health-passport.routes';
import rewardsRoutes from './api/routes/rewards.routes';
import insuranceRoutes from './api/routes/insurance.routes';
import diagnosticRoutes from './api/routes/diagnostics.routes';
import yieldPricingRoutes from './api/routes/yield-pricing.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
    },
    trustProxy: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: true,
      },
    },
  });

  // ─── Security ───────────────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        code: 'SYS_003',
        message: `Rate limit exceeded. Try again in ${context.after}.`,
      },
    }),
  });

  // ─── API Documentation ───────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'PETWO API',
          description: 'Production-Grade PetCare Marketplace API',
          version: '1.0.0',
          contact: { name: 'PETWO Engineering', email: 'engineering@petwo.in' },
        },
        servers: [{ url: `http://localhost:${env.PORT}`, description: 'Development' }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
        tags: [
          { name: 'Auth', description: 'Authentication and authorization' },
          { name: 'Customers', description: 'Customer profile management' },
          { name: 'Pets', description: 'Pet profile management' },
          { name: 'Providers', description: 'Provider profiles and discovery' },
          { name: 'Services', description: 'Service catalog' },
          { name: 'Bookings', description: 'Booking management' },
          { name: 'Payments', description: 'Payment processing' },
          { name: 'Reviews', description: 'Reviews and ratings' },
          { name: 'Admin', description: 'Admin operations' },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: true },
    });
  }

  // ─── Health Check ────────────────────────────────────────────────────────────
  app.get('/health', {
    schema: { tags: ['System'] },
  }, async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'PETWO API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ──────────────────────────────────────────────────────────────
  const prefix = `/api/${env.API_VERSION}`;

  await app.register(webhookRoutes,     { prefix: '/webhooks' });
  await app.register(authRoutes,        { prefix: `${prefix}/auth` });
  await app.register(customerRoutes,    { prefix: `${prefix}/customers` });
  await app.register(petRoutes,         { prefix: `${prefix}/pets` });
  await app.register(providerRoutes,    { prefix: `${prefix}/providers` });
  await app.register(serviceRoutes,     { prefix: `${prefix}/services` });
  await app.register(bookingRoutes,     { prefix: `${prefix}/bookings` });
  await app.register(paymentRoutes,     { prefix: `${prefix}/payments` });
  await app.register(reviewRoutes,      { prefix: `${prefix}/reviews` });
  await app.register(notificationRoutes,{ prefix: `${prefix}/notifications` });
  await app.register(supportRoutes,     { prefix: `${prefix}/support` });
  await app.register(adminRoutes,       { prefix: `${prefix}/admin` });
  await app.register(aiTriageRoutes,    { prefix: `${prefix}/ai-triage` });
  await app.register(teleconsultRoutes, { prefix: `${prefix}/teleconsult` });
  await app.register(emergencyRoutes,   { prefix: `${prefix}/emergency` });
  await app.register(whatsappRoutes,    { prefix: `${prefix}/whatsapp` });
  await app.register(iotTrackerRoutes,  { prefix: `${prefix}/iot` });
  await app.register(queueRoutes,       { prefix: `${prefix}/queue` });
  await app.register(healthPassportRoutes, { prefix: `${prefix}/health-passport` });
  await app.register(rewardsRoutes,     { prefix: `${prefix}/rewards` });
  await app.register(insuranceRoutes,   { prefix: `${prefix}/insurance` });
  await app.register(diagnosticRoutes,  { prefix: `${prefix}/diagnostics` });
  await app.register(yieldPricingRoutes,{ prefix: `${prefix}/yield-pricing` });

  // ─── Global Error Handler ────────────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error.name === 'ZodError' || error.validation) {
      return reply.status(422).send({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
          details: (error as any).errors || error.validation,
        },
      });
    }

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 404 ? 'RES_001' : 'SYS_001',
        message: statusCode < 500 ? error.message : 'An internal error occurred.',
      },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'RES_001', message: 'Route not found.' },
    });
  });

  return app;
}
