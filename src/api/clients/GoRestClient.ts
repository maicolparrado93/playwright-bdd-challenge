import { APIRequestContext, APIResponse } from '@playwright/test';
import { GoRestUser } from '../types';

export class GoRestClient {
  constructor(private readonly ctx: APIRequestContext) {}

  // Paths are relative (no leading '/') because baseURL ends with '/'
  getAllUsers(page = 1): Promise<APIResponse> {
    return this.ctx.get(`users?page=${page}`);
  }

  getUser(id: number): Promise<APIResponse> {
    return this.ctx.get(`users/${id}`);
  }

  createUser(data: Omit<GoRestUser, 'id'>): Promise<APIResponse> {
    return this.ctx.post('users', { data });
  }

  updateUser(id: number, data: Partial<GoRestUser>): Promise<APIResponse> {
    return this.ctx.patch(`users/${id}`, { data });
  }

  deleteUser(id: number): Promise<APIResponse> {
    return this.ctx.delete(`users/${id}`);
  }

  findUserByEmail(email: string): Promise<APIResponse> {
    return this.ctx.get(`users?email=${encodeURIComponent(email)}`);
  }
}
