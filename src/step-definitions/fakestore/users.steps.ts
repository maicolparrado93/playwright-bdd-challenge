import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';
import { FakeStoreUser } from '../../api/types';

// ─── When ─────────────────────────────────────────────────────────────────────

When('I request all fakestore users', async function (this: ApiWorld) {
  this.response = await this.fakeStore.getAllUsers();
  await this.parseBody();
});

When('I request fakestore user with id {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.getUser(id);
  await this.parseBody();
});

When('I create a fakestore user with the following data:', async function (this: ApiWorld, table: DataTable) {
  const row = table.rowsHash();
  const user: Omit<FakeStoreUser, 'id'> = {
    email: row.email,
    username: row.username,
    password: row.password,
    name: {
      firstname: row.firstname,
      lastname: row.lastname,
    },
    address: {
      city: row.city ?? 'Test City',
      street: row.street ?? 'Test Street',
      number: parseInt(row.number ?? '1'),
      zipcode: row.zipcode ?? '12345',
      geolocation: { lat: '0', long: '0' },
    },
    phone: row.phone ?? '000-000-0000',
  };
  this.response = await this.fakeStore.createUser(user);
  await this.parseBody();
});

When('I update fakestore user {int} with the following data:', async function (this: ApiWorld, id: number, table: DataTable) {
  const row = table.rowsHash();
  const data: Partial<FakeStoreUser> = {};
  if (row.email) data.email = row.email;
  if (row.username) data.username = row.username;
  if (row.phone) data.phone = row.phone;
  this.response = await this.fakeStore.updateUser(id, data);
  await this.parseBody();
});

When('I delete fakestore user {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.deleteUser(id);
  await this.parseBody();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the response should contain a list of users', function (this: ApiWorld) {
  const users = this.responseBody as FakeStoreUser[];
  expect(Array.isArray(users)).toBe(true);
  expect(users.length).toBeGreaterThan(0);
});

Then('each user should have id, email and username', function (this: ApiWorld) {
  const users = this.responseBody as FakeStoreUser[];
  for (const u of users) {
    expect(u).toHaveProperty('id');
    expect(u).toHaveProperty('email');
    expect(u).toHaveProperty('username');
    expect(u.email).toMatch(/.+@.+\..+/);
  }
});

Then('the user should have id {int}', function (this: ApiWorld, id: number) {
  const user = this.responseBody as FakeStoreUser;
  expect(user.id).toBe(id);
});

Then('the user should have a valid email and username', function (this: ApiWorld) {
  const user = this.responseBody as FakeStoreUser;
  expect(user.email).toMatch(/.+@.+\..+/);
  expect(user.username.trim().length).toBeGreaterThan(0);
});

Then('the response should contain the new user with an id', function (this: ApiWorld) {
  const user = this.responseBody as FakeStoreUser;
  expect(user).toHaveProperty('id');
  expect(user.id).toBeTruthy();
});

Then('the user email should be {string}', function (this: ApiWorld, email: string) {
  const user = this.responseBody as FakeStoreUser;
  expect(user.email).toBe(email);
});
