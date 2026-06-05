import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';
import { AuthToken } from '../../api/types';

When('I login with username {string} and password {string}', async function (
  this: ApiWorld,
  username: string,
  password: string,
) {
  this.response = await this.fakeStore.login({ username, password });
  await this.parseBody();
});

When('I login with an empty username', async function (this: ApiWorld) {
  this.response = await this.fakeStore.login({ username: '', password: 'some_password' });
  await this.parseBody();
});

When('I login with an empty password', async function (this: ApiWorld) {
  this.response = await this.fakeStore.login({ username: 'mor_2314', password: '' });
  await this.parseBody();
});

Then('the response should contain a JWT token', function (this: ApiWorld) {
  const body = this.responseBody as AuthToken;
  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');
  expect(body.token.trim().length).toBeGreaterThan(0);
});

Then('the response should indicate authentication failure', function (this: ApiWorld) {
  // FakeStore returns 4xx or an error message for bad credentials
  const isClientError = this.response.status() >= 400 && this.response.status() < 500;
  const hasErrorMessage = this.responseBody !== null &&
    typeof this.responseBody === 'object' &&
    ('message' in (this.responseBody as object) || 'error' in (this.responseBody as object));
  expect(isClientError || hasErrorMessage).toBe(true);
});
