/**
 * Mood Tracker API Client
 * 
 * High-level API client for mood tracking operations with error handling and caching.
 * 
 * @fileoverview Main API client implementation
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { HttpClient, HttpClientConfig, ApiResponse, ApiError } from './HttpClient';
import { MoodEntry, User, MoodTrend } from '../../mood-core/models';

export interface MoodApiClientConfig extends HttpClientConfig {
  enableCaching?: boolean;
  cacheTimeout?: number;
}

export interface CreateMoodEntryRequest {
  rating: number;
  notes?: string;
  date?: string;
  entryDate?: string; // Also provide entryDate for compatibility
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateMoodEntryRequest {
  rating?: number;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface GetMoodEntriesParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  tags?: string[];
}

export interface GetTrendsParams {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface SyncResult {
  success: boolean;
  localToCloud: number;
  cloudToLocal: number;
  errors: string[];
  duration: number;
}

export interface ApiStats {
  totalEntries: number;
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  lastEntryDate?: string;
}

export class MoodApiClient {
  private httpClient: HttpClient;
  private config: MoodApiClientConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: MoodApiClientConfig) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes
      ...config,
    };
    this.httpClient = new HttpClient(config);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | undefined): void {
    this.httpClient.setAuthToken(token);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.httpClient.get('/health');
    return response.data;
  }

  /**
   * Create mood entry
   */
  async createMoodEntry(request: CreateMoodEntryRequest): Promise<MoodEntry> {
    try {
      const response = await this.httpClient.post<any>('/api/v1/mood-entries', request);
      
      // Transform API response to UI format
      const entryDate = response.data.entry_date || response.data.date || new Date().toISOString().split('T')[0];
      const dateOnly = entryDate.split('T')[0];
      
      const transformedData = {
        id: response.data.id.toString(),
        userId: response.data.user_id,
        rating: response.data.rating,
        notes: response.data.notes,
        date: dateOnly,
        entryDate: dateOnly,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        status: response.data.status,
        tags: response.data.tags || [],
        metadata: response.data.metadata || {}
      };
    
      this.invalidateCache('mood-entries');
      return transformedData;
    } catch (error: any) {
      // Re-throw with better error message for duplicate entries
      if (error.response?.status === 409 || error.response?.data?.error?.code === 'DUPLICATE_ENTRY') {
        throw new Error('DUPLICATE_ENTRY');
      }
      throw error;
    }
  }

  /**
   * Get mood entry by ID
   */
  async getMoodEntry(id: string): Promise<MoodEntry> {
    const cacheKey = `mood-entry-${id}`;
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const response = await this.httpClient.get<any>(`/api/v1/mood-entries/${id}`);
    
    // Transform API response to UI format
    const entryDate = response.data.entry_date || response.data.date || new Date().toISOString().split('T')[0];
    const dateOnly = entryDate.split('T')[0];
    
    const transformedData = {
      id: response.data.id.toString(),
      userId: response.data.user_id,
      rating: response.data.rating,
      notes: response.data.notes,
      date: dateOnly,
      entryDate: dateOnly,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      status: response.data.status,
      tags: response.data.tags || [],
      metadata: response.data.metadata || {}
    };
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
    }
    
    return transformedData;
  }

  /**
   * Get mood entries with filtering
   */
  async getMoodEntries(params: GetMoodEntriesParams = {}): Promise<MoodEntry[]> {
    const cacheKey = `mood-entries-${JSON.stringify(params)}`;
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const queryParams: Record<string, string> = {};
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.offset) queryParams.offset = params.offset.toString();
    if (params.tags) queryParams.tags = params.tags.join(',');

    // API returns { data: ApiMoodEntry[], pagination: {...} }
    const response = await this.httpClient.get<{ data: any[], pagination: any }>('/api/v1/mood-entries', queryParams);
    
    // Transform API response to UI format
    const transformedData = response.data.data.map(entry => {
      // Handle date conversion safely
      const entryDate = entry.entry_date || entry.date || new Date().toISOString().split('T')[0];
      const dateOnly = entryDate.split('T')[0];
      
      return {
        id: entry.id.toString(),
        userId: entry.user_id,
        rating: entry.rating,
        notes: entry.notes,
        date: dateOnly, // Convert to date only
        entryDate: dateOnly, // Also provide entryDate for compatibility
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
        status: entry.status,
        tags: entry.tags || [],
        metadata: entry.metadata || {}
      };
    });
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
    }

    return transformedData;
  }

  /**
   * Update mood entry
   */
  async updateMoodEntry(id: string, request: UpdateMoodEntryRequest): Promise<MoodEntry> {
    const response = await this.httpClient.put<any>(`/api/v1/mood-entries/${id}`, request);
    
    // Transform API response to UI format
    const entryDate = response.data.entry_date || response.data.date || new Date().toISOString().split('T')[0];
    const dateOnly = entryDate.split('T')[0];
    
    const transformedData = {
      id: response.data.id.toString(),
      userId: response.data.user_id,
      rating: response.data.rating,
      notes: response.data.notes,
      date: dateOnly,
      entryDate: dateOnly,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      status: response.data.status,
      tags: response.data.tags || [],
      metadata: response.data.metadata || {}
    };
    
    this.invalidateCache('mood-entries');
    this.invalidateCache(`mood-entry-${id}`);
    return transformedData;
  }

  /**
   * Delete mood entry
   */
  async deleteMoodEntry(id: string): Promise<void> {
    await this.httpClient.delete(`/api/v1/mood-entries/${id}`);
    this.invalidateCache('mood-entries');
    this.cache.delete(`mood-entry-${id}`);
  }

  /**
   * Get mood trends
   */
  async getMoodTrends(params: GetTrendsParams): Promise<MoodTrend[]> {
    const cacheKey = `mood-trends-${JSON.stringify(params)}`;
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const queryParams: Record<string, string> = {
      period: params.period
    };
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await this.httpClient.get<MoodTrend[]>('/api/v1/mood-trends', queryParams);
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response.data;
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<User> {
    const cacheKey = 'user-profile'; // Cache key for user profile data
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const response = await this.httpClient.get<User>('/api/v1/user/profile');
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response.data;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(user: Partial<User>): Promise<User> {
    const response = await this.httpClient.put<User>('/api/v1/user/profile', user);
    this.cache.delete('user-profile');
    return response.data;
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<User> {
    const cacheKey = 'user-settings';
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const response = await this.httpClient.get<User>('/api/v1/user/settings');
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response.data;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: Partial<User>): Promise<User> {
    const response = await this.httpClient.put<User>('/api/v1/user/settings', settings);
    this.cache.delete('user-settings');
    return response.data;
  }

  /**
   * Sync data with cloud
   */
  async syncData(): Promise<SyncResult> {
    const response = await this.httpClient.post<SyncResult>('/api/v1/sync');
    this.invalidateCache('mood-entries');
    this.invalidateCache('mood-trends');
    return response.data;
  }

  /**
   * Get API statistics
   */
  async getStats(): Promise<ApiStats> {
    const cacheKey = 'api-stats';
    
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const response = await this.httpClient.get<ApiStats>('/api/v1/stats');
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response.data;
  }

  /**
   * Export user data
   */
  async exportData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await this.httpClient.get(`/api/v1/export?format=${format}`, undefined, {
      'Accept': format === 'json' ? 'application/json' : 'text/csv',
    });
    
    return new Blob([JSON.stringify(response.data)], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
  }

  /**
   * Import user data
   */
  async importData(file: File): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.httpClient.post('/api/v1/import', formData, {
      'Content-Type': 'multipart/form-data',
    });

    return response.data;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(key: string): boolean {
    if (!this.config.enableCaching) return false;
    
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    return Date.now() - entry.timestamp < this.config.cacheTimeout!;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  private invalidateCache(pattern: string): void {
    if (!this.config.enableCaching) return;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
