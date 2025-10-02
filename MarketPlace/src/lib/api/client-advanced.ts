import { ApiResponse, RequestConfig, AuthTokens } from './types';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoff: 'linear' | 'exponential';
  retryCondition: (error: any) => boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface OfflineConfig {
  enabled: boolean;
  queueSize: number;
  syncOnReconnect: boolean;
  retryOnReconnect: boolean;
}

export interface AdvancedApiClientConfig {
  baseUrl: string;
  timeout: number;
  retry: RetryConfig;
  cache: CacheConfig;
  offline: OfflineConfig;
  interceptors?: {
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    response?: (response: ApiResponse<any>) => ApiResponse<any> | Promise<ApiResponse<any>>;
    error?: (error: any) => any | Promise<any>;
  };
}

export class AdvancedApiClient {
  private config: AdvancedApiClientConfig;
  private authTokens: AuthTokens | null = null;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private offlineQueue: Array<{ url: string; config: RequestConfig; resolve: Function; reject: Function }> = [];
  private isOnline: boolean = navigator.onLine;

  constructor(config: AdvancedApiClientConfig) {
    this.config = config;
    this.setupEventListeners();
    this.loadCacheFromStorage();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.config.offline.syncOnReconnect) {
        this.processOfflineQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadCacheFromStorage(): void {
    if (this.config.cache.storage === 'localStorage' || this.config.cache.storage === 'sessionStorage') {
      try {
        const storage = this.config.cache.storage === 'localStorage' ? localStorage : sessionStorage;
        const cached = storage.getItem('api-cache');
        if (cached) {
          const cacheData = JSON.parse(cached);
          this.cache = new Map(cacheData);
        }
      } catch (error) {
        console.warn('Failed to load cache from storage:', error);
      }
    }
  }

  private saveCacheToStorage(): void {
    if (this.config.cache.storage === 'localStorage' || this.config.cache.storage === 'sessionStorage') {
      try {
        const storage = this.config.cache.storage === 'localStorage' ? localStorage : sessionStorage;
        const cacheData = Array.from(this.cache.entries());
        storage.setItem('api-cache', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to save cache to storage:', error);
      }
    }
  }

  private getCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.data ? JSON.stringify(config.data) : '';
    return `${method}:${url}:${body}`;
  }

  private getFromCache(key: string): any | null {
    if (!this.config.cache.enabled) {return null;}

    const cached = this.cache.get(key);
    if (!cached) {return null;}

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.cache.enabled) {return;}

    if (this.cache.size >= this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cache.ttl,
    });

    this.saveCacheToStorage();
  }

  private async retryRequest(url: string, config: RequestConfig, attempt: number = 1): Promise<Response> {
    try {
      const response = await fetch(url, config);
      
      if (!response.ok && this.config.retry.retryCondition({ status: response.status, response })) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt >= this.config.retry.maxRetries) {
        throw error;
      }

      const delay = this.calculateRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryRequest(url, config, attempt + 1);
    }
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retry.retryDelay;
    
    if (this.config.retry.retryBackoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1);
    }
    
    return baseDelay * attempt;
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {return;}

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        const response = await this.makeRequest(item.url, item.config);
        item.resolve(response);
      } catch (error) {
        if (this.config.offline.retryOnReconnect) {
          this.offlineQueue.push(item);
        } else {
          item.reject(error);
        }
      }
    }
  }

  private async makeRequest(url: string, config: RequestConfig): Promise<Response> {
    const fullUrl = `${this.config.baseUrl}${url}`;
    
    const requestConfig: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (this.authTokens?.accessToken) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${this.authTokens.accessToken}`,
      };
    }

    if (config.data) {
      requestConfig.body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestConfig.signal = controller.signal;

    try {
      const response = await this.retryRequest(fullUrl, requestConfig as any);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async executeRequest<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(url, config);
    const method = config.method || 'GET';

    if (method === 'GET' && this.config.cache.enabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { 
          data: cached, 
          success: true, 
          status: 200, 
          statusText: 'OK', 
          headers: {} 
        };
      }
    }

    if (!this.isOnline && this.config.offline.enabled) {
      if (method === 'GET') {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return { 
            data: cached, 
            success: true, 
            status: 200, 
            statusText: 'OK', 
            headers: {} 
          };
        }
      }

      return new Promise((resolve, reject) => {
        if (this.offlineQueue.length >= this.config.offline.queueSize) {
          reject(new Error('Offline queue is full'));
          return;
        }

        this.offlineQueue.push({ url, config, resolve, reject });
      });
    }

    try {
      const response = await this.makeRequest(url, config);
      const data = await response.json();

      if (method === 'GET' && this.config.cache.enabled) {
        this.setCache(cacheKey, data);
      }

      return { 
        data, 
        success: true, 
        status: 200, 
        statusText: 'OK', 
        headers: {} 
      };
    } catch (error) {
      throw error;
    }
  }

  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, endpoint: url, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, endpoint: url, method: 'POST', data });
  }

  async put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, endpoint: url, method: 'PUT', data });
  }

  async patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, endpoint: url, method: 'PATCH', data });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, endpoint: url, method: 'DELETE' });
  }

  async uploadFile<T>(url: string, file: File, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const requestConfig: RequestConfig = {
      ...config,
      endpoint: url,
      method: 'POST',
      data: formData,
      headers: {
        ...config?.headers,
      },
    };

    delete (requestConfig.headers as any)['Content-Type'];

    return this.executeRequest<T>(url, requestConfig);
  }

  setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens;
  }

  clearAuthTokens(): void {
    this.authTokens = null;
  }

  clearCache(): void {
    this.cache.clear();
    if (this.config.cache.storage === 'localStorage' || this.config.cache.storage === 'sessionStorage') {
      const storage = this.config.cache.storage === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem('api-cache');
    }
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }
}

export const createAdvancedApiClient = (config: AdvancedApiClientConfig): AdvancedApiClient => {
  return new AdvancedApiClient(config);
};
