/**
 * React Hook for Mood API Client
 * 
 * Provides React hooks for using the Mood API client with state management.
 * 
 * @fileoverview React hooks for API integration
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MoodApiClient, MoodApiClientConfig, CreateMoodEntryRequest, UpdateMoodEntryRequest, GetMoodEntriesParams, GetTrendsParams, SyncResult, ApiStats } from './MoodApiClient';
import { MoodEntry, User, MoodTrend } from '../../mood-core/models';

export interface UseMoodApiOptions {
  config: MoodApiClientConfig;
  autoSync?: boolean;
  syncInterval?: number;
}

export interface UseMoodApiReturn {
  // Client instance
  client: MoodApiClient;
  
  // State
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // Mood entries
  moodEntries: MoodEntry[];
  createMoodEntry: (request: CreateMoodEntryRequest) => Promise<MoodEntry>;
  updateMoodEntry: (id: string, request: UpdateMoodEntryRequest) => Promise<MoodEntry>;
  deleteMoodEntry: (id: string) => Promise<void>;
  refreshMoodEntries: (params?: GetMoodEntriesParams) => Promise<void>;
  
  // Trends
  moodTrends: MoodTrend[];
  getMoodTrends: (params: GetTrendsParams) => Promise<void>;
  
  // User
  user: User | null;
  updateUser: (user: Partial<User>) => Promise<User>;
  updateUserSettings: (settings: Partial<User>) => Promise<User>;
  
  // Sync
  syncData: () => Promise<SyncResult>;
  
  // Stats
  stats: ApiStats | null;
  refreshStats: () => Promise<void>;
  
  // Cache
  clearCache: () => void;
}

export function useMoodApi(options: UseMoodApiOptions): UseMoodApiReturn {
  const { config, autoSync = true, syncInterval = 300000 } = options; // 5 minutes default
  
  // Initialize API client
  const client = useMemo(() => new MoodApiClient(config), [config]);
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Data state
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [moodTrends, setMoodTrends] = useState<MoodTrend[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ApiStats | null>(null);
  
  // Error handler
  const handleError = useCallback((err: any) => {
    console.error('Mood API Error:', err);
    setError(err.message || 'An error occurred');
    setIsLoading(false);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Health check
  const checkConnection = useCallback(async () => {
    try {
      await client.healthCheck();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      handleError(err);
    }
  }, [client, handleError]);
  
  // Load mood entries
  const refreshMoodEntries = useCallback(async (params?: GetMoodEntriesParams) => {
    try {
      setIsLoading(true);
      clearError();
      const entries = await client.getMoodEntries(params);
      setMoodEntries(entries);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Create mood entry
  const createMoodEntry = useCallback(async (request: CreateMoodEntryRequest): Promise<MoodEntry> => {
    try {
      setIsLoading(true);
      clearError();
      const entry = await client.createMoodEntry(request);
      setMoodEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Update mood entry
  const updateMoodEntry = useCallback(async (id: string, request: UpdateMoodEntryRequest): Promise<MoodEntry> => {
    try {
      setIsLoading(true);
      clearError();
      const entry = await client.updateMoodEntry(id, request);
      setMoodEntries(prev => prev.map(e => e.id === id ? entry : e));
      return entry;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Delete mood entry
  const deleteMoodEntry = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();
      await client.deleteMoodEntry(id);
      setMoodEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Get mood trends
  const getMoodTrends = useCallback(async (params: GetTrendsParams) => {
    try {
      setIsLoading(true);
      clearError();
      const trends = await client.getMoodTrends(params);
      setMoodTrends(trends);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Update user
  const updateUser = useCallback(async (userData: Partial<User>): Promise<User> => {
    try {
      setIsLoading(true);
      clearError();
      const updatedUser = await client.updateUserProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Update user settings
  const updateUserSettings = useCallback(async (settings: Partial<User>): Promise<User> => {
    try {
      setIsLoading(true);
      clearError();
      const updatedUser = await client.updateUserSettings(settings);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError]);
  
  // Sync data
  const syncData = useCallback(async (): Promise<SyncResult> => {
    try {
      setIsLoading(true);
      clearError();
      const result = await client.syncData();
      setLastSync(new Date());
      
      // Refresh data after sync
      await Promise.all([
        refreshMoodEntries(),
        refreshStats(),
      ]);
      
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError, clearError, refreshMoodEntries]);
  
  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await client.getStats();
      setStats(statsData);
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, [client]);
  
  // Clear cache
  const clearCache = useCallback(() => {
    client.clearCache();
  }, [client]);
  
  // Initialize on mount
  useEffect(() => {
    checkConnection();
    refreshMoodEntries();
    refreshStats();
  }, [checkConnection, refreshMoodEntries, refreshStats]);
  
  // Auto-sync setup
  useEffect(() => {
    if (!autoSync) return;
    
    const interval = setInterval(() => {
      if (isConnected) {
        syncData().catch(console.warn);
      }
    }, syncInterval);
    
    return () => clearInterval(interval);
  }, [autoSync, syncInterval, isConnected, syncData]);
  
  return {
    client,
    isConnected,
    isLoading,
    error,
    lastSync,
    moodEntries,
    createMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    refreshMoodEntries,
    moodTrends,
    getMoodTrends,
    user,
    updateUser,
    updateUserSettings,
    syncData,
    stats,
    refreshStats,
    clearCache,
  };
}
