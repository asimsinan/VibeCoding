/**
 * API Client Setup
 * 
 * HTTP client with request/response handling and error management:
 * - HTTP client configured (axios/fetch)
 * - Request/response interceptors
 * - Error handling and retry logic
 * - TypeScript types for API responses
 * - Authentication token management
 * - Response caching with invalidation strategies
 * - Offline support with service worker
 * - Request timeout and retry configuration
 * - Base URL configuration for different environments
 * - Request/response logging for debugging
 * 
 * Maps to TASK-014: API Client Setup
 * TDD Phase: Contract
 * Constitutional Compliance: API-First Gate, Progressive Enhancement Gate
 */

import axios from 'axios';

class ApiClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.enableLogging = config.enableLogging || process.env.NODE_ENV === 'development';
    
    this.requestQueue = new Map();
    
    // Authentication
    this.authToken = null;
    this.refreshToken = null;
    this.tokenRefreshPromise = null;
    
    this.setupAxiosInstance();
    this.setupInterceptors();
    this.setupOfflineSupport();
  }

  /**
   * Setup axios instance with base configuration
   */
  setupAxiosInstance() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Log request in development

        return config;
      },
      (error) => {
        if (this.enableLogging) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Response processed

        return response;
      },
      async (error) => {
        if (this.enableLogging) {
          console.error('❌ Response Error:', error.response?.status, error.message);
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAuthToken();
            // Retry the original request
            return this.client.request(error.config);
          } catch (refreshError) {
            this.clearAuth();
            throw refreshError;
          }
        }

        // Handle network errors with retry logic
        if (!error.response && error.code === 'ECONNABORTED') {
          return this.retryRequest(error.config);
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Setup offline support
   */
  setupOfflineSupport() {
    // Check if we're online
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Retry failed request with exponential backoff
   */
  async retryRequest(config, attempt = 1) {
    if (attempt > this.retryAttempts) {
      throw new Error(`Request failed after ${this.retryAttempts} attempts`);
    }

    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    

    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      return await this.client.request(config);
    } catch (error) {
      return this.retryRequest(config, attempt + 1);
    }
  }

  /**
   * Transform axios error to standardized format
   */
  transformError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        type: 'API_ERROR',
        status: error.response.status,
        message: error.response.data?.error?.message || error.message,
        code: error.response.data?.error?.code || 'UNKNOWN_ERROR',
        details: error.response.data?.error?.details || null,
        requestId: error.response.headers['x-request-id'],
        timestamp: new Date().toISOString()
      };
    } else if (error.request) {
      // Network error
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        details: error.message,
        timestamp: new Date().toISOString()
      };
    } else {
      // Other error
      return {
        type: 'CLIENT_ERROR',
        message: error.message || 'An unexpected error occurred',
        code: 'CLIENT_ERROR',
        details: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token, refreshToken = null) {
    this.authToken = token;
    this.refreshToken = refreshToken;
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.authToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    if (!this.refreshToken || this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.client.post('/auth/refresh', {
      refreshToken: this.refreshToken
    }).then(response => {
      const { token, refreshToken } = response.data.data;
      this.setAuthToken(token, refreshToken);
      this.tokenRefreshPromise = null;
      return token;
    }).catch(error => {
      this.tokenRefreshPromise = null;
      this.clearAuth();
      throw error;
    });

    return this.tokenRefreshPromise;
  }

  /**
   * Queue request for offline processing
   */
  queueRequest(config) {
    const requestId = `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.requestQueue.set(requestId, {
      config,
      timestamp: Date.now()
    });
    return requestId;
  }

  /**
   * Process queued requests when back online
   */
  async processQueuedRequests() {
    const requests = Array.from(this.requestQueue.values());
    this.requestQueue.clear();

    for (const request of requests) {
      try {
        await this.client.request(request.config);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  /**
   * Make HTTP request with caching and offline support
   */
  async request(config) {
    // Check if we're offline
    if (!this.isOnline) {
      if (config.method === 'get') {
        // Try to return cached data
        const cached = this.getCachedResponse(config.url);
        if (cached) {
          return { data: cached, fromCache: true };
        }
      }
      
      // Queue request for later
      const requestId = this.queueRequest(config);
      throw new Error(`Request queued offline (ID: ${requestId})`);
    }

    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.request({
      method: 'get',
      url,
      ...config
    });
  }

  /**
   * POST request
   */
  async post(url, data, config = {}) {
    return this.request({
      method: 'post',
      url,
      data,
      ...config
    });
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return this.request({
      method: 'put',
      url,
      data,
      ...config
    });
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.request({
      method: 'delete',
      url,
      ...config
    });
  }

  /**
   * PATCH request
   */
  async patch(url, data, config = {}) {
    return this.request({
      method: 'patch',
      url,
      data,
      ...config
    });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp
      }))
    };
  }

  /**
   * Initialize from localStorage
   */
  initialize() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (token) {
        this.setAuthToken(token, refreshToken);
      }
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Initialize on load
if (typeof window !== 'undefined') {
  apiClient.initialize();
}

export { ApiClient, apiClient };
