import { APIRequestContext, APIResponse } from '@playwright/test';
import { Product, Cart, FakeStoreUser, LoginCredentials } from '../types';

export class FakeStoreClient {
  constructor(private readonly ctx: APIRequestContext) {}

  // ─── Products ───────────────────────────────────────────────────────────────

  getAllProducts(limit?: number): Promise<APIResponse> {
    const url = limit ? `/products?limit=${limit}` : '/products';
    return this.ctx.get(url);
  }

  getProduct(id: number): Promise<APIResponse> {
    return this.ctx.get(`/products/${id}`);
  }

  createProduct(data: Omit<Product, 'id' | 'rating'>): Promise<APIResponse> {
    return this.ctx.post('/products', { data });
  }

  updateProduct(id: number, data: Partial<Product>): Promise<APIResponse> {
    return this.ctx.put(`/products/${id}`, { data });
  }

  patchProduct(id: number, data: Partial<Product>): Promise<APIResponse> {
    return this.ctx.patch(`/products/${id}`, { data });
  }

  deleteProduct(id: number): Promise<APIResponse> {
    return this.ctx.delete(`/products/${id}`);
  }

  getCategories(): Promise<APIResponse> {
    return this.ctx.get('/products/categories');
  }

  getProductsByCategory(category: string): Promise<APIResponse> {
    return this.ctx.get(`/products/category/${encodeURIComponent(category)}`);
  }

  // ─── Carts ──────────────────────────────────────────────────────────────────

  getAllCarts(): Promise<APIResponse> {
    return this.ctx.get('/carts');
  }

  getCart(id: number): Promise<APIResponse> {
    return this.ctx.get(`/carts/${id}`);
  }

  createCart(data: Omit<Cart, 'id'>): Promise<APIResponse> {
    return this.ctx.post('/carts', { data });
  }

  updateCart(id: number, data: Partial<Cart>): Promise<APIResponse> {
    return this.ctx.put(`/carts/${id}`, { data });
  }

  deleteCart(id: number): Promise<APIResponse> {
    return this.ctx.delete(`/carts/${id}`);
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  getAllUsers(): Promise<APIResponse> {
    return this.ctx.get('/users');
  }

  getUser(id: number): Promise<APIResponse> {
    return this.ctx.get(`/users/${id}`);
  }

  createUser(data: Omit<FakeStoreUser, 'id'>): Promise<APIResponse> {
    return this.ctx.post('/users', { data });
  }

  updateUser(id: number, data: Partial<FakeStoreUser>): Promise<APIResponse> {
    return this.ctx.put(`/users/${id}`, { data });
  }

  deleteUser(id: number): Promise<APIResponse> {
    return this.ctx.delete(`/users/${id}`);
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  login(credentials: LoginCredentials): Promise<APIResponse> {
    return this.ctx.post('/auth/login', { data: credentials });
  }
}
