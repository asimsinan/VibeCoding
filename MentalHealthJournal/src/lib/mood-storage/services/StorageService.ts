/**
 * Storage Service
 * 
 * High-level storage service that orchestrates local (IndexedDB) and cloud (PostgreSQL) storage.
 * Provides unified API for mood entries and user settings with automatic sync.
 * 
 * @fileoverview Main storage service with sync capabilities
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { DatabaseConnectionManager, ConnectionStatus } from './DatabaseConnectionManager';
import { DatabaseConfigManager } from '../config/DatabaseConfig';
import { MoodEntry, User } from '../../mood-core/models';

export interface StorageOptions {
  preferLocal?: boolean;
  syncOnWrite?: boolean;
  retryOnFailure?: boolean;
}

export interface StorageStats {
  local: {
    totalEntries: number;
    lastEntryDate: string | null;
    averageRating: number;
    syncQueueSize: number;
  };
  cloud?: {
    totalEntries: number;
    lastEntryDate: string | null;
    averageRating: number;
    syncQueueSize: number;
  };
  sync: {
    lastSync?: string;
    pendingItems: number;
    errors: string[];
  };
}

export interface SyncResult {
  success: boolean;
  localToCloud: number;
  cloudToLocal: number;
  errors: string[];
  duration: number;
}

export class StorageService {
  private connectionManager: DatabaseConnectionManager;
  private configManager: DatabaseConfigManager;
  private lastSyncTime: string | null = null;
  private syncErrors: string[] = [];

  constructor() {
    this.configManager = DatabaseConfigManager.getInstance();
    this.connectionManager = new DatabaseConnectionManager(this.configManager.getConfig());
  }

  /**
   * Initialize the storage service
   */
  async initialize(): Promise<void> {
    console.log('Initializing storage service...');
    
    try {
      await this.connectionManager.initialize();
      console.log('Storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  /**
   * Close the storage service
   */
  async close(): Promise<void> {
    console.log('Closing storage service...');
    await this.connectionManager.close();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionManager.getStatus();
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.connectionManager.isLocalAvailable();
  }

  /**
   * Check if cloud sync is available
   */
  isCloudSyncAvailable(): boolean {
    return this.connectionManager.isCloudAvailable();
  }

  /**
   * Create a new mood entry
   */
  async createMoodEntry(
    entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt' | 'synced'>,
    options: StorageOptions = {}
  ): Promise<MoodEntry> {
    const { syncOnWrite = true, retryOnFailure = true } = options;

    try {
      // Always create in local storage first
      const moodEntry: MoodEntry = {
        id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'default-user', // TODO: Get actual user ID
        rating: entry.rating,
        notes: entry.notes,
        date: entry.date || new Date().toISOString().split('T')[0],
        entryDate: entry.entryDate || entry.date || new Date().toISOString().split('T')[0], // Also provide entryDate for compatibility
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as any,
        tags: entry.tags,
        metadata: entry.metadata,
      };
      const localEntry = await this.connectionManager.getIndexedDB().saveMoodEntry(moodEntry);
      
      // Sync to cloud if available and requested
      if (syncOnWrite && this.isCloudSyncAvailable()) {
        try {
          await this.connectionManager.getPostgres()!.createMoodEntry({
            rating: moodEntry.rating,
            notes: moodEntry.notes,
            date: moodEntry.date,
          });
          // Update local entry as synced (placeholder - synced field not in model)
          // await this.connectionManager.getIndexedDB().updateMoodEntry(localEntry.id, { synced: true });
        } catch (cloudError) {
          console.warn('Failed to sync to cloud:', cloudError);
          if (retryOnFailure) {
            // Entry will be synced later via sync queue
            this.syncErrors.push(`Cloud sync failed for entry ${localEntry.id}: ${cloudError instanceof Error ? cloudError.message : 'Unknown error'}`);
          }
        }
      }

      return localEntry;
    } catch (error) {
      console.error('Failed to create mood entry:', error);
      throw new Error(`Failed to create mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get mood entries with optional filtering
   */
  async getMoodEntries(options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    preferLocal?: boolean;
  } = {}): Promise<MoodEntry[]> {
    const { preferLocal = true } = options;

    try {
      // If local is preferred and available, use local storage
      if (preferLocal && this.isAvailable()) {
        return await this.connectionManager.getIndexedDB().getMoodEntriesByDateRange(
          'default-user', // TODO: Get actual user ID
          options.startDate || '1900-01-01',
          options.endDate || '2100-12-31'
        );
      }

      // If cloud is available and local is not preferred, try cloud first
      if (!preferLocal && this.isCloudSyncAvailable()) {
        try {
          return await this.connectionManager.getPostgres()!.getMoodEntries(options) as unknown as MoodEntry[];
        } catch (cloudError) {
          console.warn('Cloud fetch failed, falling back to local:', cloudError);
          // Fall back to local if cloud fails
          if (this.isAvailable()) {
            return await this.connectionManager.getIndexedDB().getMoodEntriesByDateRange(
              'default-user', // TODO: Get actual user ID
              options.startDate || '1900-01-01',
              options.endDate || '2100-12-31'
            );
          }
          throw cloudError;
        }
      }

      // Default to local storage
      if (this.isAvailable()) {
        return await this.connectionManager.getIndexedDB().getMoodEntriesByDateRange(
          'default-user', // TODO: Get actual user ID
          options.startDate || '1900-01-01',
          options.endDate || '2100-12-31'
        );
      }

      throw new Error('No storage available');
    } catch (error) {
      console.error('Failed to get mood entries:', error);
      throw new Error(`Failed to get mood entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing mood entry
   */
  async updateMoodEntry(
    id: string,
    updates: Partial<Omit<MoodEntry, 'id' | 'createdAt'>>,
    options: StorageOptions = {}
  ): Promise<MoodEntry> {
    const { syncOnWrite = true, retryOnFailure = true } = options;

    try {
      // Update local storage first
      const localEntry = await this.connectionManager.getIndexedDB().updateMoodEntry(id, updates);
      
      // Sync to cloud if available and requested
      if (syncOnWrite && this.isCloudSyncAvailable()) {
        try {
          await this.connectionManager.getPostgres()!.updateMoodEntry(id, updates);
          // Update local entry as synced (placeholder - synced field not in model)
          // await this.connectionManager.getIndexedDB().updateMoodEntry(id, { synced: true });
        } catch (cloudError) {
          console.warn('Failed to sync update to cloud:', cloudError);
          if (retryOnFailure) {
            this.syncErrors.push(`Cloud sync failed for update ${id}: ${cloudError instanceof Error ? cloudError.message : 'Unknown error'}`);
          }
        }
      }

      return localEntry;
    } catch (error) {
      console.error('Failed to update mood entry:', error);
      throw new Error(`Failed to update mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a mood entry
   */
  async deleteMoodEntry(
    id: string,
    options: StorageOptions = {}
  ): Promise<void> {
    const { syncOnWrite = true, retryOnFailure = true } = options;

    try {
      // Delete from local storage first
      await this.connectionManager.getIndexedDB().deleteMoodEntry(id);
      
      // Sync to cloud if available and requested
      if (syncOnWrite && this.isCloudSyncAvailable()) {
        try {
          await this.connectionManager.getPostgres()!.deleteMoodEntry(id);
        } catch (cloudError) {
          console.warn('Failed to sync deletion to cloud:', cloudError);
          if (retryOnFailure) {
            this.syncErrors.push(`Cloud sync failed for deletion ${id}: ${cloudError instanceof Error ? cloudError.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
      throw new Error(`Failed to delete mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<User | null> {
    try {
      // Try local storage first (placeholder - method not implemented)
      if (this.isAvailable()) {
        // const localSettings = await this.connectionManager.getIndexedDB().getUserSettings();
        // if (localSettings) {
        //   return localSettings;
        // }
      }

      // Fall back to cloud if available
      if (this.isCloudSyncAvailable()) {
        return await this.connectionManager.getPostgres()!.getUserSettings() as User | null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    settings: Partial<User>,
    options: StorageOptions = {}
  ): Promise<User> {
    const { syncOnWrite = true, retryOnFailure = true } = options;

    try {
      // Update local storage first (placeholder - method not implemented)
      // const localSettings = await this.connectionManager.getIndexedDB().updateUserSettings(settings);
      const localSettings = settings as User;
      
      // Sync to cloud if available and requested
      if (syncOnWrite && this.isCloudSyncAvailable()) {
        try {
          await this.connectionManager.getPostgres()!.updateUserSettings(settings);
        } catch (cloudError) {
          console.warn('Failed to sync settings to cloud:', cloudError);
          if (retryOnFailure) {
            this.syncErrors.push(`Cloud sync failed for settings: ${cloudError instanceof Error ? cloudError.message : 'Unknown error'}`);
          }
        }
      }

      return localSettings;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw new Error(`Failed to update user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync data between local and cloud
   */
  async syncData(): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.connectionManager.syncData();
      
      this.lastSyncTime = new Date().toISOString();
      this.syncErrors = result.errors;

      return {
        success: result.success,
        localToCloud: result.localToCloud,
        cloudToLocal: result.cloudToLocal,
        errors: result.errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.syncErrors.push(errorMessage);
      
      return {
        success: false,
        localToCloud: 0,
        cloudToLocal: 0,
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      const dbStats = await this.connectionManager.getStats();
      // const syncQueue = await this.connectionManager.getIndexedDB().getSyncQueue();
      const syncQueue: any[] = [];

      return {
        local: dbStats.local,
        cloud: dbStats.cloud,
        sync: {
          lastSync: this.lastSyncTime ?? undefined,
          pendingItems: syncQueue.length,
          errors: this.syncErrors,
        },
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<{
    local: any;
    cloud?: any;
    exportDate: string;
  }> {
    try {
      return await this.connectionManager.exportData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    local: any;
    cloud?: any;
  }): Promise<void> {
    try {
      await this.connectionManager.importData(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    recommendations: string[];
  } {
    return this.connectionManager.getHealthStatus();
  }

  /**
   * Test all connections
   */
  async testConnections(): Promise<{
    indexedDB: boolean;
    postgres?: boolean;
  }> {
    return await this.connectionManager.testConnections();
  }

  /**
   * Clear sync errors
   */
  clearSyncErrors(): void {
    this.syncErrors = [];
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  /**
   * Get sync errors
   */
  getSyncErrors(): string[] {
    return [...this.syncErrors];
  }

  /**
   * Force sync (retry failed syncs)
   */
  async forceSync(): Promise<SyncResult> {
    console.log('Forcing sync...');
    this.clearSyncErrors();
    return await this.syncData();
  }
}
