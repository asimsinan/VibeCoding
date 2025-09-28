/**
 * Data Transformation Service
 * 
 * Handles data transformation between API and UI formats.
 * 
 * @fileoverview Data transformation utilities
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { MoodEntry, User, MoodTrend, TimePeriod, MoodEntryStatus } from '../../mood-core/models';

export interface ApiMoodEntry {
  id: string;
  userId: string;
  rating: number;
  notes?: string;
  date: string;
  entryDate?: string; // Also provide entryDate for compatibility
  createdAt: string;
  updatedAt: string;
  status: MoodEntryStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    weekStartsOn: number;
    defaultChartPeriod: TimePeriod;
    enableNotifications: boolean;
    notificationTime?: string;
    dataRetentionDays: number;
    exportFormat: 'json' | 'csv' | 'pdf';
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiMoodTrend {
  id: string;
  userId: string;
  period: TimePeriod;
  startDate: string;
  endDate: string;
  statistics: {
    averageMood: number;
    lowestMood: number;
    highestMood: number;
    moodVariance: number;
    totalEntries: number;
    completionRate: number;
    trendDirection: 'improving' | 'declining' | 'stable';
    moodDistribution: Record<string, number>;
  };
  dataPoints: Array<{
    date: string;
    value: number;
    entryId: string;
  }>;
  insights?: string[];
  createdAt: string;
}

export class DataTransformService {
  /**
   * Transform API mood entry to UI format
   */
  static transformMoodEntry(apiEntry: ApiMoodEntry): MoodEntry {
    return {
      id: apiEntry.id,
      userId: apiEntry.userId,
      rating: apiEntry.rating,
      notes: apiEntry.notes,
      date: apiEntry.date,
      entryDate: apiEntry.entryDate || apiEntry.date, // Use entryDate if available, fallback to date
      createdAt: apiEntry.createdAt,
      updatedAt: apiEntry.updatedAt,
      status: apiEntry.status as any,
      tags: apiEntry.tags,
      metadata: apiEntry.metadata,
    };
  }

  /**
   * Transform UI mood entry to API format
   */
  static transformMoodEntryToApi(uiEntry: MoodEntry): ApiMoodEntry {
    return {
      id: uiEntry.id,
      userId: uiEntry.userId,
      rating: uiEntry.rating,
      notes: uiEntry.notes,
      date: uiEntry.date,
      createdAt: uiEntry.createdAt,
      updatedAt: uiEntry.updatedAt,
      status: uiEntry.status,
      tags: uiEntry.tags,
      metadata: uiEntry.metadata,
    };
  }

  /**
   * Transform API user to UI format
   */
  static transformUser(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      username: apiUser.username,
      preferences: apiUser.preferences,
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt,
    };
  }

  /**
   * Transform UI user to API format
   */
  static transformUserToApi(uiUser: User): ApiUser {
    return {
      id: uiUser.id,
      email: uiUser.email,
      username: uiUser.username,
      preferences: uiUser.preferences,
      createdAt: uiUser.createdAt,
      updatedAt: uiUser.updatedAt,
    };
  }

  /**
   * Transform API mood trend to UI format
   */
  static transformMoodTrend(apiTrend: ApiMoodTrend): MoodTrend {
    return {
      id: apiTrend.id,
      userId: apiTrend.userId,
      period: apiTrend.period as any,
      startDate: apiTrend.startDate,
      endDate: apiTrend.endDate,
      statistics: apiTrend.statistics,
      dataPoints: apiTrend.dataPoints,
      insights: apiTrend.insights,
      createdAt: apiTrend.createdAt,
    };
  }

  /**
   * Transform multiple API mood entries to UI format
   */
  static transformMoodEntries(apiEntries: ApiMoodEntry[]): MoodEntry[] {
    return apiEntries.map(entry => this.transformMoodEntry(entry));
  }

  /**
   * Transform multiple API mood trends to UI format
   */
  static transformMoodTrends(apiTrends: ApiMoodTrend[]): MoodTrend[] {
    return apiTrends.map(trend => this.transformMoodTrend(trend));
  }

  /**
   * Validate API response format - Input validation for mood entries
   */
  static validateApiMoodEntry(data: any): data is ApiMoodEntry {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.rating === 'number' &&
      typeof data.date === 'string' &&
      typeof data.createdAt === 'string' &&
      typeof data.updatedAt === 'string' &&
      typeof data.status === 'string'
    );
  }

  /**
   * Validate API user format
   */
  static validateApiUser(data: any): data is ApiUser {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.email === 'string' &&
      typeof data.preferences === 'object' &&
      data.preferences !== null
    );
  }

  /**
   * Validate API mood trend format
   */
  static validateApiMoodTrend(data: any): data is ApiMoodTrend {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.period === 'string' &&
      typeof data.startDate === 'string' &&
      typeof data.endDate === 'string' &&
      typeof data.statistics === 'object' &&
      data.statistics !== null &&
      typeof data.statistics.averageMood === 'number' &&
      Array.isArray(data.dataPoints) &&
      typeof data.createdAt === 'string'
    );
  }

  /**
   * Sanitize data for API transmission
   */
  static sanitizeForApi(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };

    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Sanitize strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    return sanitized;
  }

  /**
   * Normalize data from API
   */
  static normalizeFromApi(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const normalized = { ...data };

    // Ensure required fields have default values
    if (normalized.status === undefined) {
      normalized.status = 'active';
    }

    if (normalized.tags === undefined) {
      normalized.tags = [];
    }

    if (normalized.metadata === undefined) {
      normalized.metadata = {};
    }

    return normalized;
  }
}
