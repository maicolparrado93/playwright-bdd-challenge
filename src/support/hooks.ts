import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
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

Before(async function (this: ApiWorld) {
  this.fakeStoreCtx = await request.newContext({
    baseURL: FAKESTORE_BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
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
  if (this.scenarioState.createdUserId) {
    try {
      await this.goRest.deleteUser(this.scenarioState.createdUserId);
    } catch {
      // Best-effort cleanup; ignore errors to avoid masking test failures
    }
  }

  await this.fakeStoreCtx?.dispose();
  await this.goRestCtx?.dispose();
});
