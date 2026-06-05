import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';
import { GoRestUser } from '../../api/types';

/** Generate a unique email per execution to prevent duplicate-key false negatives */
function uniqueEmail(): string {
  return `qa_test_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}@example.com`;
}

// ─── Given ────────────────────────────────────────────────────────────────────

Given('a unique test email is generated', function (this: ApiWorld) {
  this.scenarioState.createdUserEmail = uniqueEmail();
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I create a GoRest user with name {string} and gender {string}', async function (
  this: ApiWorld,
  name: string,
  gender: string,
) {
  const email = this.scenarioState.createdUserEmail ?? uniqueEmail();
  const user: Omit<GoRestUser, 'id'> = {
    name,
    email,
    gender: gender as GoRestUser['gender'],
    status: 'active',
  };
  this.response = await this.goRest.createUser(user);
  await this.parseBody();

  if (this.response.status() === 201) {
    const body = this.responseBody as GoRestUser;
    this.scenarioState.createdUserId = body.id;
    this.scenarioState.createdUserData = body as unknown as Record<string, unknown>;
  }
});

When('I request the created user', async function (this: ApiWorld) {
  const id = this.scenarioState.createdUserId;
  expect(id).toBeDefined();
  this.response = await this.goRest.getUser(id!);
  await this.parseBody();
});

When('I update the created user email to a new unique email', async function (this: ApiWorld) {
  const id = this.scenarioState.createdUserId;
  expect(id).toBeDefined();
  const newEmail = uniqueEmail();
  this.scenarioState.createdUserEmail = newEmail;
  this.response = await this.goRest.updateUser(id!, { email: newEmail });
  await this.parseBody();
});

When('I try to create another user with the same email', async function (this: ApiWorld) {
  const email = this.scenarioState.createdUserEmail;
  expect(email).toBeDefined();
  const duplicateUser: Omit<GoRestUser, 'id'> = {
    name: 'Duplicate User',
    email: email!,
    gender: 'female',
    status: 'active',
  };
  this.response = await this.goRest.createUser(duplicateUser);
  await this.parseBody();
});

When('I delete the created user', async function (this: ApiWorld) {
  const id = this.scenarioState.createdUserId;
  expect(id).toBeDefined();
  this.response = await this.goRest.deleteUser(id!);
  // 204 No Content — no body to parse
  this.responseBody = null;
  this.scenarioState.createdUserId = undefined; // prevent double-cleanup in After hook
});

When('I request the deleted user', async function (this: ApiWorld) {
  const id = this.scenarioState.createdUserData?.id as number;
  expect(id).toBeDefined();
  this.response = await this.goRest.getUser(id);
  await this.parseBody();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the user should be created successfully', function (this: ApiWorld) {
  expect(this.response.status()).toBe(201);
  const body = this.responseBody as GoRestUser;
  expect(body).toHaveProperty('id');
  expect(typeof body.id).toBe('number');
});

Then('the created user data should match the submitted data', function (this: ApiWorld) {
  const body = this.responseBody as GoRestUser;
  const stored = this.scenarioState.createdUserData as unknown as GoRestUser;
  expect(body.name).toBe(stored.name);
  expect(body.email).toBe(stored.email);
  expect(body.gender).toBe(stored.gender);
  expect(body.status).toBe(stored.status);
});

Then('the user email should match the updated email', function (this: ApiWorld) {
  const body = this.responseBody as GoRestUser;
  expect(body.email).toBe(this.scenarioState.createdUserEmail);
});

Then('the system should reject the duplicate with status {int}', function (
  this: ApiWorld,
  expectedStatus: number,
) {
  expect(this.response.status()).toBe(expectedStatus);
});

Then('the error should indicate the email is already taken', function (this: ApiWorld) {
  const errors = this.responseBody as Array<{ field: string; message: string }>;
  expect(Array.isArray(errors)).toBe(true);
  const emailError = errors.find((e) => e.field === 'email');
  expect(emailError).toBeDefined();
  expect(emailError!.message.toLowerCase()).toContain('taken');
});

Then('the user should no longer exist', function (this: ApiWorld) {
  expect(this.response.status()).toBe(404);
});
