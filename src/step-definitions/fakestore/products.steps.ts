import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../../support/world';
import { Product } from '../../api/types';

// ─── When ─────────────────────────────────────────────────────────────────────

When('I request all products', async function (this: ApiWorld) {
  this.response = await this.fakeStore.getAllProducts();
  await this.parseBody();
});

When('I request all products with limit {int}', async function (this: ApiWorld, limit: number) {
  this.response = await this.fakeStore.getAllProducts(limit);
  await this.parseBody();
});

When('I request product with id {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.getProduct(id);
  await this.parseBody();
});

When('I request all product categories', async function (this: ApiWorld) {
  this.response = await this.fakeStore.getCategories();
  await this.parseBody();
});

When('I request products in category {string}', async function (this: ApiWorld, category: string) {
  this.response = await this.fakeStore.getProductsByCategory(category);
  await this.parseBody();
});

When('I create a product with the following data:', async function (this: ApiWorld, table: DataTable) {
  const row = table.rowsHash();
  const product: Omit<Product, 'id' | 'rating'> = {
    title: row.title,
    price: parseFloat(row.price),
    description: row.description,
    image: row.image,
    category: row.category,
  };
  this.response = await this.fakeStore.createProduct(product);
  await this.parseBody();
});

When('I update product {int} with the following data:', async function (this: ApiWorld, id: number, table: DataTable) {
  const row = table.rowsHash();
  const data: Partial<Product> = {};
  if (row.title) data.title = row.title;
  if (row.price) data.price = parseFloat(row.price);
  if (row.description) data.description = row.description;
  if (row.category) data.category = row.category;
  this.response = await this.fakeStore.updateProduct(id, data);
  await this.parseBody();
});

When('I partially update product {int} with the following data:', async function (this: ApiWorld, id: number, table: DataTable) {
  const row = table.rowsHash();
  const data: Partial<Product> = {};
  if (row.title) data.title = row.title;
  if (row.price) data.price = parseFloat(row.price);
  this.response = await this.fakeStore.patchProduct(id, data);
  await this.parseBody();
});

When('I delete product {int}', async function (this: ApiWorld, id: number) {
  this.response = await this.fakeStore.deleteProduct(id);
  await this.parseBody();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the response should contain a list of products', function (this: ApiWorld) {
  const products = this.responseBody as Product[];
  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBeGreaterThan(0);
});

Then('each product should have the required fields', function (this: ApiWorld) {
  const products = this.responseBody as Product[];
  for (const p of products) {
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('title');
    expect(p).toHaveProperty('price');
    expect(p).toHaveProperty('category');
    expect(p).toHaveProperty('image');
    expect(typeof p.price).toBe('number');
    expect(p.price).toBeGreaterThan(0);
    expect(p.title.trim().length).toBeGreaterThan(0);
  }
});

Then('the product list should contain exactly {int} products', function (this: ApiWorld, count: number) {
  const products = this.responseBody as Product[];
  expect(products).toHaveLength(count);
});

Then('the product should have id {int}', function (this: ApiWorld, id: number) {
  const product = this.responseBody as Product;
  expect(product.id).toBe(id);
});

Then('the product should have a valid title and positive price', function (this: ApiWorld) {
  const product = this.responseBody as Product;
  expect(product.title.trim().length).toBeGreaterThan(0);
  expect(typeof product.price).toBe('number');
  expect(product.price).toBeGreaterThan(0);
});

Then('the response should contain the new product with an id', function (this: ApiWorld) {
  const product = this.responseBody as Product;
  expect(product).toHaveProperty('id');
  expect(product.id).toBeTruthy();
});

Then('the product title should be {string}', function (this: ApiWorld, title: string) {
  const product = this.responseBody as Product;
  expect(product.title).toBe(title);
});

Then('the product price should be {float}', function (this: ApiWorld, price: number) {
  const product = this.responseBody as Product;
  expect(product.price).toBe(price);
});

Then('the response should contain a list of categories', function (this: ApiWorld) {
  const categories = this.responseBody as string[];
  expect(Array.isArray(categories)).toBe(true);
  expect(categories.length).toBeGreaterThan(0);
  for (const cat of categories) {
    expect(typeof cat).toBe('string');
    expect(cat.trim().length).toBeGreaterThan(0);
  }
});

Then('all products should belong to category {string}', function (this: ApiWorld, category: string) {
  const products = this.responseBody as Product[];
  for (const p of products) {
    expect(p.category).toBe(category);
  }
});

Then('the deleted product id should be returned', function (this: ApiWorld) {
  const product = this.responseBody as Product;
  expect(product).toHaveProperty('id');
});
