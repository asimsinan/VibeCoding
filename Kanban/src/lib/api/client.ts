/**
 * API Client Configuration
 * Centralized API client with interceptors and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AuthError } from '../auth/types';
import { withRetryAndCircuitBreaker, retryPresets } from './utils/retryUtils';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Get auth token from localStorage or context
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp
        (config as any).metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const duration = Date.now() - (response.config as any).metadata?.startTime;
        console.log(`API Request completed in ${duration}ms: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };

    if (error.response) {
      // Server responded with error status
      apiError.statusCode = error.response.status;
      apiError.message = (error.response.data as any)?.message || error.message;
      apiError.details = (error.response.data as any)?.details;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Network error - please check your connection';
      apiError.statusCode = 0;
    } else {
      // Something else happened
      apiError.message = error.message;
    }

    // Log error for debugging
    console.error('API Error:', {
      message: apiError.message,
      statusCode: apiError.statusCode,
      url: error.config?.url,
      method: error.config?.method,
      details: apiError.details,
    });

    return apiError;
  }

  // Generic HTTP methods with retry logic
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return withRetryAndCircuitBreaker(
      `get-${url}`,
      async () => {
        const response = await this.client.get<ApiResponse<T>>(url, config);
        return response.data;
      },
      retryPresets.normal
    );
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return withRetryAndCircuitBreaker(
      `post-${url}`,
      async () => {
        const response = await this.client.post<ApiResponse<T>>(url, data, config);
        return response.data;
      },
      retryPresets.normal
    );
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return withRetryAndCircuitBreaker(
      `put-${url}`,
      async () => {
        const response = await this.client.put<ApiResponse<T>>(url, data, config);
        return response.data;
      },
      retryPresets.normal
    );
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return withRetryAndCircuitBreaker(
      `patch-${url}`,
      async () => {
        const response = await this.client.patch<ApiResponse<T>>(url, data, config);
        return response.data;
      },
      retryPresets.normal
    );
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return withRetryAndCircuitBreaker(
      `delete-${url}`,
      async () => {
        const response = await this.client.delete<ApiResponse<T>>(url, config);
        return response.data;
      },
      retryPresets.normal
    );
  }

  // Utility methods
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Types are available from the types file
