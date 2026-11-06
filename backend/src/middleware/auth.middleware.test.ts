import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({ auth: undefined as any, db: undefined as any }));
vi.mock('../config/firebase', () => ({ getAuth: () => runtime.auth, getDb: () => runtime.db, COLLECTIONS: { USERS: 'users' } }));
import { authenticate } from './auth.middleware';

describe('Firebase authorization middleware', () => {
  let app: ReturnType<typeof Fastify>;
  beforeEach(async () => {
    runtime.auth = { verifyIdToken: vi.fn(async (token: string) => ({ uid: token, email_verified: token !== 'unverified' })) };
    runtime.db = { collection: () => ({ doc: (uid: string) => ({ get: async () => ({ exists: true, data: () => ({ role: uid === 'admin' ? 'admin' : 'customer', isActive: true }) }) }) }) };
    app = Fastify(); app.get('/protected', { preHandler: [authenticate] }, async (request) => ({ role: request.user?.role })); await app.ready();
  });
  afterEach(async () => { await app.close(); });
  it('rejects a Firebase token without the trusted verified-email claim for a customer', async () => {
    const response = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: 'Bearer unverified' } });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('AUTH_EMAIL_UNVERIFIED');
  });
  it('allows verified customer token identity and role from Firestore', async () => {
    const response = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: 'Bearer customer-1' } });
    expect(response.statusCode).toBe(200); expect(response.json().role).toBe('customer');
  });
  it('preserves existing administrator sign-in policy', async () => {
    runtime.auth.verifyIdToken.mockResolvedValueOnce({ uid: 'admin', email_verified: false });
    const response = await app.inject({ method: 'GET', url: '/protected', headers: { authorization: 'Bearer admin' } });
    expect(response.statusCode).toBe(200); expect(response.json().role).toBe('admin');
  });
});
