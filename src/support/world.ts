import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { APIRequestContext, APIResponse } from '@playwright/test';
import { FakeStoreClient } from '../api/clients/FakeStoreClient';
import { GoRestClient } from '../api/clients/GoRestClient';

export class ApiWorld extends World {
  // Playwright contexts
  fakeStoreCtx!: APIRequestContext;
  goRestCtx!: APIRequestContext;

  // API client wrappers
  fakeStore!: FakeStoreClient;
  goRest!: GoRestClient;

  // Latest HTTP interaction
  response!: APIResponse;
  responseBody!: unknown;

  // Scenario-scoped state (reset each scenario via Before hook)
  scenarioState: {
    createdUserId?: number;
    createdUserEmail?: string;
    createdUserData?: Record<string, unknown>;
  } = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Parse and cache response body. Returns null on parse failure. */
  async parseBody(): Promise<unknown> {
    try {
      this.responseBody = await this.response.json();
    } catch {
      this.responseBody = null;
    }
    return this.responseBody;
  }
}

setWorldConstructor(ApiWorld);
