/**
 * MoodService - Core business logic for mood entry management
 * Implements CRUD operations for mood entries (FR-001, FR-002, FR-005)
 * Follows single domain model approach (Anti-Abstraction Gate)
 */

import { MoodEntry, MoodEntryStatus } from '../models';
import { LocalStorageService } from '../../mood-storage/services/LocalStorageService';
import { ValidationService } from './ValidationService';

export class MoodService {
  private validationService: ValidationService;

  constructor(private storageService: LocalStorageService) {
    this.validationService = new ValidationService();
  }

  /**
   * Create a new mood entry (FR-001, FR-002)
   */
  async createMoodEntry(
    userId: string,
    rating: number,
    notes?: string,
    date?: string
  ): Promise<MoodEntry> {
    // Use today's date if not provided
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Validate input
    this.validationService.validateMoodRating(rating);
    if (notes !== undefined && notes !== '') {
      this.validationService.validateNotes(notes);
    }
    this.validationService.validateDate(entryDate);

    // Check for duplicate entry on the same day
    const existingEntries = await this.storageService.getMoodEntriesByDateRange(
      userId,
      entryDate,
      entryDate
    );

    const activeEntry = existingEntries.find(
      entry => entry.status === MoodEntryStatus.Active
    );

    if (activeEntry) {
      throw new Error('A mood entry already exists for this date');
    }

    // Create new entry
    const now = new Date().toISOString();
    const moodEntry: MoodEntry = {
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      rating,
      notes: notes && notes.trim() ? notes : undefined,
      date: entryDate,
      entryDate: entryDate, // Also provide entryDate for compatibility
      createdAt: now,
      updatedAt: now,
      status: MoodEntryStatus.Active,
    };

    // Save to storage
    return await this.storageService.saveMoodEntry(moodEntry);
  }

  /**
   * Retrieve a mood entry by ID (FR-003)
   */
  async getMoodEntry(entryId: string): Promise<MoodEntry | null> {
    return await this.storageService.getMoodEntry(entryId);
  }

  /**
   * Update an existing mood entry (FR-005)
   */
  async updateMoodEntry(
    entryId: string,
    updates: Partial<Pick<MoodEntry, 'rating' | 'notes'>>
  ): Promise<MoodEntry> {
    // Get existing entry
    const existingEntry = await this.storageService.getMoodEntry(entryId);
    if (!existingEntry) {
      throw new Error('Mood entry not found');
    }

    // Validate updates
    if (updates.rating !== undefined) {
      this.validationService.validateMoodRating(updates.rating);
    }
    if (updates.notes !== undefined) {
      this.validationService.validateNotes(updates.notes);
    }

    // Apply updates
    const updatedEntry: MoodEntry = {
      ...existingEntry,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    return await this.storageService.updateMoodEntry(entryId, updatedEntry);
  }

  /**
   * Soft delete a mood entry (FR-005)
   */
  async deleteMoodEntry(entryId: string): Promise<boolean> {
    // Get existing entry
    const existingEntry = await this.storageService.getMoodEntry(entryId);
    if (!existingEntry) {
      return false;
    }

    // Soft delete by updating status
    await this.storageService.updateMoodEntry(entryId, {
      ...existingEntry,
      status: MoodEntryStatus.Deleted,
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Get mood entries for a date range (FR-003)
   */
  async getMoodEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MoodEntry[]> {
    this.validationService.validateDateRange(startDate, endDate);
    
    return await this.storageService.getMoodEntriesByDateRange(
      userId,
      startDate,
      endDate
    );
  }

  /**
   * Get all mood entries for a user (FR-003)
   */
  async getAllMoodEntries(userId: string): Promise<MoodEntry[]> {
    return await this.storageService.getAllMoodEntries(userId);
  }
}
