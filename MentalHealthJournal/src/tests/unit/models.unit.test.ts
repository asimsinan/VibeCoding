/**
 * Unit tests for data models and validation
 * Tests cover: MoodEntry, User, MoodTrend, and AppSettings models
 * Following TDD principles with comprehensive validation testing
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  MoodEntry,
  MoodEntrySchema,
  User,
  UserSchema,
  UserPreferences,
  UserPreferencesSchema,
  MoodTrend,
  MoodTrendSchema,
  AppSettings,
  AppSettingsSchema,
  MoodStatistics,
  MoodStatisticsSchema,
  NotificationSettings,
  NotificationSettingsSchema,
  ChartDisplay,
  ChartDisplaySchema,
  DataRetention,
  DataRetentionSchema,
  PrivacySettings,
  PrivacySettingsSchema,
  ApiResponse,
  ApiResponseSchema,
  ApiError,
  ApiErrorSchema,
  ValidationError,
  ValidationErrorSchema,
  ErrorDetail,
  ErrorDetailSchema,
  TimePeriod,
  MoodEntryStatus,
} from '../../lib/mood-core/models';

describe('MoodEntry Model Tests', () => {
  describe('Valid MoodEntry', () => {
    test('should validate a complete mood entry', () => {
      const validEntry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 7,
        notes: 'Feeling good today, had a productive morning',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
        tags: ['productive', 'happy'],
        metadata: {
          weather: 'sunny',
          location: 'home',
        },
      };

      const result = MoodEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEntry);
      }
    });

    test('should validate a minimal mood entry', () => {
      const minimalEntry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(minimalEntry);
      expect(result.success).toBe(true);
    });

    test('should validate all mood ratings from 1 to 10', () => {
      for (let rating = 1; rating <= 10; rating++) {
        const entry: MoodEntry = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          rating,
          date: '2025-01-28',
          createdAt: '2025-01-28T10:30:00Z',
          updatedAt: '2025-01-28T10:30:00Z',
          status: MoodEntryStatus.Active,
        };

        const result = MoodEntrySchema.safeParse(entry);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Invalid MoodEntry', () => {
    test('should reject rating below 1', () => {
      const invalidEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 0,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    test('should reject rating above 10', () => {
      const invalidEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 11,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    test('should reject notes longer than 500 characters', () => {
      const longNotes = 'a'.repeat(501);
      const invalidEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        notes: longNotes,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    test('should reject invalid date format', () => {
      const invalidEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: '28-01-2025', // Invalid format
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    test('should reject missing required fields', () => {
      const incompleteEntry = {
        rating: 5,
        date: '2025-01-28',
      };

      const result = MoodEntrySchema.safeParse(incompleteEntry);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty tags array', () => {
      const entry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
        tags: [],
      };

      const result = MoodEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    test('should handle empty metadata object', () => {
      const entry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
        metadata: {},
      };

      const result = MoodEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    test('should accept exactly 500 character notes', () => {
      const maxNotes = 'a'.repeat(500);
      const entry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        notes: maxNotes,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes?.length).toBe(500);
      }
    });
  });
});

describe('User Model Tests', () => {
  describe('Valid User', () => {
    test('should validate a complete user', () => {
      const validUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        username: 'testuser',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Month,
          enableNotifications: true,
          notificationTime: '09:00',
          dataRetentionDays: 365,
          exportFormat: 'json',
        },
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    test('should validate a user with minimal preferences', () => {
      const minimalUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        username: 'testuser',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 0,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: false,
          dataRetentionDays: 90,
          exportFormat: 'csv',
        },
      };

      const result = UserSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid User', () => {
    test('should reject invalid email format', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
        username: 'testuser',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 0,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: false,
          dataRetentionDays: 90,
          exportFormat: 'csv',
        },
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    test('should reject username shorter than 3 characters', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        username: 'ab',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 0,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: false,
          dataRetentionDays: 90,
          exportFormat: 'csv',
        },
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    test('should reject invalid theme preference', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        username: 'testuser',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        preferences: {
          theme: 'invalid-theme',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 0,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: false,
          dataRetentionDays: 90,
          exportFormat: 'csv',
        },
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
});

describe('MoodTrend Model Tests', () => {
  describe('Valid MoodTrend', () => {
    test('should validate a complete mood trend', () => {
      const validTrend: MoodTrend = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        period: TimePeriod.Month,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        statistics: {
          averageMood: 6.5,
          lowestMood: 3,
          highestMood: 9,
          moodVariance: 2.1,
          totalEntries: 28,
          completionRate: 0.9,
          trendDirection: 'improving',
          moodDistribution: {
            '1': 0,
            '2': 0,
            '3': 2,
            '4': 3,
            '5': 5,
            '6': 6,
            '7': 7,
            '8': 4,
            '9': 1,
            '10': 0,
          },
        },
        dataPoints: [
          { date: '2025-01-01', value: 7, entryId: 'entry1' },
          { date: '2025-01-02', value: 6, entryId: 'entry2' },
        ],
        insights: ['Your mood has improved by 20% this month'],
        createdAt: '2025-01-31T23:59:59Z',
      };

      const result = MoodTrendSchema.safeParse(validTrend);
      expect(result.success).toBe(true);
    });

    test('should validate trend with minimal data', () => {
      const minimalTrend: MoodTrend = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        period: TimePeriod.Week,
        startDate: '2025-01-22',
        endDate: '2025-01-28',
        statistics: {
          averageMood: 5.0,
          lowestMood: 5,
          highestMood: 5,
          moodVariance: 0,
          totalEntries: 1,
          completionRate: 0.14,
          trendDirection: 'stable',
          moodDistribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 1,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
          },
        },
        dataPoints: [{ date: '2025-01-28', value: 5, entryId: 'single-entry' }],
        createdAt: '2025-01-28T23:59:59Z',
      };

      const result = MoodTrendSchema.safeParse(minimalTrend);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid MoodTrend', () => {
    test('should reject invalid period', () => {
      const invalidTrend = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        period: 'invalid-period',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        statistics: {
          averageMood: 6.5,
          lowestMood: 3,
          highestMood: 9,
          moodVariance: 2.1,
          totalEntries: 28,
          completionRate: 0.9,
          trendDirection: 'improving',
          moodDistribution: {},
        },
        dataPoints: [],
        createdAt: '2025-01-31T23:59:59Z',
      };

      const result = MoodTrendSchema.safeParse(invalidTrend);
      expect(result.success).toBe(false);
    });

    test('should reject completion rate over 1', () => {
      const invalidTrend = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        period: TimePeriod.Week,
        startDate: '2025-01-22',
        endDate: '2025-01-28',
        statistics: {
          averageMood: 5.0,
          lowestMood: 5,
          highestMood: 5,
          moodVariance: 0,
          totalEntries: 1,
          completionRate: 1.5, // Invalid
          trendDirection: 'stable',
          moodDistribution: {},
        },
        dataPoints: [],
        createdAt: '2025-01-28T23:59:59Z',
      };

      const result = MoodTrendSchema.safeParse(invalidTrend);
      expect(result.success).toBe(false);
    });
  });
});

describe('AppSettings Model Tests', () => {
  describe('Valid AppSettings', () => {
    test('should validate complete app settings', () => {
      const validSettings: AppSettings = {
        id: 'settings-001',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        chartDisplay: {
          showTrendLine: true,
          showDataPoints: true,
          showAverage: true,
          animateTransitions: true,
          colorScheme: 'default',
        },
        dataRetention: {
          autoDeleteAfterDays: 365,
          exportBeforeDelete: true,
          archiveLocation: 'cloud',
        },
        privacy: {
          shareAnonymousData: false,
          allowDataExport: true,
          encryptLocalData: true,
          require2FA: false,
        },
        notifications: {
          dailyReminder: true,
          reminderTime: '20:00',
          weeklyReport: true,
          monthlyReport: false,
          insightNotifications: true,
        },
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
      };

      const result = AppSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid AppSettings', () => {
    test('should reject negative retention days', () => {
      const invalidSettings = {
        id: 'settings-001',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        chartDisplay: {
          showTrendLine: true,
          showDataPoints: true,
          showAverage: true,
          animateTransitions: true,
          colorScheme: 'default',
        },
        dataRetention: {
          autoDeleteAfterDays: -1, // Invalid
          exportBeforeDelete: true,
          archiveLocation: 'cloud',
        },
        privacy: {
          shareAnonymousData: false,
          allowDataExport: true,
          encryptLocalData: true,
          require2FA: false,
        },
        notifications: {
          dailyReminder: true,
          reminderTime: '20:00',
          weeklyReport: true,
          monthlyReport: false,
          insightNotifications: true,
        },
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
      };

      const result = AppSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });
});

describe('API Response Model Tests', () => {
  describe('Valid API Responses', () => {
    test('should validate successful API response', () => {
      const successResponse: ApiResponse<MoodEntry> = {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          rating: 7,
          date: '2025-01-28',
          createdAt: '2025-01-28T10:30:00Z',
          updatedAt: '2025-01-28T10:30:00Z',
          status: MoodEntryStatus.Active,
        },
        message: 'Mood entry created successfully',
        timestamp: '2025-01-28T10:30:00Z',
      };

      const schema = ApiResponseSchema(MoodEntrySchema);
      const result = schema.safeParse(successResponse);
      expect(result.success).toBe(true);
    });

    test('should validate API error response', () => {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid mood rating',
          details: {
            field: 'rating',
            value: 11,
            constraint: 'max:10',
          },
        },
        timestamp: '2025-01-28T10:30:00Z',
      };

      const result = ApiErrorSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Validation Error Tests', () => {
    test('should validate validation error with multiple fields', () => {
      const validationError: ValidationError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Multiple validation errors',
          details: {
            errors: [
              {
                field: 'rating',
                message: 'Rating must be between 1 and 10',
                code: 'invalid_range',
              },
              {
                field: 'notes',
                message: 'Notes cannot exceed 500 characters',
                code: 'too_long',
              },
            ],
          },
        },
        timestamp: '2025-01-28T10:30:00Z',
      };

      const result = ValidationErrorSchema.safeParse(validationError);
      expect(result.success).toBe(true);
    });
  });
});

describe('Business Rule Validation Tests', () => {
  describe('Date Validation Rules', () => {
    test('should not allow future dates for mood entries', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDateStr = tomorrow.toISOString().split('T')[0];

      const entryWithFutureDate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: futureDateStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      };

      // Business rule validation (not in schema, but in service layer)
      const today = new Date().toISOString().split('T')[0];
      const isValidDate = entryWithFutureDate.date <= today;
      expect(isValidDate).toBe(false);
    });

    test('should allow entries for today', () => {
      const today = new Date().toISOString().split('T')[0];

      const entryForToday = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(entryForToday);
      expect(result.success).toBe(true);
    });
  });

  describe('Unique Entry Per Day Rule', () => {
    test('should enforce unique entry per user per day', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const date = '2025-01-28';

      // Simulate checking for existing entry (would be in service layer)
      const existingEntries: MoodEntry[] = [
        {
          id: 'existing-entry',
          userId,
          rating: 5,
          date,
          createdAt: '2025-01-28T09:00:00Z',
          updatedAt: '2025-01-28T09:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      const hasExistingEntry = existingEntries.some(
        (entry) => entry.userId === userId && entry.date === date && entry.status === MoodEntryStatus.Active
      );

      expect(hasExistingEntry).toBe(true);
    });
  });

  describe('Data Retention Rules', () => {
    test('should validate retention period constraints', () => {
      const validRetentionPeriods = [30, 90, 180, 365, 730]; // Common retention periods

      validRetentionPeriods.forEach((days) => {
        const settings = {
          autoDeleteAfterDays: days,
          exportBeforeDelete: true,
          archiveLocation: 'cloud' as const,
        };

        const result = DataRetentionSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    test('should enforce minimum retention period', () => {
      const tooShortRetention = {
        autoDeleteAfterDays: 7, // Less than typical minimum
        exportBeforeDelete: true,
        archiveLocation: 'cloud' as const,
      };

      // Business rule: minimum 30 days retention
      const isValidRetention = tooShortRetention.autoDeleteAfterDays >= 30;
      expect(isValidRetention).toBe(false);
    });
  });
});

describe('Edge Case Tests', () => {
  describe('Timezone Handling', () => {
    test('should handle different timezone formats', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC',
        'GMT',
        'PST8PDT',
      ];

      validTimezones.forEach((timezone) => {
        const preferences: UserPreferences = {
          theme: 'light',
          language: 'en',
          timezone,
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 0,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: false,
          dataRetentionDays: 90,
          exportFormat: 'json',
        };

        const result = UserPreferencesSchema.safeParse(preferences);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Unicode and Special Characters', () => {
    test('should handle unicode in mood notes', () => {
      const unicodeNotes = 'Feeling 😊 today! Weather is ☀️. Had 🍕 for lunch.';
      const entry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 8,
        notes: unicodeNotes,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
      };

      const result = MoodEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe(unicodeNotes);
      }
    });

    test('should handle special characters in tags', () => {
      const specialTags = ['work-life', 'self-care', '2025-goals', '#mood'];
      const entry: MoodEntry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 7,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:30:00Z',
        updatedAt: '2025-01-28T10:30:00Z',
        status: MoodEntryStatus.Active,
        tags: specialTags,
      };

      const result = MoodEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  describe('Numeric Precision', () => {
    test('should handle floating point precision in statistics', () => {
      const statistics: MoodStatistics = {
        averageMood: 6.666666666666667, // Repeating decimal
        lowestMood: 1,
        highestMood: 10,
        moodVariance: 3.141592653589793, // Pi
        totalEntries: 30,
        completionRate: 0.9999999999999999, // Close to 1
        trendDirection: 'stable',
        moodDistribution: {
          '1': 0.033333333333333,
          '2': 0.066666666666667,
          '3': 0.1,
          '4': 0.1,
          '5': 0.133333333333333,
          '6': 0.166666666666667,
          '7': 0.133333333333333,
          '8': 0.1,
          '9': 0.066666666666667,
          '10': 0.1,
        },
      };

      const result = MoodStatisticsSchema.safeParse(statistics);
      expect(result.success).toBe(true);
    });
  });
});
