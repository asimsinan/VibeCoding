/**
 * ValidationService - Validates mood entry data and enforces business rules
 * Implements data validation for all mood-related operations
 * Traces to FR-001, FR-002, FR-007
 */

import { MoodEntry } from '../models';

export class ValidationService {
  /**
   * Validate mood rating (FR-001)
   */
  validateMoodRating(rating: number): void {
    if (!Number.isFinite(rating)) {
      throw new Error('Rating must be a valid number');
    }

    if (!Number.isInteger(rating)) {
      throw new Error('Rating must be a whole number');
    }

    if (rating < 1 || rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }
  }

  /**
   * Validate mood notes (FR-002)
   */
  validateNotes(notes?: string): void {
    if (notes === undefined || notes === null) {
      return; // Notes are optional
    }

    if (notes.length > 500) {
      throw new Error('Notes cannot exceed 500 characters');
    }
  }

  /**
   * Validate date format and ensure it's not in the future
   */
  validateDate(date: string): void {
    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Parse and validate date
    const parsedDate = new Date(date + 'T00:00:00');
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }

    // Check if date components match (to catch invalid dates like 2025-02-30)
    const [year, month, day] = date.split('-').map(Number);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      throw new Error('Invalid date');
    }

    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate > today) {
      throw new Error('Cannot create mood entry for future dates');
    }
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: string, endDate: string): void {
    // Validate individual dates
    const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDateRegex.test(startDate)) {
      throw new Error('Start date must be in YYYY-MM-DD format');
    }

    const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!endDateRegex.test(endDate)) {
      throw new Error('End date must be in YYYY-MM-DD format');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date');
    }

    if (isNaN(end.getTime())) {
      throw new Error('Invalid end date');
    }

    if (start > end) {
      throw new Error('End date must be after or equal to start date');
    }
  }

  /**
   * Validate complete mood entry
   */
  validateMoodEntry(entry: Partial<MoodEntry>): void {
    if (entry.rating !== undefined) {
      this.validateMoodRating(entry.rating);
    }

    if (entry.notes !== undefined) {
      this.validateNotes(entry.notes);
    }

    if (entry.date !== undefined) {
      this.validateDate(entry.date);
    }
  }

  /**
   * Sanitize notes by trimming whitespace
   */
  sanitizeNotes(notes?: string): string | undefined {
    if (!notes) {
      return undefined;
    }

    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
