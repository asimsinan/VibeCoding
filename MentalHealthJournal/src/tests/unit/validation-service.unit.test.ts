/**
 * Unit tests for ValidationService
 * Tests data validation and business rule enforcement
 * Traces to FR-001, FR-002, FR-007
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { ValidationService } from '../../lib/mood-core/services/ValidationService';
import { MoodEntry, MoodEntryStatus } from '../../lib/mood-core/models';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateMoodRating', () => {
    test('should accept valid ratings from 1 to 10', () => {
      for (let rating = 1; rating <= 10; rating++) {
        expect(() => validationService.validateMoodRating(rating)).not.toThrow();
      }
    });

    test('should reject rating below 1', () => {
      expect(() => validationService.validateMoodRating(0)).toThrow(
        'Rating must be between 1 and 10'
      );
      expect(() => validationService.validateMoodRating(-1)).toThrow(
        'Rating must be between 1 and 10'
      );
    });

    test('should reject rating above 10', () => {
      expect(() => validationService.validateMoodRating(11)).toThrow(
        'Rating must be between 1 and 10'
      );
      expect(() => validationService.validateMoodRating(100)).toThrow(
        'Rating must be between 1 and 10'
      );
    });

    test('should reject non-integer ratings', () => {
      expect(() => validationService.validateMoodRating(5.5)).toThrow(
        'Rating must be a whole number'
      );
      expect(() => validationService.validateMoodRating(7.2)).toThrow(
        'Rating must be a whole number'
      );
    });

    test('should reject NaN and infinity', () => {
      expect(() => validationService.validateMoodRating(NaN)).toThrow(
        'Rating must be a valid number'
      );
      expect(() => validationService.validateMoodRating(Infinity)).toThrow(
        'Rating must be a valid number'
      );
    });
  });

  describe('validateNotes', () => {
    test('should accept valid notes', () => {
      const validNotes = 'Today was a good day. I felt productive and happy.';
      expect(() => validationService.validateNotes(validNotes)).not.toThrow();
    });

    test('should accept empty notes', () => {
      expect(() => validationService.validateNotes('')).not.toThrow();
      expect(() => validationService.validateNotes(undefined)).not.toThrow();
    });

    test('should accept notes exactly 500 characters', () => {
      const maxNotes = 'a'.repeat(500);
      expect(() => validationService.validateNotes(maxNotes)).not.toThrow();
    });

    test('should reject notes longer than 500 characters', () => {
      const longNotes = 'a'.repeat(501);
      expect(() => validationService.validateNotes(longNotes)).toThrow(
        'Notes cannot exceed 500 characters'
      );
    });

    test('should handle unicode characters correctly', () => {
      const unicodeNotes = '😊 Today was amazing! 🌟 Feeling grateful 🙏';
      expect(() => validationService.validateNotes(unicodeNotes)).not.toThrow();
    });

    test('should handle special characters', () => {
      const specialNotes = 'Meeting @ 3pm - feeling anxious & stressed';
      expect(() => validationService.validateNotes(specialNotes)).not.toThrow();
    });
  });

  describe('validateDate', () => {
    test('should accept valid ISO date format', () => {
      const validDate = '2025-01-28';
      expect(() => validationService.validateDate(validDate)).not.toThrow();
    });

    test('should accept today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(() => validationService.validateDate(today)).not.toThrow();
    });

    test('should accept past dates', () => {
      const pastDate = '2020-01-01';
      expect(() => validationService.validateDate(pastDate)).not.toThrow();
    });

    test('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      expect(() => validationService.validateDate(futureDate)).toThrow(
        'Cannot create mood entry for future dates'
      );
    });

    test('should reject invalid date formats', () => {
      expect(() => validationService.validateDate('01-28-2025')).toThrow(
        'Date must be in YYYY-MM-DD format'
      );
      expect(() => validationService.validateDate('2025/01/28')).toThrow(
        'Date must be in YYYY-MM-DD format'
      );
      expect(() => validationService.validateDate('28-01-2025')).toThrow(
        'Date must be in YYYY-MM-DD format'
      );
    });

    test('should reject invalid dates', () => {
      expect(() => validationService.validateDate('2025-13-01')).toThrow(
        'Invalid date'
      );
      expect(() => validationService.validateDate('2025-02-30')).toThrow(
        'Invalid date'
      );
      expect(() => validationService.validateDate('not-a-date')).toThrow(
        'Date must be in YYYY-MM-DD format'
      );
    });
  });

  describe('validateMoodEntry', () => {
    test('should validate complete mood entry', () => {
      const validEntry: Partial<MoodEntry> = {
        rating: 7,
        notes: 'Good day',
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(validEntry)).not.toThrow();
    });

    test('should validate entry without notes', () => {
      const validEntry: Partial<MoodEntry> = {
        rating: 5,
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(validEntry)).not.toThrow();
    });

    test('should reject entry with invalid rating', () => {
      const invalidEntry: Partial<MoodEntry> = {
        rating: 15,
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(invalidEntry)).toThrow(
        'Rating must be between 1 and 10'
      );
    });

    test('should reject entry with invalid date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const invalidEntry: Partial<MoodEntry> = {
        rating: 7,
        date: tomorrow.toISOString().split('T')[0],
      };

      expect(() => validationService.validateMoodEntry(invalidEntry)).toThrow(
        'Cannot create mood entry for future dates'
      );
    });

    test('should reject entry with invalid notes', () => {
      const invalidEntry: Partial<MoodEntry> = {
        rating: 7,
        notes: 'a'.repeat(501),
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(invalidEntry)).toThrow(
        'Notes cannot exceed 500 characters'
      );
    });
  });

  describe('validateDateRange', () => {
    test('should accept valid date range', () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      expect(() => validationService.validateDateRange(startDate, endDate)).not.toThrow();
    });

    test('should accept same start and end date', () => {
      const date = '2025-01-28';
      expect(() => validationService.validateDateRange(date, date)).not.toThrow();
    });

    test('should reject invalid start date format', () => {
      const startDate = '01-01-2025';
      const endDate = '2025-01-31';

      expect(() => validationService.validateDateRange(startDate, endDate)).toThrow(
        'Start date must be in YYYY-MM-DD format'
      );
    });

    test('should reject invalid end date format', () => {
      const startDate = '2025-01-01';
      const endDate = '31-01-2025';

      expect(() => validationService.validateDateRange(startDate, endDate)).toThrow(
        'End date must be in YYYY-MM-DD format'
      );
    });

    test('should reject end date before start date', () => {
      const startDate = '2025-01-31';
      const endDate = '2025-01-01';

      expect(() => validationService.validateDateRange(startDate, endDate)).toThrow(
        'End date must be after or equal to start date'
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string as undefined notes', () => {
      const entry: Partial<MoodEntry> = {
        rating: 6,
        notes: '',
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(entry)).not.toThrow();
    });

    test('should handle whitespace-only notes', () => {
      const entry: Partial<MoodEntry> = {
        rating: 6,
        notes: '   ',
        date: '2025-01-28',
      };

      expect(() => validationService.validateMoodEntry(entry)).not.toThrow();
    });

    test('should handle leap year dates', () => {
      const leapYearDate = '2024-02-29';
      expect(() => validationService.validateDate(leapYearDate)).not.toThrow();
    });

    test('should reject leap year date in non-leap year', () => {
      const invalidLeapDate = '2025-02-29';
      expect(() => validationService.validateDate(invalidLeapDate)).toThrow(
        'Invalid date'
      );
    });

    test('should handle date at year boundary', () => {
      const yearStart = '2024-01-01';
      const yearEnd = '2024-12-31';

      expect(() => validationService.validateDate(yearStart)).not.toThrow();
      expect(() => validationService.validateDate(yearEnd)).not.toThrow();
    });
  });
});
