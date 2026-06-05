/**
 * Spike Test — FakeStoreAPI Product Catalog
 *
 * Business context: Flash sales and product launches cause sudden traffic
 * spikes. This test simulates an abrupt 20x traffic increase to verify the
 * infrastructure can absorb the shock and recover without data loss.
 *
 * Strategy:
 *  - Baseline: 5 VUs (normal off-peak traffic)
 *  - Spike:   100 VUs in 10 s (sudden surge — event starts)
 *  - Sustain:  hold 100 VUs for 2 min
 *  - Recovery: back to 5 VUs (event ends)
 *  - Observe:  watch response times normalize after the spike
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('custom_error_rate');

export const options = {
  stages: [
    { duration: '1m',  target: 5   },  // baseline
    { duration: '10s', target: 100 },  // spike — abrupt increase
    { duration: '2m',  target: 100 },  // sustain spike
    { duration: '10s', target: 5   },  // drop back to baseline
    { duration: '1m',  target: 5   },  // recovery observation
    { duration: '10s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<4000'],  // more lenient during spike
    http_req_failed: ['rate<0.05'],     // max 5% errors
    custom_error_rate: ['rate<0.05'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';

export default function () {
  const endpoints = [
    { url: `${BASE_URL}/products`, tag: 'GET /products' },
    { url: `${BASE_URL}/products/categories`, tag: 'GET /categories' },
    { url: `${BASE_URL}/products/${Math.floor(Math.random() * 20) + 1}`, tag: 'GET /products/:id' },
  ];

  // Each VU randomly picks one of the catalog endpoints
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(endpoint.url, {
    tags: { name: endpoint.tag },
  });

  const ok = check(res, {
    [`${endpoint.tag} — status 200`]: (r) => r.status === 200,
    [`${endpoint.tag} — body not empty`]: (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!ok);
  sleep(Math.random() + 0.5); // 0.5–1.5 s think time
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values?.['p(50)'];
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'];
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'];
  const errRate = data.metrics.http_req_failed?.values?.rate;

  console.log('\n═══════ SPIKE TEST SUMMARY ═══════');
  console.log(`p(50) response time : ${p50?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`p(95) response time : ${p95?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`p(99) response time : ${p99?.toFixed(0) ?? 'N/A'} ms`);
  console.log(`Error rate          : ${((errRate ?? 0) * 100).toFixed(2)} %`);
  console.log('══════════════════════════════════\n');

  return {
    'k6-results/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
