import Fastify, { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ db: undefined as any, auth: undefined as any }));
vi.mock('../../config/firebase', () => ({ getDb: () => runtime.db, getAuth: () => runtime.auth, COLLECTIONS: { USERS: 'users', CUSTOMERS: 'customers', PROVIDERS: 'providers', PETS: 'pets' } }));
vi.mock('../../middleware/auth.middleware', () => ({
  authenticate: async (_request: any, reply: any) => reply.status(401).send({ success: false }),
  authenticateVerifiedFirebaseUser: async (request: any, reply: any) => {
    const token = request.headers.authorization?.slice(7);
    const decoded = await runtime.auth.verifyIdToken(token);
    if (!decoded.email_verified) return reply.status(403).send({ success: false, error: { code: 'AUTH_EMAIL_UNVERIFIED' } });
    request.firebaseIdentity = { uid: decoded.uid, email: decoded.email.toLowerCase(), emailVerified: true };
  },
}));
import authRoutes from './auth.routes';

const docs = new Map<string, Record<string, any>>();
function ref(collection: string, id: string) {
  const key = `${collection}/${id}`;
  return {
    id,
    get: async () => { const value = docs.get(key); return { exists: Boolean(value), data: () => value ? { ...value } : undefined, id }; },
    set: async (value: Record<string, any>, options?: { merge?: boolean }) => docs.set(key, options?.merge ? { ...docs.get(key), ...value } : { ...value }),
    create: async (value: Record<string, any>) => { if (docs.has(key)) throw new Error('exists'); docs.set(key, { ...value }); },
    update: async (value: Record<string, any>) => docs.set(key, { ...docs.get(key), ...value }),
    delete: async () => { docs.delete(key); },
  };
}
function fakeDb() {
  return { collection: (name: string) => ({ doc: (id: string) => ref(name, id), where: (field: string, _op: string, target: unknown) => ({ limit: (count: number) => ({ get: async () => {
    const result = [...docs.entries()].filter(([key, value]) => key.startsWith(`${name}/`) && value[field] === target).slice(0, count).map(([key, value]) => ({ id: key.slice(name.length + 1), data: () => ({ ...value }) }));
    return { empty: result.length === 0, docs: result };
  } }) }) }), runTransaction: async (callback: any) => callback({ get: (document: any) => document.get(), set: (document: any, value: any, options?: any) => document.set(value, options), create: (document: any, value: any) => document.create(value) }) };
}

describe('Firebase customer profile bootstrap', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    docs.clear(); runtime.db = fakeDb();
    runtime.auth = { verifyIdToken: vi.fn(async (token: string) => token === 'unverified'
      ? { uid: 'customer-1', email: 'parent@example.com', email_verified: false }
      : { uid: 'customer-1', email: 'parent@example.com', email_verified: true }) };
    app = Fastify({ logger: false }); await app.register(authRoutes, { prefix: '/auth' });
  });
  afterEach(async () => { await app.close(); });

  it('rejects unverified Firebase ID tokens before creating profiles', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/customer/profile', headers: { authorization: 'Bearer unverified' }, payload: { displayName: 'Pet Parent' } });
    expect(response.statusCode).toBe(403);
    expect(docs.size).toBe(0);
  });

  it('creates a verified customer profile and first pet idempotently', async () => {
    const payload = { displayName: 'Pet Parent', pet: { name: 'Coco', species: 'dog', breed: 'Indie', gender: 'female' } };
    const request = () => app.inject({ method: 'POST', url: '/auth/customer/profile', headers: { authorization: 'Bearer verified' }, payload });
    const first = await request(); const second = await request();
    expect(first.statusCode).toBe(200); expect(second.statusCode).toBe(200);
    expect(docs.get('users/customer-1')?.role).toBe('customer');
    expect(docs.get('users/customer-1')?.isEmailVerified).toBe(true);
    expect(docs.get('customers/customer-1')?.firstName).toBe('Pet');
    expect([...docs.keys()].filter((key) => key.startsWith('pets/'))).toHaveLength(1);
  });
});
