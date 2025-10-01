/**
 * API Client Configuration
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file sets up the Axios HTTP client with proper configuration,
 * interceptors, authentication handling, and error management.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://personal-shopping-assistant.vercel.app';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    status: number;
    timestamp: string;
    path: string;
    method: string;
  };
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
}

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// API Client Class
class ApiClient {
  public client: AxiosInstance;
  public isRefreshing = false;
  public refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        // Add authentication token
        const token = TokenManager.getToken();
        console.log('🔑 API Request - Token check:', { 
          hasToken: !!token, 
          isExpired: token ? TokenManager.isTokenExpired(token) : 'N/A',
          url: config.url 
        });
        if (token && !TokenManager.isTokenExpired(token)) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
          console.log('🔑 API Request - Authorization header added');
        } else {
          console.log('🔑 API Request - No valid token, request will be unauthorized');
        }

        // Add request timestamp for debugging
        (config as any).metadata = { startTime: Date.now() };

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          // API request logging would be implemented here
        }

        return config;
      },
      (error: AxiosError) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        // const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);

        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          const duration = Date.now() - (response.config as any).metadata?.startTime;
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
        }
        
        // Always log recommendation API responses for debugging
        if (response.config.url?.includes('/recommendations/')) {
          console.log(`🎯 Recommendation API Response: ${response.config.url}`, {
            success: response.data?.success,
            data: response.data?.data,
            error: response.data?.error,
            status: response.status
          });
        }

        return response;
      },
      async (error: any) => {
        const originalRequest = error.config as any & { _retry?: boolean };

        // Log recommendation API errors
        if (error.config?.url?.includes('/recommendations/')) {
          console.log(`❌ Recommendation API Error: ${error.config.url}`, {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message,
            data: error.response?.data
          });
        }

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, wait for the new token
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${token}`,
                };
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              this.onRefreshed(newToken);
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
              return this.client(originalRequest);
            }
          } catch (refreshError: any) {
            this.onRefreshFailed();
            return Promise.reject(this.handleError(refreshError as AxiosError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  public async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/api/${API_VERSION}/users/refresh`, {
        refreshToken,
      });

      const { token } = response.data.data;
      TokenManager.setToken(token);
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  public onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
    this.isRefreshing = false;
  }

  public onRefreshFailed(): void {
    this.refreshSubscribers = [];
    this.isRefreshing = false;
    TokenManager.removeToken();
    // Redirect to login page or emit event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  public handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: 500,
      timestamp: new Date().toISOString(),
      path: error.config?.url || '',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
    };

    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as ApiResponse;
      apiError.message = responseData.error?.message || error.message;
      apiError.status = error.response.status;
      apiError.details = responseData.error;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Network error - please check your connection';
      apiError.status = 0;
    } else {
      // Something else happened
      apiError.message = error.message;
    }

    return apiError;
  }

  // Public methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // Utility methods
  public setAuthToken(token: string): void {
    TokenManager.setToken(token);
  }

  public removeAuthToken(): void {
    TokenManager.removeToken();
  }

  public isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  public getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }

  public setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export types and utilities
export { TokenManager };
export type { AxiosRequestConfig, AxiosResponse, AxiosError };

// Default export
export default apiClient;
