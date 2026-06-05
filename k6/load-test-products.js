/**
 * Load Test — FakeStoreAPI Product Catalog
 *
 * Business context: During peak browsing hours (e.g. start of a flash sale),
 * many users hit the product catalog simultaneously. We need to confirm the
 * system maintains acceptable response times under normal expected load.
 *
 * Strategy:
 *  - Ramp from 0 → 50 VUs over 1 min (users gradually arriving)
 *  - Hold at 50 VUs for 3 min (sustained peak)
 *  - Ramp down 50 → 0 over 1 min (users leaving)
 *
 * Acceptance thresholds:
 *  - p(95) response time < 2 000 ms
 *  - p(99) response time < 3 000 ms
 *  - Error rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('custom_error_rate');
const productListDuration = new Trend('product_list_duration', true);

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp up
    { duration: '3m', target: 50 },   // hold peak
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.01'],
    custom_error_rate: ['rate<0.01'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';

export default function () {
  // ── Scenario A: full catalog ──────────────────────────────────────────────
  const allRes = http.get(`${BASE_URL}/products`, {
    tags: { name: 'GET /products' },
  });

  const allOk = check(allRes, {
    'GET /products — status 200': (r) => r.status === 200,
    'GET /products — body is array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
    'GET /products — non-empty': (r) => {
      try { return JSON.parse(r.body).length > 0; }
      catch { return false; }
    },
  });

  productListDuration.add(allRes.timings.duration);
  errorRate.add(!allOk);

  sleep(1);

  // ── Scenario B: single product detail (simulating a click) ───────────────
  const productId = Math.floor(Math.random() * 20) + 1;
  const detailRes = http.get(`${BASE_URL}/products/${productId}`, {
    tags: { name: 'GET /products/:id' },
  });

  check(detailRes, {
    'GET /products/:id — status 200': (r) => r.status === 200,
    'GET /products/:id — has id field': (r) => {
      try { return JSON.parse(r.body).id !== undefined; }
      catch { return false; }
    },
  });

  sleep(Math.random() * 2 + 1); // think time: 1–3 s
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'];
  const rps = data.metrics.http_reqs?.values?.rate;
  const errRate = data.metrics.http_req_failed?.values?.rate;

  console.log('\n═══════ LOAD TEST SUMMARY ═══════');
  console.log(`p(95) response time : ${p95?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`Throughput          : ${rps?.toFixed(2) ?? 'N/A'} req/s`);
  console.log(`Error rate          : ${((errRate ?? 0) * 100).toFixed(2)} %`);
  console.log('═════════════════════════════════\n');

  return {
    'k6-results/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
