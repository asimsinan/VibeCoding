export interface SyncItem {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  version: number;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';
  lastSync?: number;
  conflictData?: any;
  error?: string;
}

export interface ConflictResolution {
  strategy: 'server' | 'client' | 'merge' | 'manual';
  mergeFunction?: (serverData: any, clientData: any) => any;
  manualResolver?: (conflict: SyncItem) => Promise<any>;
}

export interface SyncConfig {
  batchSize: number;
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: ConflictResolution;
  autoSync: boolean;
  syncOnConnect: boolean;
}

export interface SyncEvent {
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'item_synced';
  item?: SyncItem;
  error?: string;
  timestamp: number;
}

export class SyncManager {
  private syncQueue: Map<string, SyncItem> = new Map();
  private syncConfig: SyncConfig;
  private eventListeners: Map<string, (event: SyncEvent) => void> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  constructor(config: SyncConfig) {
    this.syncConfig = config;
    this.setupEventListeners();
    
    if (config.autoSync) {
      this.startAutoSync();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.syncConfig.syncOnConnect) {
        this.syncAll();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, this.syncConfig.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private emitEvent(event: SyncEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  addToSyncQueue(item: Omit<SyncItem, 'timestamp' | 'version' | 'status'>): void {
    const syncItem: SyncItem = {
      ...item,
      timestamp: Date.now(),
      version: 1,
      status: 'pending',
    };

    this.syncQueue.set(item.id, syncItem);
    this.emitEvent({
      type: 'item_synced',
      item: syncItem,
      timestamp: Date.now(),
    });
  }

  removeFromSyncQueue(id: string): void {
    this.syncQueue.delete(id);
  }

  async syncAll(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {return;}

    this.isSyncing = true;
    this.emitEvent({ type: 'sync_start', timestamp: Date.now() });

    try {
      const items = Array.from(this.syncQueue.values());
      const batches = this.createBatches(items, this.syncConfig.batchSize);

      for (const batch of batches) {
        await this.syncBatch(batch);
      }

      this.emitEvent({ type: 'sync_complete', timestamp: Date.now() });
    } catch (error) {
      this.emitEvent({
        type: 'sync_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      this.isSyncing = false;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async syncBatch(batch: SyncItem[]): Promise<void> {
    const promises = batch.map(item => this.syncItem(item));
    await Promise.allSettled(promises);
  }

  private async syncItem(item: SyncItem): Promise<void> {
    if (item.status === 'syncing' || item.status === 'synced') {return;}

    item.status = 'syncing';
    this.syncQueue.set(item.id, item);

    try {
      const result = await this.performSync(item);
      
      if (result.conflict) {
        await this.handleConflict(item, result.serverData);
      } else {
        item.status = 'synced';
        item.lastSync = Date.now();
        this.syncQueue.set(item.id, item);
      }
    } catch (error) {
      item.status = 'error';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.syncQueue.set(item.id, item);
    }
  }

  private async performSync(item: SyncItem): Promise<{ conflict: boolean; serverData?: any }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate conflict detection
    const hasConflict = Math.random() < 0.1; // 10% chance of conflict

    if (hasConflict) {
      return {
        conflict: true,
        serverData: { ...item.data, serverVersion: item.version + 1 },
      };
    }

    return { conflict: false };
  }

  private async handleConflict(item: SyncItem, serverData: any): Promise<void> {
    item.status = 'conflict';
    item.conflictData = serverData;
    this.syncQueue.set(item.id, item);

    this.emitEvent({
      type: 'conflict_detected',
      item,
      timestamp: Date.now(),
    });

    const resolution = this.syncConfig.conflictResolution;

    try {
      let resolvedData: any;

      switch (resolution.strategy) {
        case 'server':
          resolvedData = serverData;
          break;
        case 'client':
          resolvedData = item.data;
          break;
        case 'merge':
          if (resolution.mergeFunction) {
            resolvedData = resolution.mergeFunction(serverData, item.data);
          } else {
            resolvedData = this.defaultMerge(serverData, item.data);
          }
          break;
        case 'manual':
          if (resolution.manualResolver) {
            resolvedData = await resolution.manualResolver(item);
          } else {
            throw new Error('Manual resolver not provided');
          }
          break;
        default:
          throw new Error('Unknown conflict resolution strategy');
      }

      item.data = resolvedData;
      item.status = 'synced';
      item.lastSync = Date.now();
      item.version += 1;
      this.syncQueue.set(item.id, item);
    } catch (error) {
      item.status = 'error';
      item.error = error instanceof Error ? error.message : 'Conflict resolution failed';
      this.syncQueue.set(item.id, item);
    }
  }

  private defaultMerge(serverData: any, clientData: any): any {
    // Simple merge strategy - prefer client data for most fields
    return {
      ...serverData,
      ...clientData,
      lastModified: Date.now(),
    };
  }

  getSyncQueue(): SyncItem[] {
    return Array.from(this.syncQueue.values());
  }

  getPendingItems(): SyncItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'pending');
  }

  getConflictedItems(): SyncItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'conflict');
  }

  getErrorItems(): SyncItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'error');
  }

  addEventListener(eventType: string, listener: (event: SyncEvent) => void): void {
    this.eventListeners.set(eventType, listener);
  }

  removeEventListener(eventType: string): void {
    this.eventListeners.delete(eventType);
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...newConfig };
    
    if (newConfig.autoSync !== undefined) {
      if (newConfig.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  destroy(): void {
    this.stopAutoSync();
    this.syncQueue.clear();
    this.eventListeners.clear();
  }
}

export const createSyncManager = (config: SyncConfig): SyncManager => {
  return new SyncManager(config);
};
