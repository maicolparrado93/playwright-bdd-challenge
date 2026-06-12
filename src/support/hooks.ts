import { Before, After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';

setDefaultTimeout(30_000);
import { request } from '@playwright/test';
import * as dotenv from 'dotenv';
import { ApiWorld } from './world';
import { FakeStoreClient } from '../api/clients/FakeStoreClient';
import { GoRestClient } from '../api/clients/GoRestClient';

dotenv.config();

const FAKESTORE_BASE_URL = process.env.FAKESTORE_BASE_URL ?? 'https://fakestoreapi.com';
// Trailing slash is required: Playwright resolves '/users' against the base host,
// not the base path, following standard URL resolution rules.
// 'https://gorest.co.in/public/v2/' + 'users' → correct
// 'https://gorest.co.in/public/v2'  + '/users' → wrong (drops the path prefix)
const GOREST_BASE_URL = (process.env.GOREST_BASE_URL ?? 'https://gorest.co.in/public/v2/').replace(/\/?$/, '/');

// Detect Cloudflare WAF blocking FakeStoreAPI on CI runner IPs before any scenario runs.
let fakeStoreBlocked = false;

BeforeAll(async function () {
  const ctx = await request.newContext({ baseURL: FAKESTORE_BASE_URL });
  try {
    const res = await ctx.get('/products?limit=1');
    if (res.status() === 403) {
      fakeStoreBlocked = true;
      console.warn(
        '\n[CI WARNING] FakeStoreAPI returned 403 — Cloudflare WAF is blocking this runner\'s IP.\n' +
        'FakeStore scenarios will be marked as PENDING (not failed).\n' +
        'Tests pass locally. This is a known limitation of public API CI pipelines.\n'
      );
    }
  } catch { /* network error — let individual tests surface it */ }
  await ctx.dispose();
});

Before(async function (this: ApiWorld, { pickle }) {
  // Skip FakeStore scenarios gracefully when the API is unreachable from CI
  const isFakeStoreScenario = pickle.uri.includes('fakestore');
  if (isFakeStoreScenario && fakeStoreBlocked) {
    return 'pending';
  }

  this.fakeStoreCtx = await request.newContext({
    baseURL: FAKESTORE_BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  this.goRestCtx = await request.newContext({
    baseURL: GOREST_BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.GOREST_TOKEN ?? ''}`,
    },
  });

  this.fakeStore = new FakeStoreClient(this.fakeStoreCtx);
  this.goRest = new GoRestClient(this.goRestCtx);
  this.scenarioState = {};
});

After(async function (this: ApiWorld) {
  // Cleanup: delete any GoRest user created during the scenario
  if (this.scenarioState?.createdUserId && this.goRest) {
    try {
      await this.goRest.deleteUser(this.scenarioState.createdUserId);
    } catch {
      // Best-effort cleanup; ignore errors to avoid masking test failures
    }
  }

  await this.fakeStoreCtx?.dispose();
  await this.goRestCtx?.dispose();
});
