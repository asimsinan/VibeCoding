// Authentication API Service
// API service for authentication endpoints

import { apiClient } from '../client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthTokens,
  UserProfile,
  UserPreferences,
} from '../types';

export class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials);
    
    if (response.success && response.data.data.tokens) {
      apiClient.setAuthTokens(response.data.data.tokens);
    }
    
    return response.data.data;
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<{ success: boolean; data: RegisterResponse }>('/auth/register', userData);
    
    if (response.success && response.data.data.tokens) {
      apiClient.setAuthTokens(response.data.data.tokens);
    }
    
    return response.data.data;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, still clear tokens
      console.warn('Logout request failed:', error);
    } finally {
      apiClient.clearAuthTokens();
    }
  }

  // Refresh authentication tokens
  async refreshTokens(): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/refresh');
    
    if (response.success && response.data) {
      apiClient.setAuthTokens(response.data);
    }
    
    return response.data;
  }

  // Get current user profile
  async getCurrentUser(): Promise<{
    id: string;
    username: string;
    email: string;
    profile?: UserProfile;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        id: string;
        username: string;
        email: string;
        profile?: UserProfile;
      };
    }>('/auth/me');
    
    return response.data.data;
  }

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/profile', profileData);
    return response.data;
  }

  // Get user preferences
  async getUserPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>('/users/preferences');
    return response.data;
  }

  // Update user preferences
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.put<UserPreferences>('/users/preferences', preferences);
    return response.data;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && tokens.expiresAt > Date.now();
  }

  // Get stored authentication tokens
  getStoredTokens(): AuthTokens | null {
    if (typeof window === 'undefined') {return null;}
    
    try {
      const stored = localStorage.getItem('auth_tokens');
      if (stored) {
        const tokens = JSON.parse(stored) as AuthTokens;
        // Check if tokens are expired
        if (tokens.expiresAt > Date.now()) {
          return tokens;
        } else {
          // Clear expired tokens
          localStorage.removeItem('auth_tokens');
        }
      }
    } catch (error) {
      console.error('Error parsing stored auth tokens:', error);
      localStorage.removeItem('auth_tokens');
    }
    
    return null;
  }

  // Initialize authentication from stored tokens
  initializeAuth(): void {
    const tokens = this.getStoredTokens();
    if (tokens) {
      apiClient.setAuthTokens(tokens);
    }
  }
}

// Create default instance
export const authService = new AuthService();
