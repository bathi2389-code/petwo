import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../backend/src/app';

describe('QA Security Audit — OWASP Top 10 Resilience Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('A03:2021 — Injection Flaw Resistance', () => {
    it('rejects SQL injection payloads in phone authentication fields', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/otp/send',
          payload: { phone: payload },
        });

        // Must reject with validation failure (422) or client error (400)
        expect([400, 422]).toContain(res.statusCode);
        const body = JSON.parse(res.body);
        expect(body.success).toBe(false);
      }
    });

    it('rejects NoSQL injection operator objects in place of primitive strings', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/send',
        payload: { phone: { $gt: '' } }, // Attempting Mongo/NoSQL operator injection
      });

      expect([400, 422]).toContain(res.statusCode);
      const body = JSON.parse(res.body);
      // Fastify or custom envelope
      expect(body.success === false || body.statusCode === 400 || body.statusCode === 422 || body.error !== undefined).toBe(true);
    });
  });

  describe('A01:2021 — Broken Access Control', () => {
    it('denies unauthenticated requests to protected admin endpoints with 401', async () => {
      const protectedEndpoints = [
        { method: 'GET' as const, url: '/api/v1/admin/analytics/overview' },
        { method: 'GET' as const, url: '/api/v1/admin/providers' },
        { method: 'GET' as const, url: '/api/v1/admin/audit-logs' },
      ];

      for (const endpoint of protectedEndpoints) {
        const res = await app.inject({
          method: endpoint.method,
          url: endpoint.url,
        });

        expect(res.statusCode).toBe(401);
        const body = JSON.parse(res.body);
        expect(body.success).toBe(false);
      }
    });

    it('denies unauthenticated access to customer pet health passport writes with 401', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/health-passport/pet_unauth_01/microchip',
        payload: { microchipId: '900215000492817' },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(false);
    });
  });

  describe('A07:2021 — Identification & Authentication Failures', () => {
    it('rejects malformed or invalid JWT bearer tokens', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('rejects OTP verification without required 6-digit length', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/otp/verify',
        payload: {
          phone: '+919876543210',
          otp: '12', // Too short (requires 6 digits)
        },
      });

      expect([400, 422]).toContain(res.statusCode);
    });
  });

  describe('A05:2021 — Security Misconfiguration & Rate Limiting', () => {
    it('does not leak internal stack traces or database driver details in 404 responses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/debug/leak-test',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).not.toContain('node_modules');
      expect(res.body).not.toContain('firestore');
    });
  });
});
