/**
 * Data Transformation Integration Tests
 * 
 * Tests data transformation between API and UI formats.
 * 
 * @fileoverview Data transformation integration tests
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { DataTransformService } from '@/lib/mood-api';
import { MoodEntry, User, MoodTrend, MoodEntryStatus, TimePeriod } from '@/lib/mood-core/models';

describe('Data Transformation Integration Tests', () => {
  describe('MoodEntry Transformation', () => {
    it('should transform API mood entry to UI format', () => {
      const apiEntry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 8,
        notes: 'Great day!',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
        tags: ['work', 'happy'],
        metadata: { source: 'mobile' },
      };

      const uiEntry = DataTransformService.transformMoodEntry(apiEntry);

      expect(uiEntry).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 8,
        notes: 'Great day!',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
        tags: ['work', 'happy'],
        metadata: { source: 'mobile' },
      });
    });

    it('should transform UI mood entry to API format', () => {
      const uiEntry: MoodEntry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 8,
        notes: 'Great day!',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
        tags: ['work', 'happy'],
        metadata: { source: 'mobile' },
      };

      const apiEntry = DataTransformService.transformMoodEntryToApi(uiEntry);

      expect(apiEntry).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 8,
        notes: 'Great day!',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
        tags: ['work', 'happy'],
        metadata: { source: 'mobile' },
      });
    });

    it('should handle optional fields correctly', () => {
      const apiEntry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 5,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      const uiEntry = DataTransformService.transformMoodEntry(apiEntry);

      expect(uiEntry.notes).toBeUndefined();
      expect(uiEntry.tags).toBeUndefined();
      expect(uiEntry.metadata).toBeUndefined();
    });
  });

  describe('User Transformation', () => {
    it('should transform API user to UI format', () => {
      const apiUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        preferences: {
          theme: 'dark' as const,
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: true,
          notificationTime: '09:00',
          dataRetentionDays: 365,
          exportFormat: 'json' as const,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const uiUser = DataTransformService.transformUser(apiUser);

      expect(uiUser).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: true,
          notificationTime: '09:00',
          dataRetentionDays: 365,
          exportFormat: 'json',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should transform UI user to API format', () => {
      const uiUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Month,
          enableNotifications: true,
          dataRetentionDays: 365,
          exportFormat: 'csv',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const apiUser = DataTransformService.transformUserToApi(uiUser);

      expect(apiUser).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Month,
          enableNotifications: true,
          dataRetentionDays: 365,
          exportFormat: 'csv',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('MoodTrend Transformation', () => {
    it('should transform API mood trend to UI format', () => {
      const apiTrend = {
        id: 'trend-123',
        userId: 'user-123',
        period: TimePeriod.Week,
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        statistics: {
          averageMood: 7.5,
          lowestMood: 5,
          highestMood: 9,
          moodVariance: 2.5,
          totalEntries: 7,
          completionRate: 1.0,
          trendDirection: 'improving' as const,
          moodDistribution: { '5': 1, '6': 1, '7': 2, '8': 2, '9': 1 },
        },
        dataPoints: [
          { date: '2024-01-08', value: 7, entryId: 'entry-1' },
          { date: '2024-01-09', value: 8, entryId: 'entry-2' },
          { date: '2024-01-10', value: 6, entryId: 'entry-3' },
        ],
        insights: ['Your mood is improving this week!'],
        createdAt: '2024-01-15T10:00:00Z',
      };

      const uiTrend = DataTransformService.transformMoodTrend(apiTrend);

      expect(uiTrend).toEqual({
        id: 'trend-123',
        userId: 'user-123',
        period: TimePeriod.Week,
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        statistics: {
          averageMood: 7.5,
          lowestMood: 5,
          highestMood: 9,
          moodVariance: 2.5,
          totalEntries: 7,
          completionRate: 1.0,
          trendDirection: 'improving',
          moodDistribution: { '5': 1, '6': 1, '7': 2, '8': 2, '9': 1 },
        },
        dataPoints: [
          { date: '2024-01-08', value: 7, entryId: 'entry-1' },
          { date: '2024-01-09', value: 8, entryId: 'entry-2' },
          { date: '2024-01-10', value: 6, entryId: 'entry-3' },
        ],
        insights: ['Your mood is improving this week!'],
        createdAt: '2024-01-15T10:00:00Z',
      });
    });
  });

  describe('Batch Transformation', () => {
    it('should transform multiple API mood entries', () => {
      const apiEntries = [
        {
          id: '1',
          userId: 'user-123',
          rating: 8,
          date: '2024-01-15',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: '2',
          userId: 'user-123',
          rating: 6,
          date: '2024-01-16',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      const uiEntries = DataTransformService.transformMoodEntries(apiEntries);

      expect(uiEntries).toHaveLength(2);
      expect(uiEntries[0].id).toBe('1');
      expect(uiEntries[1].id).toBe('2');
    });

    it('should transform multiple API mood trends', () => {
      const apiTrends = [
        {
          id: 'trend-1',
          userId: 'user-123',
          period: TimePeriod.Week,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          statistics: {
            averageMood: 7.5,
            lowestMood: 5,
            highestMood: 9,
            moodVariance: 2.5,
            totalEntries: 7,
            completionRate: 1.0,
            trendDirection: 'improving' as const,
            moodDistribution: {},
          },
          dataPoints: [],
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'trend-2',
          userId: 'user-123',
          period: TimePeriod.Month,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          statistics: {
            averageMood: 7.0,
            lowestMood: 4,
            highestMood: 10,
            moodVariance: 3.0,
            totalEntries: 30,
            completionRate: 0.97,
            trendDirection: 'stable' as const,
            moodDistribution: {},
          },
          dataPoints: [],
          createdAt: '2024-02-01T10:00:00Z',
        },
      ];

      const uiTrends = DataTransformService.transformMoodTrends(apiTrends);

      expect(uiTrends).toHaveLength(2);
      expect(uiTrends[0].period).toBe(TimePeriod.Week);
      expect(uiTrends[1].period).toBe(TimePeriod.Month);
    });
  });

  describe('Data Validation', () => {
    it('should validate API mood entry format', () => {
      const validEntry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-123',
        rating: 8,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      const invalidEntry = {
        id: 'invalid',
        rating: 'not-a-number',
        date: 'invalid-date',
      };

      expect(DataTransformService.validateApiMoodEntry(validEntry)).toBe(true);
      expect(DataTransformService.validateApiMoodEntry(invalidEntry)).toBe(false);
    });

    it('should validate API user format', () => {
      const validUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          weekStartsOn: 1,
          defaultChartPeriod: TimePeriod.Week,
          enableNotifications: true,
          dataRetentionDays: 365,
          exportFormat: 'json',
        },
      };

      const invalidUser = {
        id: 'user-123',
        // Missing email and preferences
      };

      expect(DataTransformService.validateApiUser(validUser)).toBe(true);
      expect(DataTransformService.validateApiUser(invalidUser)).toBe(false);
    });

    it('should validate API mood trend format', () => {
      const validTrend = {
        id: 'trend-123',
        userId: 'user-123',
        period: TimePeriod.Week,
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        statistics: {
          averageMood: 7.5,
          lowestMood: 5,
          highestMood: 9,
          moodVariance: 2.5,
          totalEntries: 7,
          completionRate: 1.0,
          trendDirection: 'improving',
          moodDistribution: {},
        },
        dataPoints: [],
        createdAt: '2024-01-15T10:00:00Z',
      };

      const invalidTrend = {
        id: 'trend-123',
        // Missing required fields
      };

      expect(DataTransformService.validateApiMoodTrend(validTrend)).toBe(true);
      expect(DataTransformService.validateApiMoodTrend(invalidTrend)).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize data for API transmission', () => {
      const data = {
        rating: 8,
        notes: '  Great day!  ',
        tags: ['work', 'happy'],
        metadata: {
          source: 'mobile',
          undefinedField: undefined,
        },
      };

      const sanitized = DataTransformService.sanitizeForApi(data);

      expect(sanitized.notes).toBe('Great day!');
      expect(sanitized.metadata.undefinedField).toBeUndefined();
      expect(sanitized.rating).toBe(8);
    });

    it('should normalize data from API', () => {
      const data = {
        id: '123',
        rating: 8,
        notes: 'Great day!',
        // Missing optional fields
      };

      const normalized = DataTransformService.normalizeFromApi(data);

      expect(normalized.status).toBe('active');
      expect(normalized.tags).toEqual([]);
      expect(normalized.metadata).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle null and undefined values', () => {
      expect(DataTransformService.sanitizeForApi(null)).toBe(null);
      expect(DataTransformService.sanitizeForApi(undefined)).toBe(undefined);
      expect(DataTransformService.normalizeFromApi(null)).toBe(null);
      expect(DataTransformService.normalizeFromApi(undefined)).toBe(undefined);
    });

    it('should handle empty objects', () => {
      const empty = {};
      const sanitized = DataTransformService.sanitizeForApi(empty);
      const normalized = DataTransformService.normalizeFromApi(empty);

      expect(sanitized).toEqual({});
      expect(normalized).toEqual({
        status: 'active',
        tags: [],
        metadata: {},
      });
    });
  });
});
