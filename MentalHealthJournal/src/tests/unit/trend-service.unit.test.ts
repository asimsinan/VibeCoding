/**
 * Unit tests for TrendService
 * Tests mood trend calculation and statistics following TDD principles
 * Traces to FR-004
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { TrendService } from '../../lib/mood-core/services/TrendService';
import { MoodEntry, MoodEntryStatus, TimePeriod, MoodTrend } from '../../lib/mood-core/models';
import { LocalStorageService } from '../../lib/mood-storage/services/LocalStorageService';

// Mock the storage service
jest.mock('../../lib/mood-storage/services/LocalStorageService');

describe('TrendService', () => {
  let trendService: TrendService;
  let mockStorageService: jest.Mocked<LocalStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService = new LocalStorageService() as jest.Mocked<LocalStorageService>;
    trendService = new TrendService(mockStorageService);
  });

  describe('calculateTrend', () => {
    test('should calculate trend for week period', async () => {
      const userId = 'user-123';
      const endDate = new Date('2025-01-28');
      const startDate = new Date('2025-01-22');

      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 7,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 8,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 6,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.period).toBe(TimePeriod.Week);
      expect(result.statistics.averageMood).toBe(7); // (7 + 8 + 6) / 3
      expect(result.statistics.lowestMood).toBe(6);
      expect(result.statistics.highestMood).toBe(8);
      expect(result.statistics.totalEntries).toBe(3);
      expect(result.statistics.completionRate).toBeCloseTo(0.43, 2); // 3/7 days
      expect(result.dataPoints).toHaveLength(3);
    });

    test('should calculate trend for month period', async () => {
      const userId = 'user-123';
      const entries: MoodEntry[] = Array.from({ length: 15 }, (_, i) => ({
        id: `entry-${i}`,
        userId,
        rating: 5 + (i % 3), // Creates ratings: 5, 6, 7, 5, 6, 7...
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        updatedAt: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        status: MoodEntryStatus.Active,
      }));

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(entries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Month);

      expect(result.period).toBe(TimePeriod.Month);
      expect(result.statistics.totalEntries).toBe(15);
      expect(result.statistics.averageMood).toBe(6); // Average of 5, 6, 7 pattern
      expect(result.statistics.completionRate).toBeCloseTo(0.5, 1); // 15/30 days
    });

    test('should determine trend direction as improving', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 4,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 6,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 8,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.trendDirection).toBe('improving');
    });

    test('should determine trend direction as declining', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 8,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 6,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 4,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.trendDirection).toBe('declining');
    });

    test('should determine trend direction as stable', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 6,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 6,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 6,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.trendDirection).toBe('stable');
    });

    test('should calculate mood distribution', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 5,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 5,
          date: '2025-01-23',
          createdAt: '2025-01-23T10:00:00Z',
          updatedAt: '2025-01-23T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 7,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.moodDistribution['5']).toBe(2);
      expect(result.statistics.moodDistribution['7']).toBe(1);
      expect(result.statistics.moodDistribution['1']).toBe(0);
    });

    test('should handle no mood entries', async () => {
      const userId = 'user-123';
      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.averageMood).toBe(0);
      expect(result.statistics.totalEntries).toBe(0);
      expect(result.statistics.completionRate).toBe(0);
      expect(result.statistics.trendDirection).toBe('stable');
      expect(result.dataPoints).toEqual([]);
    });

    test('should filter out deleted entries', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 7,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 9,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Deleted, // Should be filtered out
        },
        {
          id: 'entry-3',
          userId,
          rating: 6,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.totalEntries).toBe(2); // Only active entries
      expect(result.statistics.averageMood).toBe(6.5); // (7 + 6) / 2
      expect(result.dataPoints).toHaveLength(2);
    });

    test('should calculate variance correctly', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 4,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 8,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      // Variance = sum((x - mean)^2) / n
      // Mean = 6, values = [4, 8]
      // Variance = ((4-6)^2 + (8-6)^2) / 2 = (4 + 4) / 2 = 4
      expect(result.statistics.moodVariance).toBe(4);
    });
  });

  describe('generateInsights', () => {
    test('should generate insights for improving trend', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 4,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 6,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId,
          rating: 8,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.insights).toBeDefined();
      expect(result.insights!.length).toBeGreaterThan(0);
      expect(result.insights![0]).toContain('improving');
    });

    test('should generate insights for low completion rate', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 7,
          date: '2025-01-01',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Month);

      expect(result.insights).toBeDefined();
      const completionInsight = result.insights!.find(i => i.includes('completion rate'));
      expect(completionInsight).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle single mood entry', async () => {
      const userId = 'user-123';
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 7,
          date: '2025-01-28',
          createdAt: '2025-01-28T10:00:00Z',
          updatedAt: '2025-01-28T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await trendService.calculateTrend(userId, TimePeriod.Week);

      expect(result.statistics.averageMood).toBe(7);
      expect(result.statistics.moodVariance).toBe(0);
      expect(result.statistics.trendDirection).toBe('stable');
    });

    test('should handle year period correctly', async () => {
      const userId = 'user-123';
      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);

      const result = await trendService.calculateTrend(userId, TimePeriod.Year);

      expect(result.period).toBe(TimePeriod.Year);
      expect(result.dataPoints).toEqual([]);
    });
  });
});
