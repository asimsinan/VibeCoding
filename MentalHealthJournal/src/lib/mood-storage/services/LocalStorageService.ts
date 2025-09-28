/**
 * LocalStorageService - Handles local data persistence using IndexedDB
 * Implements data storage operations (FR-007)
 * Part of @moodtracker/storage library
 */

import { MoodEntry } from '../../mood-core/models';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';

export class LocalStorageService {
  private adapter: IndexedDBAdapter | null = null;

  /**
   * Set the storage adapter
   */
  setAdapter(adapter: IndexedDBAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get or create the adapter
   */
  async getAdapter(): Promise<IndexedDBAdapter> {
    if (!this.adapter) {
      this.adapter = new IndexedDBAdapter();
      await this.adapter.init();
    }
    return this.adapter;
  }

  /**
   * Save a mood entry to storage
   */
  async saveMoodEntry(entry: MoodEntry): Promise<MoodEntry> {
    const adapter = await this.getAdapter();
    return await adapter.saveMoodEntry(entry);
  }

  /**
   * Get a mood entry by ID
   */
  async getMoodEntry(entryId: string): Promise<MoodEntry | null> {
    const adapter = await this.getAdapter();
    return await adapter.getMoodEntry(entryId);
  }

  /**
   * Update a mood entry
   */
  async updateMoodEntry(entryId: string, entry: MoodEntry): Promise<MoodEntry> {
    const adapter = await this.getAdapter();
    return await adapter.updateMoodEntry(entryId, entry);
  }

  /**
   * Get mood entries by date range
   */
  async getMoodEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MoodEntry[]> {
    const adapter = await this.getAdapter();
    return await adapter.getMoodEntriesByDateRange(userId, startDate, endDate);
  }

  /**
   * Get all mood entries for a user
   */
  async getAllMoodEntries(userId: string): Promise<MoodEntry[]> {
    const adapter = await this.getAdapter();
    return await adapter.getAllMoodEntries(userId);
  }
}