/**
 * Authentication Service
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This service handles all authentication-related API calls
 * including registration, login, profile management, and token handling.
 */

import { apiClient, ApiResponse } from '../client';

// Types
export interface User {
  id: number;
  email: string;
  name?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  interactionStats: {
    totalInteractions: number;
    purchases: number;
    likes: number;
    views: number;
    dislikes: number;
  };
  lastActiveAt: string;
}

export interface UserPreferences {
  id: number;
  userId: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  stylePreferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  preferences: UserPreferences;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  email?: string;
  password?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RefreshTokenResponse {
  token: string;
}

class AuthService {
  public readonly basePath = '/users';

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(`${this.basePath}/register`, data);
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(`${this.basePath}/login`, data);
  }

  /**
   * Logout user (client-side only)
   */
  logout(): void {
    apiClient.removeAuthToken();
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get(`${this.basePath}/profile`);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return apiClient.put(`${this.basePath}/profile`, data);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    return apiClient.put(`${this.basePath}/preferences`, preferences);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    return apiClient.post(`${this.basePath}/refresh`);
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.basePath}/profile`);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return apiClient.isAuthenticated() ? 'stored-token' : null;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
