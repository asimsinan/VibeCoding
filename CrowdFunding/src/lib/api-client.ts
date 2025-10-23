import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Client class
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use relative URLs for production (same domain) or localhost for development
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api/v1' 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only logout if we're not on a public page and it's not a page refresh
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/' || 
                                currentPath.startsWith('/campaigns/') || 
                                currentPath.startsWith('/auth/') ||
                                currentPath.startsWith('/my-campaigns') ||
                                currentPath.includes('/edit');
            
            // Don't auto-logout on public pages, edit pages, or profile verification
            if (!isPublicPage && 
                !error.config?.url?.includes('/users/profile') && 
                !error.config?.url?.includes('/campaigns/') &&
                !error.config?.url?.includes('/user-campaigns/')) {
              console.log('Auto-logout triggered:', { currentPath, url: error.config?.url });
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              window.location.href = '/auth/login';
            } else {
              console.log('Skipping auto-logout:', { currentPath, url: error.config?.url, isPublicPage });
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Add cache-busting parameter to prevent caching issues
    const cacheBuster = `_t=${Date.now()}`;
    const separator = url.includes('?') ? '&' : '?';
    const urlWithCacheBuster = `${url}${separator}${cacheBuster}`;
    return this.request<T>({ ...config, method: 'GET', url: urlWithCacheBuster });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Paginated GET request
  async getPaginated<T>(
    url: string, 
    params?: { page?: number; limit?: number; [key: string]: any }
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }

  // Token management methods
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;