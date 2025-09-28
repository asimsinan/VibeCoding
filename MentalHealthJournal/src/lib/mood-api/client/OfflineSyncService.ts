/**
 * Offline Sync Service
 * 
 * Handles offline data synchronization and conflict resolution.
 * 
 * @fileoverview Offline synchronization service
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { MoodEntry, User } from '../../mood-core/models';
import { LocalStorageService } from '../../mood-storage/services/LocalStorageService';
import { MoodApiClient } from './MoodApiClient';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'mood' | 'user';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  localToCloud: number;
  cloudToLocal: number;
  errors: string[];
  duration: number;
  operations: SyncOperation[];
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData: any;
  conflicts: Conflict[];
}

export interface Conflict {
  field: string;
  localValue: any;
  remoteValue: any;
  resolution: 'local' | 'remote' | 'merge';
}

export class OfflineSyncService {
  private localStorage: LocalStorageService;
  private apiClient: MoodApiClient;
  private syncQueue: Map<string, SyncOperation> = new Map();
  private isOnline: boolean = true;

  constructor(
    localStorage: LocalStorageService,
    apiClient: MoodApiClient
  ) {
    this.localStorage = localStorage;
    this.apiClient = apiClient;
    this.setupOnlineStatusListener();
  }

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(
    type: 'create' | 'update' | 'delete',
    entityType: 'mood' | 'user',
    entityId: string,
    data: any
  ): void {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.syncQueue.set(operation.id, operation);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOperation(operation).catch(console.error);
    }
  }

  /**
   * Sync all pending operations
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      localToCloud: 0,
      cloudToLocal: 0,
      errors: [],
      duration: 0,
      operations: [],
    };

    try {
      // Sync local to cloud
      const localToCloudResult = await this.syncLocalToCloud();
      result.localToCloud = localToCloudResult;

      // Sync cloud to local
      const cloudToLocalResult = await this.syncCloudToLocal();
      result.cloudToLocal = cloudToLocalResult;

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      result.duration = Date.now() - startTime;
      result.operations = Array.from(this.syncQueue.values());
    }

    return result;
  }

  /**
   * Sync local changes to cloud
   */
  private async syncLocalToCloud(): Promise<number> {
    let syncedCount = 0;
    const operations = Array.from(this.syncQueue.values());

    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          this.syncQueue.delete(operation.id);
        }
      }
    }

    this.saveSyncQueue();
    return syncedCount;
  }

  /**
   * Sync cloud changes to local
   */
  private async syncCloudToLocal(): Promise<number> {
    try {
      // Get latest mood entries from API
      const apiMoods = await this.apiClient.getMoodEntries();
      const localMoods = await this.localStorage.getAllMoodEntries('default-user');

      // Find new or updated entries
      const newEntries = apiMoods.filter(apiMood => 
        !localMoods.some(localMood => localMood.id === apiMood.id)
      );

      const updatedEntries = apiMoods.filter(apiMood => {
        const localMood = localMoods.find(localMood => localMood.id === apiMood.id);
        return localMood && new Date(apiMood.updatedAt) > new Date(localMood.updatedAt);
      });

      // Save new entries
      for (const mood of newEntries) {
        await this.localStorage.saveMoodEntry(mood);
      }

      // Update existing entries
      for (const mood of updatedEntries) {
        await this.localStorage.updateMoodEntry(mood.id, mood);
      }

      return newEntries.length + updatedEntries.length;
    } catch (error) {
      console.error('Failed to sync cloud to local:', error);
      return 0;
    }
  }

  /**
   * Sync individual operation
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await this.syncCreateOperation(operation);
        break;
      case 'update':
        await this.syncUpdateOperation(operation);
        break;
      case 'delete':
        await this.syncDeleteOperation(operation);
        break;
    }

    // Remove from queue after successful sync
    this.syncQueue.delete(operation.id);
  }

  /**
   * Sync create operation
   */
  private async syncCreateOperation(operation: SyncOperation): Promise<void> {
    if (operation.entityType === 'mood') {
      await this.apiClient.createMoodEntry(operation.data);
    } else if (operation.entityType === 'user') {
      await this.apiClient.updateUserProfile(operation.data);
    }
  }

  /**
   * Sync update operation
   */
  private async syncUpdateOperation(operation: SyncOperation): Promise<void> {
    if (operation.entityType === 'mood') {
      await this.apiClient.updateMoodEntry(operation.entityId, operation.data);
    } else if (operation.entityType === 'user') {
      await this.apiClient.updateUserProfile(operation.data);
    }
  }

  /**
   * Sync delete operation
   */
  private async syncDeleteOperation(operation: SyncOperation): Promise<void> {
    if (operation.entityType === 'mood') {
      await this.apiClient.deleteMoodEntry(operation.entityId);
    }
  }

  /**
   * Resolve conflicts between local and remote data
   */
  async resolveConflicts(
    localData: any,
    remoteData: any,
    strategy: 'local' | 'remote' | 'merge' = 'merge'
  ): Promise<ConflictResolution> {
    const conflicts: Conflict[] = [];
    const resolvedData = { ...localData };

    // Find conflicting fields
    for (const key in remoteData) {
      if (localData[key] !== undefined && localData[key] !== remoteData[key]) {
        conflicts.push({
          field: key,
          localValue: localData[key],
          remoteValue: remoteData[key],
          resolution: strategy,
        });

        // Apply resolution strategy
        switch (strategy) {
          case 'local':
            // Keep local value
            break;
          case 'remote':
            // Use remote value
            resolvedData[key] = remoteData[key];
            break;
          case 'merge':
            // Merge values (custom logic per field)
            resolvedData[key] = this.mergeField(key, localData[key], remoteData[key]);
            break;
        }
      }
    }

    return {
      strategy,
      resolvedData,
      conflicts,
    };
  }

  /**
   * Merge field values
   */
  private mergeField(field: string, localValue: any, remoteValue: any): any {
    switch (field) {
      case 'notes':
        // Concatenate notes
        return `${localValue || ''}\n---\n${remoteValue || ''}`.trim();
      case 'tags':
        // Merge arrays
        return [...new Set([...(localValue || []), ...(remoteValue || [])])];
      case 'metadata':
        // Merge objects
        return { ...(localValue || {}), ...(remoteValue || {}) };
      case 'updatedAt':
        // Use the more recent timestamp
        return new Date(localValue) > new Date(remoteValue) ? localValue : remoteValue;
      default:
        // Default to remote value
        return remoteValue;
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): {
    pending: number;
    operations: SyncOperation[];
    oldestOperation: SyncOperation | null;
  } {
    const operations = Array.from(this.syncQueue.values());
    const oldestOperation = operations.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest, 
      operations[0] || null
    );

    return {
      pending: operations.length,
      operations,
      oldestOperation,
    };
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue.clear();
    this.saveSyncQueue();
  }

  /**
   * Setup online status listener
   */
  private setupOnlineStatusListener(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      
      if (this.isOnline) {
        // Try to sync when coming back online
        this.syncAll().catch(console.error);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveSyncQueue(): void {
    try {
      if (typeof window !== 'undefined') {
        const data = Array.from(this.syncQueue.entries());
        localStorage.setItem('moodtracker-sync-queue', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private loadSyncQueue(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('moodtracker-sync-queue');
        if (stored) {
          const data = JSON.parse(stored);
          this.syncQueue = new Map(data);
        }
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get online status
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }
}
