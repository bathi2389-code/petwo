import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ db: undefined as any, auth: undefined as any }));
vi.mock('../../config/env', () => ({ env: {} }));
vi.mock('../../config/firebase', () => ({ getDb: () => runtime.db, getAuth: () => runtime.auth, COLLECTIONS: { USERS: 'users', PROVIDERS: 'providers' } }));
vi.mock('../../middleware/auth.middleware', () => ({
  authenticate: async () => undefined,
  authenticateVerifiedFirebaseUser: async (request: any) => { request.firebaseIdentity = { uid: 'provider-1', email: 'clinic@example.com', emailVerified: true }; },
  isProvider: async () => undefined, isAdmin: async () => undefined, isProviderOrAdmin: async () => undefined,
}));
vi.mock('../../utils/geospatial', () => ({ haversineDistanceKm: () => 0, isValidCoordinates: () => true, encodeGeohash: () => '' }));
vi.mock('../../utils/recommendation', () => ({ calculateRecommendationScore: () => 0, calculateBayesianRating: () => 0 }));
import providerRoutes from './provider.routes';
const docs = new Map<string, Record<string, any>>();
function ref(collection: string, id: string) {
  const key = `${collection}/${id}`;
  return { id, get: async () => ({ exists: docs.has(key), data: () => docs.get(key), id }), set: async (value: any, options?: any) => docs.set(key, options?.merge ? { ...docs.get(key), ...value } : value), create: async (value: any) => { if (docs.has(key)) throw new Error('exists'); docs.set(key, value); }, update: async (value: any) => docs.set(key, { ...docs.get(key), ...value }) };
}
function db() { return { collection: (name: string) => ({ doc: (id: string) => ref(name, id), where: (field: string, _op: string, target: unknown) => ({ limit: (count: number) => ({ get: async () => { const matches = [...docs.entries()].filter(([key, value]) => key.startsWith(`${name}/`) && field.split('.').reduce<any>((item, part) => item?.[part], value) === target).slice(0, count).map(([key, value]) => ({ id: key.slice(name.length + 1), data: () => value })); return { empty: matches.length === 0, docs: matches }; } }) }) }), runTransaction: async (callback: any) => callback({ get: (document: any) => document.get(), set: (document: any, value: any, options?: any) => document.set(value, options), create: (document: any, value: any) => document.create(value), update: (document: any, value: any) => document.update(value) }) }; }

describe('Firebase verified provider registration', () => {
  let app: ReturnType<typeof Fastify>;
  beforeEach(async () => { docs.clear(); runtime.db = db(); runtime.auth = { setCustomUserClaims: vi.fn() }; app = Fastify({ logger: false }); await app.register(providerRoutes, { prefix: '/providers' }); });
  afterEach(async () => { await app.close(); });
  it('creates a pending provider profile and does not mark it approved', async () => {
    const response = await app.inject({ method: 'POST', url: '/providers/register', payload: { contactName: 'Clinic Owner', businessName: 'PETWO Clinic', businessType: 'veterinary_clinic', contact: { phone: '+919876543210', email: 'clinic@example.com' } } });
    expect(response.statusCode).toBe(201);
    expect(docs.get('providers/provider-1')?.verificationStatus).toBe('pending');
    expect(docs.get('users/provider-1')?.role).toBe('provider');
  });
  it('does not expose the retired provider OTP routes', async () => {
    expect((await app.inject({ method: 'POST', url: '/providers/email-verification/otp/send' })).statusCode).toBe(404);
  });
});
