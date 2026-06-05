// ─── FakeStore Types ───────────────────────────────────────────────────────────

export interface Product {
  id?: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
}

export interface CartProduct {
  productId: number;
  quantity: number;
}

export interface Cart {
  id?: number;
  userId: number;
  date: string;
  products: CartProduct[];
}

export interface UserName {
  firstname: string;
  lastname: string;
}

export interface UserAddress {
  city: string;
  street: string;
  number: number;
  zipcode: string;
  geolocation: { lat: string; long: string };
}

export interface FakeStoreUser {
  id?: number;
  email: string;
  username: string;
  password: string;
  name: UserName;
  address: UserAddress;
  phone: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
}

// ─── GoRest Types ──────────────────────────────────────────────────────────────

export type GoRestGender = 'male' | 'female';
export type GoRestStatus = 'active' | 'inactive';

export interface GoRestUser {
  id?: number;
  name: string;
  email: string;
  gender: GoRestGender;
  status: GoRestStatus;
}

export interface GoRestError {
  field: string;
  message: string;
}
