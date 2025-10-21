// API Client Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  timeout: 120000, // 2 minutes for Gemini API calls
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  UPLOAD: '/upload',
  FEEDBACK: (uploadId: string) => `/feedback/${uploadId}`,
  DELETE_UPLOAD: (uploadId: string) => `/upload/${uploadId}`,
  HEALTH: '/health',
} as const;

// API Client Class
export class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(new DOMException('Request timeout', 'TimeoutError'));
      }
    }, this.timeout);

    try {
      // Merge headers but avoid forcing Content-Type for FormData bodies
      const mergedHeaders: Record<string, string> = {
        ...API_CONFIG.headers,
        ...(options.headers as Record<string, string> | undefined),
      };
      if (options.body instanceof FormData) {
        delete mergedHeaders['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: mergedHeaders,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async uploadResume(file: File, sessionId?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    return this.request(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
    });
  }

  async getFeedback(uploadId: string): Promise<any> {
    return this.request(API_ENDPOINTS.FEEDBACK(uploadId));
  }

  async deleteUpload(uploadId: string): Promise<any> {
    return this.request(API_ENDPOINTS.DELETE_UPLOAD(uploadId), {
      method: 'DELETE',
    });
  }

  async getHealth(): Promise<any> {
    return this.request(API_ENDPOINTS.HEALTH);
  }
}

// Default API client instance
export const apiClient = new ApiClient();
