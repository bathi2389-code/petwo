import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../backend/src/app';

describe('QA API Integration — Security Headers & Middleware Enforcement', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces Helmet X-Content-Type-Options nosniff header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('enforces clickjacking protection headers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    // Helmet default is SAMEORIGIN or frame-ancestors
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('exposes rate limiting headers on incoming API requests', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('handles CORS preflight OPTIONS request for authorized origins', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/auth/otp/send',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
