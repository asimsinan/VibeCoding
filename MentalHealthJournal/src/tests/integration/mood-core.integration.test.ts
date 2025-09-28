/**
 * Integration tests for @moodtracker/core library with real IndexedDB
 * Tests database operations with actual data
 * Traces to Integration-First Testing Gate
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { MoodService } from '../../lib/mood-core/services/MoodService';
import { TrendService } from '../../lib/mood-core/services/TrendService';
import { LocalStorageService } from '../../lib/mood-storage/services/LocalStorageService';
import { IndexedDBAdapter } from '../../lib/mood-storage/adapters/IndexedDBAdapter';
import { MoodEntry, MoodEntryStatus, TimePeriod } from '../../lib/mood-core/models';

// fake-indexeddb is set up in jest.setup.fake-indexeddb.js

describe('@moodtracker/core Integration Tests', () => {
  let storageService: LocalStorageService;
  let moodService: MoodService;
  let trendService: TrendService;
  let dbAdapter: IndexedDBAdapter;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Initialize real IndexedDB adapter
    dbAdapter = new IndexedDBAdapter('mood-tracker-test');
    await dbAdapter.init();

    // Initialize services with real storage
    storageService = new LocalStorageService();
    storageService.setAdapter(dbAdapter);
    
    moodService = new MoodService(storageService);
    trendService = new TrendService(storageService);

    // Clear any existing data
    if (dbAdapter.isInitialized()) {
      await dbAdapter.clearAll();
    }
  });

  afterEach(async () => {
    // Clean up
    if (dbAdapter && dbAdapter.isInitialized()) {
      await dbAdapter.clearAll();
      await dbAdapter.close();
    }
  });

  describe('MoodService Integration', () => {
    test('should create and retrieve mood entry', async () => {
      // Create mood entry
      const rating = 7;
      const notes = 'Integration test entry';
      const date = '2025-01-28';

      const createdEntry = await moodService.createMoodEntry(
        testUserId,
        rating,
        notes,
        date
      );

      expect(createdEntry).toBeDefined();
      expect(createdEntry.id).toBeDefined();
      expect(createdEntry.rating).toBe(rating);
      expect(createdEntry.notes).toBe(notes);

      // Retrieve the entry
      const retrievedEntry = await moodService.getMoodEntry(createdEntry.id);
      
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.id).toBe(createdEntry.id);
      expect(retrievedEntry?.rating).toBe(rating);
      expect(retrievedEntry?.notes).toBe(notes);
    });

    test('should update mood entry', async () => {
      // Create initial entry
      const createdEntry = await moodService.createMoodEntry(
        testUserId,
        5,
        'Initial mood',
        '2025-01-28'
      );

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update the entry
      const updatedEntry = await moodService.updateMoodEntry(createdEntry.id, {
        rating: 8,
        notes: 'Updated mood - feeling better!',
      });

      expect(updatedEntry.rating).toBe(8);
      expect(updatedEntry.notes).toBe('Updated mood - feeling better!');
      expect(updatedEntry.updatedAt).not.toBe(createdEntry.updatedAt);

      // Verify persistence
      const retrievedEntry = await moodService.getMoodEntry(createdEntry.id);
      expect(retrievedEntry?.rating).toBe(8);
    });

    test('should soft delete mood entry', async () => {
      // Create entry
      const createdEntry = await moodService.createMoodEntry(
        testUserId,
        6,
        'To be deleted',
        '2025-01-28'
      );

      // Delete the entry
      const deleted = await moodService.deleteMoodEntry(createdEntry.id);
      expect(deleted).toBe(true);

      // Verify it's soft deleted
      const retrievedEntry = await moodService.getMoodEntry(createdEntry.id);
      expect(retrievedEntry?.status).toBe(MoodEntryStatus.Deleted);
    });

    test('should retrieve entries by date range', async () => {
      // Create multiple entries
      const entries = [
        { rating: 5, date: '2025-01-25' },
        { rating: 6, date: '2025-01-26' },
        { rating: 7, date: '2025-01-27' },
        { rating: 8, date: '2025-01-28' },
        { rating: 4, date: '2025-01-29' }, // Future date for testing
      ];

      for (const entry of entries) {
        await moodService.createMoodEntry(
          testUserId,
          entry.rating,
          `Mood for ${entry.date}`,
          entry.date
        );
      }

      // Query range
      const rangeEntries = await moodService.getMoodEntriesByDateRange(
        testUserId,
        '2025-01-26',
        '2025-01-28'
      );

      expect(rangeEntries).toHaveLength(3);
      expect(rangeEntries[0].date).toBe('2025-01-26');
      expect(rangeEntries[2].date).toBe('2025-01-28');
    });

    test('should handle duplicate entry for same day', async () => {
      const date = '2025-01-28';

      // Create first entry
      await moodService.createMoodEntry(testUserId, 6, 'First entry', date);

      // Attempt to create duplicate
      await expect(
        moodService.createMoodEntry(testUserId, 7, 'Duplicate entry', date)
      ).rejects.toThrow('A mood entry already exists for this date');
    });
  });

  describe('TrendService Integration', () => {
    test('should calculate weekly trend with real data', async () => {
      // Create a week's worth of entries
      // Create a week of mood entries (last 7 days)
      const today = new Date();
      const weekEntries = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        weekEntries.push({
          rating: 5 + (i % 4), // Varying ratings
          date: date.toISOString().split('T')[0]
        });
      }

      for (const entry of weekEntries) {
        await moodService.createMoodEntry(
          testUserId,
          entry.rating,
          undefined,
          entry.date
        );
      }

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(7);
      expect(trend.statistics.averageMood).toBeCloseTo(6.29, 1);
      expect(trend.statistics.lowestMood).toBe(5);
      expect(trend.statistics.highestMood).toBe(8);
      expect(trend.statistics.completionRate).toBe(1); // 100% for the week
      expect(trend.dataPoints).toHaveLength(7);
    });

    test('should detect improving trend', async () => {
      // Create entries with improving pattern (last 7 days)
      const today = new Date();
      const entries = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i)); // Start from 6 days ago, go to today
        entries.push({
          rating: 3 + i, // Improving pattern: 3, 4, 5, 6, 7, 8, 9
          date: date.toISOString().split('T')[0]
        });
      }

      for (const entry of entries) {
        await moodService.createMoodEntry(
          testUserId,
          entry.rating,
          undefined,
          entry.date
        );
      }

      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.trendDirection).toBe('improving');
      expect(trend.insights).toBeDefined();
      expect(trend.insights!.some(i => i.includes('improving'))).toBe(true);
    });

    test('should handle sparse data correctly', async () => {
      // Create only a few entries in a month (last 30 days)
      const today = new Date();
      const date1 = new Date(today);
      date1.setDate(today.getDate() - 25);
      const date2 = new Date(today);
      date2.setDate(today.getDate() - 15);
      const date3 = new Date(today);
      date3.setDate(today.getDate() - 5);
      
      await moodService.createMoodEntry(testUserId, 7, undefined, date1.toISOString().split('T')[0]);
      await moodService.createMoodEntry(testUserId, 6, undefined, date2.toISOString().split('T')[0]);
      await moodService.createMoodEntry(testUserId, 8, undefined, date3.toISOString().split('T')[0]);

      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Month);

      expect(trend.statistics.totalEntries).toBe(3);
      expect(trend.statistics.completionRate).toBe(0.1); // 3/30 days
      expect(trend.statistics.averageMood).toBe(7);
      expect(trend.insights!.some(i => i.includes('completion rate'))).toBe(true);
    });

    test('should exclude deleted entries from trends', async () => {
      // Create entries (last 3 days)
      const today = new Date();
      const date1 = new Date(today);
      date1.setDate(today.getDate() - 2);
      const date2 = new Date(today);
      date2.setDate(today.getDate() - 1);
      const date3 = new Date(today);
      
      const entry1 = await moodService.createMoodEntry(testUserId, 8, undefined, date1.toISOString().split('T')[0]);
      const entry2 = await moodService.createMoodEntry(testUserId, 3, undefined, date2.toISOString().split('T')[0]); // Low rating
      const entry3 = await moodService.createMoodEntry(testUserId, 9, undefined, date3.toISOString().split('T')[0]);

      // Delete the low rating entry
      await moodService.deleteMoodEntry(entry2.id);

      // Calculate trend
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Week);

      expect(trend.statistics.totalEntries).toBe(2); // Only active entries
      expect(trend.statistics.averageMood).toBe(8.5); // (8 + 9) / 2
      expect(trend.statistics.lowestMood).toBe(8); // Excludes deleted entry
    });
  });

  describe('Data Persistence', () => {
    test('should persist data across service instances', async () => {
      // Create entry with first service instance
      const entry = await moodService.createMoodEntry(
        testUserId,
        7,
        'Persistence test',
        '2025-01-28'
      );

      // Create new service instances with same storage
      const newMoodService = new MoodService(storageService);
      
      // Retrieve with new instance
      const retrievedEntry = await newMoodService.getMoodEntry(entry.id);
      
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.notes).toBe('Persistence test');
    });

    test('should handle large number of entries', async () => {
      // Create 90 entries (last 90 days)
      const today = new Date();
      const entries: MoodEntry[] = [];

      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (89 - i)); // Last 90 days
        const dateStr = date.toISOString().split('T')[0];
        
        const entry = await moodService.createMoodEntry(
          testUserId,
          1 + (i % 10), // Ratings 1-10
          `Entry ${i}`,
          dateStr
        );
        entries.push(entry);
      }

      // Retrieve all entries
      const allEntries = await moodService.getAllMoodEntries(testUserId);
      expect(allEntries).toHaveLength(90);

      // Calculate trend for the period
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Quarter);
      expect(trend.statistics.totalEntries).toBe(90); // Last 90 days
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      // Close the database to simulate error
      await dbAdapter.close();

      // Attempt operations
      await expect(
        moodService.createMoodEntry(testUserId, 7, 'Error test', '2025-01-28')
      ).rejects.toThrow();
    });

    test('should validate data integrity', async () => {
      // Create entry
      const entry = await moodService.createMoodEntry(
        testUserId,
        7,
        'Integrity test',
        '2025-01-28'
      );

      // Manually corrupt the data (simulate data corruption)
      // This would normally not be possible, but we're testing error handling
      const corruptedEntry = { ...entry, rating: 15 }; // Invalid rating

      // The validation service should catch this when retrieving
      await expect(
        moodService.updateMoodEntry(entry.id, { rating: 15 })
      ).rejects.toThrow('Rating must be between 1 and 10');
    });
  });

  describe('Performance', () => {
    test('should handle date range queries efficiently', async () => {
      // Create entries for a full year
      // Create entries for the last 90 days
      const today = new Date();
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (89 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        await moodService.createMoodEntry(
          testUserId,
          1 + (i % 10),
          undefined,
          dateStr
        );
      }

      // Measure query performance (last 30 days)
      const endDate = new Date(today);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      
      const startTime = Date.now();
      const monthEntries = await moodService.getMoodEntriesByDateRange(
        testUserId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      const queryTime = Date.now() - startTime;

      expect(monthEntries).toHaveLength(30);
      expect(queryTime).toBeLessThan(100); // Should be fast
    });

    test('should calculate trends efficiently', async () => {
      // Create 90 days of entries (last 90 days)
      const today = new Date();
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (89 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        await moodService.createMoodEntry(
          testUserId,
          1 + (i % 10),
          undefined,
          dateStr
        );
      }

      // Measure trend calculation performance
      const startTime = Date.now();
      const trend = await trendService.calculateTrend(testUserId, TimePeriod.Quarter);
      const calcTime = Date.now() - startTime;

      expect(trend.statistics.totalEntries).toBe(90);
      expect(calcTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
