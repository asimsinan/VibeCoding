/**
 * Unit tests for MoodService
 * Tests CRUD operations for mood entries following TDD principles
 * Traces to FR-001, FR-002, FR-005
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { MoodService } from '../../lib/mood-core/services/MoodService';
import { MoodEntry, MoodEntryStatus } from '../../lib/mood-core/models';
import { LocalStorageService } from '../../lib/mood-storage/services/LocalStorageService';

// Mock the storage service
jest.mock('../../lib/mood-storage/services/LocalStorageService');

describe('MoodService', () => {
  let moodService: MoodService;
  let mockStorageService: jest.Mocked<LocalStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService = new LocalStorageService() as jest.Mocked<LocalStorageService>;
    moodService = new MoodService(mockStorageService);
  });

  describe('createMoodEntry', () => {
    test('should create a valid mood entry', async () => {
      const userId = 'user-123';
      const rating = 7;
      const notes = 'Feeling good today';
      const date = '2025-01-28';

      const expectedEntry = expect.objectContaining({
        userId,
        rating,
        notes,
        date,
        status: MoodEntryStatus.Active,
      });

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      mockStorageService.saveMoodEntry.mockResolvedValue({
        id: 'generated-id',
        userId,
        rating,
        notes,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      });

      const result = await moodService.createMoodEntry(userId, rating, notes, date);

      expect(mockStorageService.saveMoodEntry).toHaveBeenCalledWith(expectedEntry);
      expect(result).toMatchObject({
        userId,
        rating,
        notes,
        date,
        status: MoodEntryStatus.Active,
      });
    });

    test('should create mood entry without notes', async () => {
      const userId = 'user-123';
      const rating = 5;
      const date = '2025-01-28';

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      mockStorageService.saveMoodEntry.mockResolvedValue({
        id: 'generated-id',
        userId,
        rating,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      });

      const result = await moodService.createMoodEntry(userId, rating, undefined, date);

      expect(result.notes).toBeUndefined();
      expect(result.rating).toBe(rating);
    });

    test('should reject invalid rating below 1', async () => {
      const userId = 'user-123';
      const rating = 0;
      const date = '2025-01-28';

      await expect(
        moodService.createMoodEntry(userId, rating, undefined, date)
      ).rejects.toThrow('Rating must be between 1 and 10');
    });

    test('should reject invalid rating above 10', async () => {
      const userId = 'user-123';
      const rating = 11;
      const date = '2025-01-28';

      await expect(
        moodService.createMoodEntry(userId, rating, undefined, date)
      ).rejects.toThrow('Rating must be between 1 and 10');
    });

    test('should reject notes longer than 500 characters', async () => {
      const userId = 'user-123';
      const rating = 7;
      const notes = 'a'.repeat(501);
      const date = '2025-01-28';

      await expect(
        moodService.createMoodEntry(userId, rating, notes, date)
      ).rejects.toThrow('Notes cannot exceed 500 characters');
    });

    test('should reject future dates', async () => {
      const userId = 'user-123';
      const rating = 7;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().split('T')[0];

      await expect(
        moodService.createMoodEntry(userId, rating, undefined, date)
      ).rejects.toThrow('Cannot create mood entry for future dates');
    });

    test('should handle duplicate entry for same day', async () => {
      const userId = 'user-123';
      const rating = 7;
      const date = '2025-01-28';

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([
        {
          id: 'existing-entry',
          userId,
          rating: 5,
          date,
          createdAt: '2025-01-28T09:00:00Z',
          updatedAt: '2025-01-28T09:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ]);

      await expect(
        moodService.createMoodEntry(userId, rating, undefined, date)
      ).rejects.toThrow('A mood entry already exists for this date');
    });
  });

  describe('getMoodEntry', () => {
    test('should retrieve mood entry by id', async () => {
      const entryId = 'entry-123';
      const mockEntry: MoodEntry = {
        id: entryId,
        userId: 'user-123',
        rating: 7,
        notes: 'Good day',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      mockStorageService.getMoodEntry.mockResolvedValue(mockEntry);

      const result = await moodService.getMoodEntry(entryId);

      expect(mockStorageService.getMoodEntry).toHaveBeenCalledWith(entryId);
      expect(result).toEqual(mockEntry);
    });

    test('should return null for non-existent entry', async () => {
      const entryId = 'non-existent';
      mockStorageService.getMoodEntry.mockResolvedValue(null);

      const result = await moodService.getMoodEntry(entryId);

      expect(result).toBeNull();
    });
  });

  describe('updateMoodEntry', () => {
    test('should update existing mood entry', async () => {
      const entryId = 'entry-123';
      const existingEntry: MoodEntry = {
        id: entryId,
        userId: 'user-123',
        rating: 5,
        notes: 'Okay day',
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      const updates = {
        rating: 8,
        notes: 'Actually a great day!',
      };

      mockStorageService.getMoodEntry.mockResolvedValue(existingEntry);
      mockStorageService.updateMoodEntry.mockResolvedValue({
        ...existingEntry,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      const result = await moodService.updateMoodEntry(entryId, updates);

      expect(result.rating).toBe(8);
      expect(result.notes).toBe('Actually a great day!');
      expect(result.updatedAt).not.toBe(existingEntry.updatedAt);
    });

    test('should validate rating on update', async () => {
      const entryId = 'entry-123';
      mockStorageService.getMoodEntry.mockResolvedValue({
        id: entryId,
        userId: 'user-123',
        rating: 5,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      });

      await expect(
        moodService.updateMoodEntry(entryId, { rating: 15 })
      ).rejects.toThrow('Rating must be between 1 and 10');
    });

    test('should throw error when updating non-existent entry', async () => {
      const entryId = 'non-existent';
      mockStorageService.getMoodEntry.mockResolvedValue(null);

      await expect(
        moodService.updateMoodEntry(entryId, { rating: 8 })
      ).rejects.toThrow('Mood entry not found');
    });
  });

  describe('deleteMoodEntry', () => {
    test('should soft delete mood entry', async () => {
      const entryId = 'entry-123';
      const existingEntry: MoodEntry = {
        id: entryId,
        userId: 'user-123',
        rating: 7,
        date: '2025-01-28',
        createdAt: '2025-01-28T10:00:00Z',
        updatedAt: '2025-01-28T10:00:00Z',
        status: MoodEntryStatus.Active,
      };

      mockStorageService.getMoodEntry.mockResolvedValue(existingEntry);
      mockStorageService.updateMoodEntry.mockResolvedValue({
        ...existingEntry,
        status: MoodEntryStatus.Deleted,
        updatedAt: new Date().toISOString(),
      });

      const result = await moodService.deleteMoodEntry(entryId);

      expect(mockStorageService.updateMoodEntry).toHaveBeenCalledWith(
        entryId,
        expect.objectContaining({
          status: MoodEntryStatus.Deleted,
        })
      );
      expect(result).toBe(true);
    });

    test('should return false when deleting non-existent entry', async () => {
      const entryId = 'non-existent';
      mockStorageService.getMoodEntry.mockResolvedValue(null);

      const result = await moodService.deleteMoodEntry(entryId);

      expect(result).toBe(false);
    });
  });

  describe('getMoodEntriesByDateRange', () => {
    test('should retrieve entries for date range', async () => {
      const userId = 'user-123';
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      const mockEntries: MoodEntry[] = [
        {
          id: 'entry-1',
          userId,
          rating: 7,
          date: '2025-01-15',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
        {
          id: 'entry-2',
          userId,
          rating: 8,
          date: '2025-01-20',
          createdAt: '2025-01-20T10:00:00Z',
          updatedAt: '2025-01-20T10:00:00Z',
          status: MoodEntryStatus.Active,
        },
      ];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue(mockEntries);

      const result = await moodService.getMoodEntriesByDateRange(userId, startDate, endDate);

      expect(mockStorageService.getMoodEntriesByDateRange).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate
      );
      expect(result).toEqual(mockEntries);
    });

    test('should return empty array when no entries found', async () => {
      const userId = 'user-123';
      const startDate = '2025-02-01';
      const endDate = '2025-02-28';

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);

      const result = await moodService.getMoodEntriesByDateRange(userId, startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty notes gracefully', async () => {
      const userId = 'user-123';
      const rating = 6;
      const date = '2025-01-28';

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      mockStorageService.saveMoodEntry.mockResolvedValue({
        id: 'generated-id',
        userId,
        rating,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      });

      const result = await moodService.createMoodEntry(userId, rating, '', date);

      expect(result.notes).toBeUndefined();
    });

    test('should handle today date correctly', async () => {
      const userId = 'user-123';
      const rating = 7;
      const today = new Date().toISOString().split('T')[0];

      mockStorageService.getMoodEntriesByDateRange.mockResolvedValue([]);
      mockStorageService.saveMoodEntry.mockResolvedValue({
        id: 'generated-id',
        userId,
        rating,
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: MoodEntryStatus.Active,
      });

      const result = await moodService.createMoodEntry(userId, rating, undefined, today);

      expect(result.date).toBe(today);
    });
  });
});
