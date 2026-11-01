import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../backend/src/app';

describe('QA API Integration — System Health & Diagnostics', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 OK with expected system payload', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.status).toBe('ok');
    expect(body.service).toBe('PETCO API');
    expect(body.version).toBe('1.0.0');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('responds with latency well below SLA target (200ms)', async () => {
    const startTime = performance.now();
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    const latency = performance.now() - startTime;

    expect(res.statusCode).toBe(200);
    expect(latency).toBeLessThan(200);
  });

  it('returns standard 404 RES_001 error envelope on undefined endpoints', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/non-existent-route',
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('RES_001');
    expect(body.error.message).toBe('Route not found.');
  });
});
