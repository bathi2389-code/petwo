import Fastify, { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setPaymentsEnabledForTesting, isPaymentsEnabled } from '../../config/env';

const runtime = vi.hoisted(() => ({
  db: undefined as any,
  auth: undefined as any,
}));

vi.mock('../../config/firebase', () => ({
  getDb: () => runtime.db,
  getAuth: () => runtime.auth,
  COLLECTIONS: {
    USERS: 'users',
    CUSTOMERS: 'customers',
    PROVIDERS: 'providers',
    PETS: 'pets',
    BOOKINGS: 'bookings',
    PAYMENTS: 'payments',
  },
}));

vi.mock('../../middleware/auth.middleware', () => ({
  authenticate: async (request: any) => {
    // If test provided a custom user header, parse it, otherwise default to customer
    const roleHeader = request.headers['x-test-role'] as string | undefined;
    const uidHeader = request.headers['x-test-uid'] as string | undefined;
    request.user = {
      uid: uidHeader || 'customer-1',
      role: roleHeader || 'customer',
      isActive: true,
    };
  },
  isCustomer: async (request: any, reply: any) => {
    if (request.user?.role !== 'customer') {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }
  },
  isAdmin: async (request: any, reply: any) => {
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Access denied.' } });
    }
  },
}));

import paymentRoutes, {
  getRazorpayClient,
  setRazorpayClientForTesting,
} from './payment.routes';
import webhookRoutes from './webhook.routes';

const docs = new Map<string, Record<string, any>>();

function ref(collection: string, id: string) {
  const key = `${collection}/${id}`;
  return {
    id,
    get: async () => {
      const value = docs.get(key);
      return {
        exists: Boolean(value),
        data: () => (value ? { ...value } : undefined),
        id,
        ref: ref(collection, id),
      };
    },
    set: async (value: Record<string, any>, options?: { merge?: boolean }) => {
      docs.set(key, options?.merge ? { ...docs.get(key), ...value } : { ...value });
    },
    update: async (value: Record<string, any>) => {
      docs.set(key, { ...docs.get(key), ...value });
    },
  };
}

function fakeDb() {
  return {
    collection: (name: string) => ({
      doc: (id: string) => ref(name, id),
      where: (field: string, _op: string, target: unknown) => ({
        limit: (count: number) => ({
          get: async () => {
            const matches = [...docs.entries()]
              .filter(([key, value]) => key.startsWith(`${name}/`) && value[field] === target)
              .slice(0, count)
              .map(([key, value]) => ({
                id: key.slice(name.length + 1),
                data: () => ({ ...value }),
                ref: ref(name, key.slice(name.length + 1)),
              }));
            return { empty: matches.length === 0, docs: matches };
          },
        }),
      }),
    }),
  };
}

describe('Payment routes when payments are disabled (MVP default)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    docs.clear();
    runtime.db = fakeDb();
    setPaymentsEnabledForTesting(false);
    setRazorpayClientForTesting(null);

    app = Fastify({ logger: false });
    await app.register(paymentRoutes, { prefix: '/api/v1/payments' });
    await app.register(webhookRoutes, { prefix: '/webhooks' });
  });

  afterEach(async () => {
    await app.close();
    setPaymentsEnabledForTesting(null);
    setRazorpayClientForTesting(null);
  });

  it('rejects order creation with HTTP 503', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/orders',
      payload: { bookingId: 'bkg-123' },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAY_503');
    expect(body.error.message).toBe('Payments are temporarily disabled');
  });

  it('rejects payment verification with HTTP 503', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/verify',
      payload: {
        bookingId: 'bkg-123',
        razorpayOrderId: 'order_test_1',
        razorpayPaymentId: 'pay_test_1',
        razorpaySignature: 'sig_test_1',
      },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAY_503');
    expect(body.error.message).toBe('Payments are temporarily disabled');
  });

  it('rejects refunds with HTTP 503 (even for admin)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/refund',
      headers: { 'x-test-role': 'admin', 'x-test-uid': 'admin-1' },
      payload: {
        paymentId: 'pay-123',
        amount: 50000,
        reason: 'Customer cancelled appointment',
      },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAY_503');
    expect(body.error.message).toBe('Payments are temporarily disabled');
  });

  it('rejects Razorpay webhooks with HTTP 503', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhooks/razorpay',
      headers: { 'x-razorpay-signature': 'sig_test' },
      payload: { event: 'payment.captured' },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAY_503');
    expect(body.error.message).toBe('Payments are temporarily disabled');
  });

  it('throws an error if getRazorpayClient is called while payments are disabled', () => {
    expect(isPaymentsEnabled()).toBe(false);
    expect(() => getRazorpayClient()).toThrow(/Payments are disabled/i);
  });

  it('preserves historical payment read access via GET /payments/:paymentId', async () => {
    // Seed a past payment in fakeDb
    docs.set('payments/past-pay-1', {
      id: 'past-pay-1',
      bookingId: 'bkg-1',
      customerId: 'customer-1',
      providerId: 'provider-1',
      gateway: 'razorpay',
      amount: 45000,
      currency: 'INR',
      status: 'captured',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/payments/past-pay-1',
      headers: { 'x-test-role': 'customer', 'x-test-uid': 'customer-1' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('past-pay-1');
    expect(body.data.amount).toBe(45000);
    expect(body.data.status).toBe('captured');
  });
});

describe('Payment routes when payments are enabled', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    docs.clear();
    runtime.db = fakeDb();
    setPaymentsEnabledForTesting(true);

    app = Fastify({ logger: false });
    await app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  });

  afterEach(async () => {
    await app.close();
    setPaymentsEnabledForTesting(null);
    setRazorpayClientForTesting(null);
  });

  it('passes 503 guard and creates an order when payments are enabled with a valid client', async () => {
    // Seed a booking
    docs.set('bookings/bkg-valid-1', {
      id: 'bkg-valid-1',
      customerId: 'customer-1',
      providerId: 'provider-1',
      bookingNumber: 'BKG-2026-0001',
      pricing: { totalAmount: 50000 },
      payment: { status: 'created' },
    });

    // Mock Razorpay SDK order creation
    const mockRazorpay = {
      orders: {
        create: vi.fn(async () => ({
          id: 'order_rzp_mock_123',
          amount: 50000,
          currency: 'INR',
        })),
      },
    } as any;
    setRazorpayClientForTesting(mockRazorpay);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/orders',
      headers: { 'x-test-role': 'customer', 'x-test-uid': 'customer-1' },
      payload: { bookingId: 'bkg-valid-1' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.orderId).toBe('order_rzp_mock_123');
    expect(mockRazorpay.orders.create).toHaveBeenCalledTimes(1);
    expect(docs.get('bookings/bkg-valid-1')?.payment.status).toBe('created');
  });
});
