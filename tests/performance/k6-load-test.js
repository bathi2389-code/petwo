import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent pet parents
    { duration: '1m', target: 200 },   // Normal peak Hyderabad load
    { duration: '30s', target: 500 },  // Surge test (e.g. weekend morning peak)
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests must complete within 250ms
    http_req_failed: ['rate<0.01'],   // Error rate must stay below 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  // 1. Health check baseline
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health returns 200': (r) => r.status === 200,
    'health payload valid': (r) => JSON.parse(r.body).status === 'ok',
  });

  // 2. Simulated In-Clinic Reception TV Polling (every 5 seconds)
  const queueRes = http.get(`${BASE_URL}/api/v1/queue/loc-banjara-hills-01`);
  check(queueRes, {
    'queue returns valid status': (r) => [200, 404].includes(r.status),
  });

  // 3. Dynamic Yield Pricing Quote Calculation
  const yieldPayload = JSON.stringify({
    serviceId: 'srv-vet-general-01',
    providerId: 'prv-dr-srinivas-rao',
    timestamp: new Date().toISOString(),
  });

  const yieldRes = http.post(`${BASE_URL}/api/v1/yield-pricing/quote`, yieldPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(yieldRes, {
    'yield quote processed': (r) => [200, 400, 422].includes(r.status),
  });

  sleep(1);
}
