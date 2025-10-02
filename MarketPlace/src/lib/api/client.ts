// API Client
// Centralized API client with authentication, interceptors, and error handling

import { ApiResponse, ApiError, RequestConfig, AuthTokens } from './types';

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private authTokens: AuthTokens | null = null;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: Response) => Response> = [];

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add default request interceptor for authentication
    this.addRequestInterceptor((config) => {
      if (this.authTokens?.accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${this.authTokens.accessToken}`,
        };
      }
      return config;
    });

    // Add default response interceptor for authentication errors
    this.addResponseInterceptor((response) => {
      if (response.status === 401) {
        this.clearAuthTokens();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return response;
    });
  }

  // Authentication methods
  setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens;
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    }
  }

  clearAuthTokens(): void {
    this.authTokens = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens');
    }
  }


  // Interceptor methods
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response): void {
    this.responseInterceptors.push(interceptor);
  }

  // Core request method
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // Apply request interceptors
      let finalConfig = config;
      for (const interceptor of this.requestInterceptors) {
        finalConfig = interceptor(finalConfig);
      }

      const url = `${this.baseURL}${finalConfig.endpoint}`;
      const requestInit: RequestInit = {
        method: finalConfig.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...finalConfig.headers,
        },
      };

      if (finalConfig.data) {
        requestInit.body = JSON.stringify(finalConfig.data);
      }

      const response = await fetch(url, requestInit);

      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = interceptor(finalResponse);
      }

      const data = await this.parseResponse<T>(finalResponse);

      // If the response is not successful, throw an error with the error message
      if (!finalResponse.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${finalResponse.status}: ${finalResponse.statusText}`;
        throw new ApiError(errorMessage, config.endpoint);
      }

      return {
        data,
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: this.parseHeaders(finalResponse.headers),
        success: finalResponse.ok,
      };
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        config.endpoint,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    }
    
    return response.blob() as unknown as T;
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'GET',
      ...config,
    });
  }

  async post<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'POST',
      data,
      ...config,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'PUT',
      data,
      ...config,
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'PATCH',
      data,
      ...config,
    });
  }

  async delete<T>(endpoint: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'DELETE',
      ...config,
    });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Apply request interceptors
      let finalConfig: RequestConfig = {
        endpoint,
        method: 'POST',
        data: formData,
        headers: {},
        ...config,
      };

      for (const interceptor of this.requestInterceptors) {
        finalConfig = interceptor(finalConfig);
      }

      const url = `${this.baseURL}${finalConfig.endpoint}`;
      const requestInit: RequestInit = {
        method: finalConfig.method || 'POST',
        headers: {
          ...this.defaultHeaders,
          ...finalConfig.headers,
        },
      };

      // Don't set Content-Type for FormData, let browser set it with boundary
      if (requestInit.headers && 'Content-Type' in requestInit.headers) {
        delete (requestInit.headers as any)['Content-Type'];
      }

      if (finalConfig.data) {
        requestInit.body = finalConfig.data;
      }

      const response = await fetch(url, requestInit);

      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = interceptor(finalResponse);
      }

      const data = await this.parseResponse<T>(finalResponse);

      return {
        data,
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: this.parseHeaders(finalResponse.headers),
        success: finalResponse.ok,
      };
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        endpoint,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  // Health check method
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

// Create default instance
export const apiClient = new ApiClient(
  typeof window !== 'undefined' 
    ? window.location.origin + '/api'
    : process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
      : '/api'
);
