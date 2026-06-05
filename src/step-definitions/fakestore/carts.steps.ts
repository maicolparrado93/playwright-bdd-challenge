import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';
import { Cart, CartProduct } from '../../api/types';

// ─── When ─────────────────────────────────────────────────────────────────────

When('I request all carts', async function (this: ApiWorld) {
  this.response = await this.fakeStore.getAllCarts();
  await this.parseBody();
});

When('I request cart with id {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.getCart(id);
  await this.parseBody();
});

When('I create a cart with the following data:', async function (this: ApiWorld, table: DataTable) {
  const rows = table.hashes();
  const products: CartProduct[] = rows.map((r) => ({
    productId: parseInt(r.productId),
    quantity: parseInt(r.quantity),
  }));
  const cart: Omit<Cart, 'id'> = {
    userId: 1,
    date: new Date().toISOString().split('T')[0],
    products,
  };
  this.response = await this.fakeStore.createCart(cart);
  await this.parseBody();
});

When('I update cart {int} with product {int} quantity {int}', async function (
  this: ApiWorld,
  cartId: number,
  productId: number,
  quantity: number,
) {
  const data: Partial<Cart> = {
    products: [{ productId, quantity }],
  };
  this.response = await this.fakeStore.updateCart(cartId, data);
  await this.parseBody();
});

When('I delete cart {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.deleteCart(id);
  await this.parseBody();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the response should contain a list of carts', function (this: ApiWorld) {
  const carts = this.responseBody as Cart[];
  expect(Array.isArray(carts)).toBe(true);
  expect(carts.length).toBeGreaterThan(0);
});

Then('each cart should have id, userId and products', function (this: ApiWorld) {
  const carts = this.responseBody as Cart[];
  for (const cart of carts) {
    expect(cart).toHaveProperty('id');
    expect(cart).toHaveProperty('userId');
    expect(cart).toHaveProperty('products');
    expect(Array.isArray(cart.products)).toBe(true);
  }
});

Then('the cart should have id {int}', function (this: ApiWorld, id: number) {
  const cart = this.responseBody as Cart;
  expect(cart.id).toBe(id);
});

Then('the cart should contain products', function (this: ApiWorld) {
  const cart = this.responseBody as Cart;
  expect(Array.isArray(cart.products)).toBe(true);
  expect(cart.products.length).toBeGreaterThan(0);
});

Then('the response should contain the new cart with an id', function (this: ApiWorld) {
  const cart = this.responseBody as Cart;
  expect(cart).toHaveProperty('id');
  expect(cart.id).toBeTruthy();
});

Then('the response should contain the updated cart', function (this: ApiWorld) {
  const cart = this.responseBody as Cart;
  expect(cart).toHaveProperty('id');
  expect(cart).toHaveProperty('products');
});

Then('the deleted cart id should be returned', function (this: ApiWorld) {
  const cart = this.responseBody as Cart;
  expect(cart).toHaveProperty('id');
});
