import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';

Given('the API is available', function (this: ApiWorld) {
  // Precondition marker — actual context setup happens in the Before hook
});

Then('the response status should be {int}', function (this: ApiWorld, expectedStatus: number) {
  expect(this.response.status()).toBe(expectedStatus);
});

Then('the response status should be {int} or {int}', function (this: ApiWorld, a: number, b: number) {
  const actual = this.response.status();
  expect([a, b], `Expected status ${a} or ${b}, got ${actual}`).toContain(actual);
});

Then('the response body should not be empty', function (this: ApiWorld) {
  expect(this.responseBody).not.toBeNull();
  expect(this.responseBody).not.toBeUndefined();
});

Then('the response should contain field {string}', function (this: ApiWorld, field: string) {
  expect(this.responseBody).toHaveProperty(field);
});

Then('the response should be an array', function (this: ApiWorld) {
  expect(Array.isArray(this.responseBody)).toBe(true);
});

Then('the response array should not be empty', function (this: ApiWorld) {
  expect(Array.isArray(this.responseBody)).toBe(true);
  expect((this.responseBody as unknown[]).length).toBeGreaterThan(0);
});

Then('the response body should be null', function (this: ApiWorld) {
  expect(this.responseBody).toBeNull();
});
