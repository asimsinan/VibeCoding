/**
 * IndexedDBAdapter - Handles IndexedDB operations for mood data
 * Implements local storage with IndexedDB (FR-007)
 * Part of @moodtracker/storage library
 */

import { MoodEntry } from '../../mood-core/models';

export class IndexedDBAdapter {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private readonly version = 1;
  private readonly storeName = 'moodEntries';

  constructor(dbName: string = 'mood-tracker') {
    this.dbName = dbName;
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if indexedDB is available
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for mood entries
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
          });

          // Create indexes for efficient querying
          objectStore.createIndex('userId', 'userId', { unique: false });
          objectStore.createIndex('date', 'date', { unique: false });
          objectStore.createIndex('userDate', ['userId', 'date'], { unique: false });
          objectStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  /**
   * Save a mood entry
   */
  async saveMoodEntry(entry: MoodEntry): Promise<MoodEntry> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve(entry);
      };

      request.onerror = () => {
        reject(new Error('Failed to save mood entry'));
      };
    });
  }

  /**
   * Get a mood entry by ID
   */
  async getMoodEntry(entryId: string): Promise<MoodEntry | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(entryId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get mood entry'));
      };
    });
  }

  /**
   * Update a mood entry
   */
  async updateMoodEntry(entryId: string, updates: Partial<MoodEntry>): Promise<MoodEntry> {
    const existing = await this.getMoodEntry(entryId);
    if (!existing) {
      throw new Error('Mood entry not found');
    }

    const updated = { 
      ...existing, 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return await this.saveMoodEntry(updated);
  }

  /**
   * Get mood entries by date range for a user
   */
  async getMoodEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MoodEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const entries = request.result as MoodEntry[];
        // Filter by date range
        const filtered = entries.filter(entry => {
          return entry.date >= startDate && entry.date <= endDate;
        });
        // Sort by date
        filtered.sort((a, b) => a.date.localeCompare(b.date));
        resolve(filtered);
      };

      request.onerror = () => {
        reject(new Error('Failed to get mood entries'));
      };
    });
  }

  /**
   * Get all mood entries for a user
   */
  async getAllMoodEntries(userId: string): Promise<MoodEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const entries = request.result as MoodEntry[];
        // Sort by date descending
        entries.sort((a, b) => b.date.localeCompare(a.date));
        resolve(entries);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all mood entries'));
      };
    });
  }

  /**
   * Delete a mood entry (hard delete for testing)
   */
  async deleteMoodEntry(entryId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(entryId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete mood entry'));
      };
    });
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear data'));
      };
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }
}