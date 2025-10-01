/**
 * Real-time Service
 * TASK-022: API Data Flow Integration
 * 
 * Handles real-time updates, data synchronization, and background refresh
 * for the application.
 */

import { useApp } from '../contexts/AppContext';

export interface RealtimeConfig {
  refreshInterval: number; // in milliseconds
  enableBackgroundRefresh: boolean;
  enableOfflineSync: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

export class RealtimeService {
  private config: RealtimeConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isActive = false;
  private retryCount = 0;
  private appContext: ReturnType<typeof useApp> | null = null;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      enableBackgroundRefresh: true,
      enableOfflineSync: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      ...config,
    };
  }

  // Initialize the service with app context
  initialize(appContext: ReturnType<typeof useApp>) {
    this.appContext = appContext;
    this.start();
  }

  // Start real-time updates
  start() {
    if (this.isActive || !this.appContext) return;

    this.isActive = true;
    this.retryCount = 0;

    // Start periodic refresh
    if (this.config.enableBackgroundRefresh) {
      this.startRefreshTimer();
    }

    // Listen for visibility changes
    this.setupVisibilityListener();
    
    // Listen for online/offline events
    this.setupNetworkListener();
  }

  // Stop real-time updates
  stop() {
    this.isActive = false;
    this.clearRefreshTimer();
  }

  // Start refresh timer
  private startRefreshTimer() {
    this.clearRefreshTimer();
    this.refreshTimer = setInterval(() => {
      this.refreshData();
    }, this.config.refreshInterval);
  }

  // Clear refresh timer
  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Refresh all data
  private async refreshData() {
    if (!this.appContext || !this.appContext.state.isOnline) return;

    try {
      await Promise.all([
        this.refreshProducts(),
        this.refreshRecommendations(),
      ]);
      
      this.retryCount = 0;
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.handleRefreshError();
    }
  }

  // Refresh products
  private async refreshProducts() {
    if (!this.appContext) return;

    try {
      // This would typically call the API to get updated products
      // For now, we'll just update the last refresh time
      this.appContext.dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    } catch (error) {
      console.error('Error refreshing products:', error);
      throw error;
    }
  }

  // Refresh recommendations
  private async refreshRecommendations() {
    if (!this.appContext) return;

    try {
      // This would typically call the API to get updated recommendations
      // For now, we'll just update the last refresh time
      this.appContext.dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      throw error;
    }
  }

  // Handle refresh errors
  private handleRefreshError() {
    this.retryCount++;
    
    if (this.retryCount < this.config.maxRetries) {
      setTimeout(() => {
        this.refreshData();
      }, this.config.retryDelay);
    } else {
      console.error('Max retries reached for data refresh');
      this.appContext?.setError('products', 'Failed to refresh data');
    }
  }

  // Setup visibility change listener
  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        // Refresh data when user returns to the tab
        this.refreshData();
      }
    });
  }

  // Setup network status listener
  private setupNetworkListener() {
    window.addEventListener('online', () => {
      if (this.appContext) {
        this.appContext.dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
        // Refresh data when coming back online
        this.refreshData();
      }
    });

    window.addEventListener('offline', () => {
      if (this.appContext) {
        this.appContext.dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
      }
    });
  }

  // Force refresh all data
  async forceRefresh() {
    if (!this.appContext) return;

    this.appContext.setLoading('products', true);
    this.appContext.setLoading('recommendations', true);

    try {
      await this.refreshData();
    } finally {
      this.appContext.setLoading('products', false);
      this.appContext.setLoading('recommendations', false);
    }
  }

  // Get service status
  getStatus() {
    return {
      isActive: this.isActive,
      isOnline: this.appContext?.state.isOnline ?? false,
      lastUpdate: this.appContext?.state.lastUpdate ?? null,
      retryCount: this.retryCount,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<RealtimeConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isActive && this.config.enableBackgroundRefresh) {
      this.startRefreshTimer();
    } else if (!this.config.enableBackgroundRefresh) {
      this.clearRefreshTimer();
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// Hook to use the realtime service
export const useRealtime = () => {
  return realtimeService;
};
