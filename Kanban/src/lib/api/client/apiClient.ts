/**
 * API Client - RESTful API client with authentication and error handling
 * FR-001: API-First Design - Core API client implementation
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  ApiClientConfig,
  ApiRequestConfig,
  ApiResponseData,
  ApiError,
  ValidationError,
  NetworkError,
  TimeoutError,
  isApiError,
  isValidationError,
  isNetworkError,
  isTimeoutError,
} from '../../../contracts/types/api.types';

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication header
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            if (this.accessToken) {
              originalRequest.headers!.Authorization = `Bearer ${this.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            throw new ApiError(401, 'UNAUTHORIZED', 'Authentication failed', {
              code: 'UNAUTHORIZED',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
            });
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.code === 'ECONNABORTED') {
      return new TimeoutError('Request timeout');
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return new NetworkError('Network error occurred');
    }

    const response = error.response;
    const errorData = response.data as any;

    if (response.status === 422 && errorData?.error?.details?.fields) {
      return new ValidationError(errorData.error.details.fields);
    }

    return new ApiError(
      response.status,
      response.statusText,
      errorData || {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken, refreshToken } = response.data;
      this.setTokens(accessToken, refreshToken);
      
      return accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  public getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  public async request<T = any>(config: ApiRequestConfig): Promise<ApiResponseData<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (isApiError(error) || isValidationError(error) || isNetworkError(error) || isTimeoutError(error)) {
        throw error;
      }
      throw new NetworkError('Unexpected error occurred');
    }
  }

  public async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponseData<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
    });
  }

  public async post<T = any>(url: string, data?: any): Promise<ApiResponseData<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  public async put<T = any>(url: string, data?: any): Promise<ApiResponseData<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  public async patch<T = any>(url: string, data?: any): Promise<ApiResponseData<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  public async delete<T = any>(url: string): Promise<ApiResponseData<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  public getBaseURL(): string {
    return this.config.baseURL;
  }

  public updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
  }
}

// Singleton instance
let apiClientInstance: ApiClient | null = null;

export function createApiClient(config: ApiClientConfig): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(config);
  }
  return apiClientInstance;
}

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Call createApiClient first.');
  }
  return apiClientInstance;
}

export function resetApiClient(): void {
  apiClientInstance = null;
}

// Export the API client instance
export { apiClientInstance as apiClient };
