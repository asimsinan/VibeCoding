/**
 * HTTP Client for Mood Tracker API
 * 
 * Provides a robust HTTP client with error handling, retry logic, and authentication.
 * 
 * @fileoverview Core HTTP client implementation
 * @author Mental Health Journal App
 * @version 1.0.0
 */

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class HttpClient {
  private config: HttpClientConfig;
  private authToken?: string;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | undefined): void {
    this.authToken = token;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, url, data, headers = {}, params } = config;
    
    // Build full URL
    const fullUrl = this.buildUrl(url, params);
    
    // Prepare headers
    const requestHeaders = this.prepareHeaders(headers);
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.config.timeout!),
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    // Execute request with retry logic
    return this.executeWithRetry(fullUrl, requestOptions);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params, headers });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string>): string {
    // Handle relative URLs for same-domain deployment
    let fullUrl: string;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (typeof window !== 'undefined' && this.config.baseURL === '') {
      // Client-side with relative baseURL - use current origin
      fullUrl = `${window.location.origin}${url}`;
    } else {
      fullUrl = `${this.config.baseURL}${url}`;
    }

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });

    return urlObj.toString();
  }

  /**
   * Prepare headers with authentication
   */
  private prepareHeaders(customHeaders: Record<string, string>): Record<string, string> {
    const headers = { ...this.config.headers, ...customHeaders };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(url: string, options: RequestInit): Promise<ApiResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            'HTTP_ERROR',
            { url, status: response.status, statusText: response.statusText }
          );
        }

        const data = await response.json();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries!) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on 4xx client errors (except 429 - rate limit)
    if (error instanceof ApiError && error.status) {
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        return true;
      }
    }

    // Don't retry on network errors that are likely permanent
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
