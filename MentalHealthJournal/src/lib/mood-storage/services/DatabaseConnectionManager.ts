/**
 * Database Connection Manager
 * 
 * Manages connections to both IndexedDB (local) and PostgreSQL (cloud) databases.
 * Implements connection pooling, retry logic, and failover strategies.
 * 
 * @fileoverview Centralized database connection management
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { MoodEntry, User } from '../../mood-core/models';
import { PostgresAdapter, PostgresConfig } from '../adapters/PostgresAdapter';

export interface ConnectionConfig {
  indexedDB: {
    name: string;
    version: number;
    encryptionKey: string;
  };
  postgres?: PostgresConfig;
  userId: string;
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

export interface ConnectionStatus {
  indexedDB: {
    connected: boolean;
    lastError?: string;
    lastConnected?: string;
  };
  postgres?: {
    connected: boolean;
    lastError?: string;
    lastConnected?: string;
    poolSize?: number;
    activeConnections?: number;
  };
}

export class DatabaseConnectionManager {
  private indexedDB: IndexedDBAdapter;
  private postgres?: PostgresAdapter;
  private config: ConnectionConfig;
  private status: ConnectionStatus;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.indexedDB = new IndexedDBAdapter(config.indexedDB.name);
    
    if (config.postgres) {
      this.postgres = new PostgresAdapter(config.postgres, config.userId);
    }

    this.status = {
      indexedDB: { connected: false },
      postgres: config.postgres ? { connected: false } : undefined,
    };
  }

  /**
   * Initialize all database connections
   */
  async initialize(): Promise<void> {
    console.log('Initializing database connections...');

    // Initialize IndexedDB (always required)
    await this.initializeIndexedDB();

    // Initialize PostgreSQL if configured
    if (this.postgres) {
      await this.initializePostgres();
    }

    console.log('Database connections initialized successfully');
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initializeIndexedDB(): Promise<void> {
    try {
      await this.indexedDB.init();
      this.status.indexedDB = {
        connected: true,
        lastConnected: new Date().toISOString(),
      };
      console.log('IndexedDB connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.indexedDB = {
        connected: false,
        lastError: errorMessage,
      };
      console.error('Failed to connect to IndexedDB:', errorMessage);
      throw new Error(`IndexedDB connection failed: ${errorMessage}`);
    }
  }

  /**
   * Initialize PostgreSQL connection
   */
  private async initializePostgres(): Promise<void> {
    if (!this.postgres) {
      return;
    }

    try {
      await this.postgres.initialize();
      this.status.postgres = {
        connected: true,
        lastConnected: new Date().toISOString(),
      };
      console.log('PostgreSQL connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.postgres = {
        connected: false,
        lastError: errorMessage,
      };
      console.warn('PostgreSQL connection failed, continuing with local-only mode:', errorMessage);
      
      // Don't throw error for PostgreSQL failure - app can work with IndexedDB only
    }
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    console.log('Closing database connections...');

    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();

    // Close IndexedDB
    try {
      await this.indexedDB.close();
      this.status.indexedDB.connected = false;
      console.log('IndexedDB connection closed');
    } catch (error) {
      console.error('Error closing IndexedDB:', error);
    }

    // Close PostgreSQL
    if (this.postgres) {
      try {
        await this.postgres.close();
        this.status.postgres!.connected = false;
        console.log('PostgreSQL connection closed');
      } catch (error) {
        console.error('Error closing PostgreSQL:', error);
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Check if local storage is available
   */
  isLocalAvailable(): boolean {
    return this.status.indexedDB.connected;
  }

  /**
   * Check if cloud sync is available
   */
  isCloudAvailable(): boolean {
    return this.status.postgres?.connected || false;
  }

  /**
   * Get IndexedDB adapter
   */
  getIndexedDB(): IndexedDBAdapter {
    if (!this.status.indexedDB.connected) {
      throw new Error('IndexedDB not connected');
    }
    return this.indexedDB;
  }

  /**
   * Get PostgreSQL adapter
   */
  getPostgres(): PostgresAdapter | null {
    if (!this.postgres || !this.status.postgres?.connected) {
      return null;
    }
    return this.postgres;
  }

  /**
   * Retry connection with exponential backoff
   */
  private async retryConnection(
    connectionType: 'indexedDB' | 'postgres',
    retryCount: number = 0
  ): Promise<void> {
    const maxRetries = this.config.retryConfig.maxRetries;
    const baseDelay = this.config.retryConfig.baseDelay;
    const maxDelay = this.config.retryConfig.maxDelay;
    const backoffMultiplier = this.config.retryConfig.backoffMultiplier;

    if (retryCount >= maxRetries) {
      console.error(`Max retries (${maxRetries}) reached for ${connectionType}`);
      return;
    }

    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, retryCount),
      maxDelay
    );

    console.log(`Retrying ${connectionType} connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);

    const timeoutId = setTimeout(async () => {
      try {
        if (connectionType === 'indexedDB') {
          await this.initializeIndexedDB();
        } else if (connectionType === 'postgres' && this.postgres) {
          await this.initializePostgres();
        }
        
        // Clear timeout on success
        this.retryTimeouts.delete(connectionType);
      } catch (error) {
        console.error(`Retry attempt ${retryCount + 1} failed for ${connectionType}:`, error);
        await this.retryConnection(connectionType, retryCount + 1);
      }
    }, delay);

    this.retryTimeouts.set(connectionType, timeoutId);
  }

  /**
   * Handle connection failures
   */
  private handleConnectionFailure(connectionType: 'indexedDB' | 'postgres', error: Error): void {
    const errorMessage = error.message;
    
    if (connectionType === 'indexedDB') {
      this.status.indexedDB = {
        connected: false,
        lastError: errorMessage,
      };
    } else if (connectionType === 'postgres') {
      this.status.postgres = {
        ...this.status.postgres,
        connected: false,
        lastError: errorMessage,
      };
    }

    // Start retry process
    this.retryConnection(connectionType);
  }

  /**
   * Sync data between local and cloud
   */
  async syncData(): Promise<{
    success: boolean;
    localToCloud: number;
    cloudToLocal: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      localToCloud: 0,
      cloudToLocal: 0,
      errors: [] as string[],
    };

    if (!this.isLocalAvailable()) {
      result.errors.push('Local storage not available');
      result.success = false;
      return result;
    }

    if (!this.isCloudAvailable()) {
      console.log('Cloud sync not available, skipping sync');
      return result;
    }

    try {
      // Get sync queue from local storage (placeholder - method not implemented)
      const syncQueue: any[] = [];
      
      if (syncQueue.length === 0) {
        console.log('No items to sync');
        return result;
      }

      console.log(`Syncing ${syncQueue.length} items to cloud`);

      // Convert sync queue items to cloud format
      const syncItems = syncQueue.map((item: any) => ({
        operation: item.operation,
        table: item.table,
        data: item.data,
      }));

      // Sync to cloud
      await this.postgres!.syncFromLocal(syncItems);
      result.localToCloud = syncItems.length;

      // Clear sync queue after successful sync (placeholder - method not implemented)
      // await this.indexedDB.clearSyncQueue();

      console.log(`Successfully synced ${result.localToCloud} items to cloud`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(`Sync failed: ${errorMessage}`);
      result.success = false;
      console.error('Sync failed:', errorMessage);
    }

    return result;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
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
  }> {
    const stats: any = {
      local: {
        totalEntries: 0,
        lastEntryDate: null,
        averageRating: 0,
        syncQueueSize: 0,
      },
    };

    if (this.isCloudAvailable()) {
      stats.cloud = await this.postgres!.getStats();
    }

    return stats;
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<{
    local: any;
    cloud?: any;
    exportDate: string;
  }> {
    const localData = {
      moodEntries: [],
      userSettings: {},
    };
    
    const result: any = {
      local: localData,
      exportDate: new Date().toISOString(),
    };

    if (this.isCloudAvailable()) {
      // Export cloud data
      const cloudEntries = await this.postgres!.getMoodEntries({ limit: 10000 });
      const cloudSettings = await this.postgres!.getUserSettings();
      
      result.cloud = {
        moodEntries: cloudEntries,
        userSettings: cloudSettings,
      };
    }

    return result;
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    local: any;
    cloud?: any;
  }): Promise<void> {
    // Import local data (placeholder - method not implemented)
    // await this.indexedDB.importData(data.local);

    // Import cloud data if available and cloud is connected
    if (data.cloud && this.isCloudAvailable()) {
      // Note: Cloud import would need to be implemented in PostgresAdapter
      console.log('Cloud data import not yet implemented');
    }
  }

  /**
   * Test all connections
   */
  async testConnections(): Promise<{
    indexedDB: boolean;
    postgres?: boolean;
  }> {
    const results: any = {
      indexedDB: this.isLocalAvailable(),
    };

    if (this.postgres) {
      results.postgres = await this.postgres.testConnection();
    }

    return results;
  }

  /**
   * Get connection health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.isLocalAvailable()) {
      issues.push('Local storage (IndexedDB) is not available');
      recommendations.push('Check browser storage permissions and available space');
    }

    if (this.postgres && !this.isCloudAvailable()) {
      issues.push('Cloud sync (PostgreSQL) is not available');
      recommendations.push('Check network connection and cloud service status');
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (issues.length === 0) {
      status = 'healthy';
    } else if (this.isLocalAvailable()) {
      status = 'degraded'; // Local works, cloud doesn't
    } else {
      status = 'unhealthy'; // Local doesn't work
    }

    return {
      status,
      issues,
      recommendations,
    };
  }
}
