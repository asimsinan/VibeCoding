// User Types
// TypeScript type definitions for user-related data

// User, UserProfile, and UserPreferences are defined in database.ts
export type { User, UserProfile, UserPreferences } from './database';

export interface UserSession {
  user: User;
  expires: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

export interface UserStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
}