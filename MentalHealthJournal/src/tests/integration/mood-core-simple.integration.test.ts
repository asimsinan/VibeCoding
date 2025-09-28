/**
 * Simple integration tests for @moodtracker/core library
 * Tests core functionality with mocked storage (Integration-First Testing Gate)
 * Note: Full IndexedDB integration tests require browser environment
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { MoodService } from '../../lib/mood-core/services/MoodService';
import { TrendService } from '../../lib/mood-core/services/TrendService';
import { LocalStorageService } from '../../lib/mood-storage/services/LocalStorageService';
import { MoodEntry, MoodEntryStatus, TimePeriod } from '../../lib/mood-core/models';

// Mock the storage service for integration testing
jest.mock('../../lib/mood-storage/services/LocalStorageService');

describe('@moodtracker/core Integration Tests (Mocked Storage)', () => {
  let storageService: jest.Mocked<LocalStorageService>;
  let moodService: MoodService;
  let trendService: TrendService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocked storage service
    storageService = new LocalStorageService() as jest.Mocked<LocalStorageService>;
    
    // Initialize services
    moodService = new MoodService(storageService);
    trendService = new TrendService(storageService);
  });

  describe('MoodService Integration', () => {
    test('should create and retrieve mood entry with real validation', async () => {
      const mockEntry: MoodEntry = {
        id: 'test-id',
        userId: testUserId,
        rating: 7,
        notes: 'Integration test entry',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      // Mock storage responses
      storageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      storageService.saveMoodEntry.mockResolvedValue(mockEntry);
      storageService.getMoodEntry.mockResolvedValue(mockEntry);

      // Create mood entry
      const createdEntry = await moodService.createMoodEntry(
        testUserId,
        7,
        'Integration test entry',
        '2025-01-28'
      );

      expect(createdEntry).toBeDefined();
      expect(createdEntry.rating).toBe(7);
      expect(createdEntry.notes).toBe('Integration test entry');

      // Retrieve the entry
      const retrievedEntry = await moodService.getMoodEntry(createdEntry.id);
      
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.id).toBe(createdEntry.id);
      expect(storageService.saveMoodEntry).toHaveBeenCalled();
      expect(storageService.getMoodEntry).toHaveBeenCalledWith(createdEntry.id);
    });

    test('should update mood entry with real validation', async () => {
      const existingEntry: MoodEntry = {
        id: 'test-id',
        userId: testUserId,
        rating: 5,
        notes: 'Initial mood',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      const updatedEntry: MoodEntry = {
        ...existingEntry,
        rating: 8,
        notes: 'Updated mood - feeling better!',
        updatedAt: '2025-01-28T11:00:00Z',
      };

      // Mock storage responses
      storageService.getMoodEntry.mockResolvedValue(existingEntry);
      storageService.updateMoodEntry.mockResolvedValue(updatedEntry);

      // Update the entry
      const result = await moodService.updateMoodEntry('test-id', {
        rating: 8,
        notes: 'Updated mood - feeling better!',
      });

      expect(result.rating).toBe(8);
      expect(result.notes).toBe('Updated mood - feeling better!');
      expect(storageService.updateMoodEntry).toHaveBeenCalledWith('test-id', expect.objectContaining({
        rating: 8,
        notes: 'Updated mood - feeling better!',
      }));
    });

    test('should handle duplicate entry validation', async () => {
      const existingEntry: MoodEntry = {
        id: 'existing-id',
        userId: testUserId,
        rating: 5,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      // Mock existing entry found
      storageService.getMoodEntriesByDateRange.mockResolvedValue([existingEntry]);

      // Attempt to create duplicate
      await expect(
        moodService.createMoodEntry(testUserId, 7, 'Duplicate entry', '2025-01-28')
      ).rejects.toThrow('A mood entry already exists for this date');
    });

    test('should validate rating range', async () => {
      // Test invalid rating
      await expect(
        moodService.createMoodEntry(testUserId, 15, 'Invalid rating', '2025-01-28')
      ).rejects.toThrow('Rating must be between 1 and 10');

      // Test valid rating
      storageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      storageService.saveMoodEntry.mockResolvedValue({
        id: 'test-id',
        userId: testUserId,
        rating: 10,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      });

      const result = await moodService.createMoodEntry(testUserId, 10, 'Valid rating', '2025-01-28');
      expect(result.rating).toBe(10);
    });
  });

  describe('TrendService Integration', () => {
    test('should calculate trend with real data processing', async () => {
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId: testUserId,
          rating: 5,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId: testUserId,
          rating: 7,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-3',
          userId: testUserId,
          rating: 9,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      // Mock storage response
      storageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(3);
      expect(trend.statistics.averageMood).toBe(7); // (5 + 7 + 9) / 3
      expect(trend.statistics.lowestMood).toBe(5);
      expect(trend.statistics.highestMood).toBe(9);
      expect(trend.statistics.trendDirection).toBe('improving');
      expect(trend.dataPoints).toHaveLength(3);
      expect(trend.insights).toBeDefined();
      expect(trend.insights!.length).toBeGreaterThan(0);
    });

    test('should handle empty data gracefully', async () => {
      // Mock empty response
      storageService.getMoodEntriesByDateRange.mockResolvedValue([]);

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(0);
      expect(trend.statistics.averageMood).toBe(0);
      expect(trend.statistics.trendDirection).toBe('stable');
      expect(trend.dataPoints).toEqual([]);
    });

    test('should filter deleted entries from trends', async () => {
      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId: testUserId,
          rating: 7,
          date: '2025-01-22',
          createdAt: '2025-01-22T10:00:00Z',
          updatedAt: '2025-01-22T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId: testUserId,
          rating: 3,
          date: '2025-01-24',
          createdAt: '2025-01-24T10:00:00Z',
          updatedAt: '2025-01-24T10:00:00Z',
          status: MoodEntryStatus.Deleted, // Should be filtered out
        },
        {
          id: 'entry-3',
          userId: testUserId,
          rating: 9,
          date: '2025-01-26',
          createdAt: '2025-01-26T10:00:00Z',
          updatedAt: '2025-01-26T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      // Mock storage response
      storageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(2); // Only active entries
      expect(trend.statistics.averageMood).toBe(8); // (7 + 9) / 2
      expect(trend.dataPoints).toHaveLength(2);
    });
  });

  describe('Service Integration', () => {
    test('should work together for complete mood tracking workflow', async () => {
      // Mock storage responses
      storageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      storageService.saveMoodEntry.mockResolvedValue({
        id: 'workflow-entry',
        userId: testUserId,
        rating: 8,
        notes: 'Great day!',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      });

      // Create mood entry
      const entry = await moodService.createMoodEntry(
        testUserId,
        8,
        'Great day!',
        '2025-01-28'
      );

      expect(entry.rating).toBe(8);

      // Mock trend calculation
      storageService.getMoodEntriesByDateRange.mockResolvedValue([entry]);

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(1);
      expect(trend.statistics.averageMood).toBe(8);
      expect(trend.dataPoints[0].value).toBe(8);
    });

    test('should handle error scenarios gracefully', async () => {
      // Mock storage error
      storageService.getMoodEntriesByDateRange.mockRejectedValue(
        new Error('Storage error')
      );

      // Should propagate error
      await expect(
        trendService.calculateTrend(testUserId, TimePeriod.Week)
      ).rejects.toThrow('Storage error');
    });
  });

  describe('Data Validation Integration', () => {
    test('should validate all input data consistently', async () => {
      // Test various invalid inputs
      await expect(
        moodService.createMoodEntry(testUserId, 0, 'Invalid rating', '2025-01-28')
      ).rejects.toThrow('Rating must be between 1 and 10');

      await expect(
        moodService.createMoodEntry(testUserId, 7, 'a'.repeat(501), '2025-01-28')
      ).rejects.toThrow('Notes cannot exceed 500 characters');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      await expect(
        moodService.createMoodEntry(testUserId, 7, 'Future date', futureDate)
      ).rejects.toThrow('Cannot create mood entry for future dates');
    });

    test('should handle edge cases in trend calculation', async () => {
      // Test with single entry
      const singleEntry: MoodEntry = {
        id: 'single-entry',
        userId: testUserId,
        rating: 7,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      storageService.getMoodEntriesByDateRange.mockResolvedValue([singleEntry]);

      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(1);
      expect(trend.statistics.averageMood).toBe(7);
      expect(trend.statistics.moodVariance).toBe(0);
      expect(trend.statistics.trendDirection).toBe('stable');
    });
  });
});
