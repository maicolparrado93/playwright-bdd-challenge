/**
 * Stress Test — GoRest User Registration
 *
 * Business context: Marketing plans a mass user-acquisition campaign.
 * We need to find the system's breaking point and understand how it
 * degrades under extreme load before provisioning more infrastructure.
 *
 * Strategy:
 *  - Progressive ramp-up to extreme VU counts to identify failure threshold
 *  - Each stage adds +50 VUs so the degradation curve is clearly visible
 *  - Monitor: error rate, response time, and rate-limiting signals
 *
 * Expected findings:
 *  - GoRest enforces rate limiting (HTTP 429) at some point
 *  - Response times will degrade before hard failures appear
 *  - Graceful degradation is preferable to abrupt failure
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('custom_error_rate');
const rateLimitedCount = new Counter('rate_limited_requests');
const registrationDuration = new Trend('registration_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },    // warm-up
    { duration: '1m',  target: 50 },    // moderate load
    { duration: '1m',  target: 100 },   // high load
    { duration: '1m',  target: 150 },   // very high load
    { duration: '1m',  target: 200 },   // extreme — find the limit
    { duration: '2m',  target: 200 },   // sustain extreme to observe behavior
    { duration: '1m',  target: 0 },     // recovery — does the system bounce back?
  ],
  thresholds: {
    // These are deliberately lenient for a stress test — we WANT to see where it breaks
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.50'],     // alert if more than half of requests fail
  },
};

const GOREST_TOKEN = __ENV.GOREST_TOKEN;
const BASE_URL = 'https://gorest.co.in/public/v2';

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${GOREST_TOKEN}`,
};

export default function () {
  // Generate a unique email per VU per iteration to avoid false 422s from duplicates
  const timestamp = Date.now();
  const vuId = __VU;
  const iterationId = __ITER;
  const email = `stress_${vuId}_${iterationId}_${timestamp}@test.example.com`;

  const payload = JSON.stringify({
    name: `Stress User ${vuId}-${iterationId}`,
    email,
    gender: vuId % 2 === 0 ? 'male' : 'female',
    status: 'active',
  });

  const res = http.post(`${BASE_URL}/users`, payload, {
    headers: HEADERS,
    tags: { name: 'POST /users' },
  });

  registrationDuration.add(res.timings.duration);

  const isRateLimited = res.status === 429;
  if (isRateLimited) rateLimitedCount.add(1);

  const ok = check(res, {
    'POST /users — success (201)': (r) => r.status === 201,
    'POST /users — response < 5s': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!ok && !isRateLimited); // don't count rate-limiting as an error

  // Clean up: delete the created user if registration succeeded
  if (res.status === 201) {
    try {
      const body = JSON.parse(res.body);
      if (body.id) {
        http.del(`${BASE_URL}/users/${body.id}`, null, {
          headers: HEADERS,
          tags: { name: 'DELETE /users/:id (cleanup)' },
        });
      }
    } catch { /* ignore cleanup errors */ }
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'];
  const rps = data.metrics.http_reqs?.values?.rate;
  const errRate = data.metrics.http_req_failed?.values?.rate;
  const rateLimited = data.metrics.rate_limited_requests?.values?.count ?? 0;
  const total = data.metrics.http_reqs?.values?.count ?? 0;

  console.log('\n═══════ STRESS TEST SUMMARY ═══════');
  console.log(`Total requests    : ${total}`);
  console.log(`p(95) resp time   : ${p95?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`Peak throughput   : ${rps?.toFixed(2) ?? 'N/A'} req/s`);
  console.log(`Error rate        : ${((errRate ?? 0) * 100).toFixed(2)} %`);
  console.log(`Rate-limited reqs : ${rateLimited} (${((rateLimited / total) * 100).toFixed(1)} %)`);
  console.log('═══════════════════════════════════\n');

  return {
    'k6-results/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
