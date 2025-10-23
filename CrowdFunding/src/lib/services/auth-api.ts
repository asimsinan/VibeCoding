import apiClient, { ApiResponse, PaginatedResponse } from '../api-client';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserProfile {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface UserStats {
  campaignsCount: number;
  donationsCount: number;
  totalDonated: number;
  totalRaised: number;
}

// Auth API Service
export class AuthApiService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', credentials);
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/register', data);
  }

  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/auth/refresh');
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return apiClient.post('/auth/change-password', data);
  }


  async verifyEmail(token: string): Promise<ApiResponse> {
    return apiClient.post('/auth/verify-email', { token });
  }
}

// User API Service
export class UserApiService {
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get('/users/profile');
  }

  async updateProfile(data: UserProfile): Promise<ApiResponse<User>> {
    return apiClient.put('/users/profile', data);
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get('/users/stats');
  }

  async deleteAccount(): Promise<ApiResponse> {
    return apiClient.delete('/users/profile');
  }
}

// Create singleton instances
export const authApiService = new AuthApiService();
export const userApiService = new UserApiService();
