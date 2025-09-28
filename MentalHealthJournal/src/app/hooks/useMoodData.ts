/**
 * Custom Hook for Mood Data Management
 * 
 * Uses API client for all data operations - no IndexedDB dependency.
 * 
 * @fileoverview Custom hook for mood data management
 * @author Mental Health Journal App
 * @version 1.0.0
 */

'use client'

import { useState, useEffect, useCallback } from 'react';
import { useMoodApiContext } from '@/app/contexts/MoodApiContext';
import { DataTransformService, CreateMoodEntryRequest, UpdateMoodEntryRequest, GetMoodEntriesParams } from '@/lib/mood-api';
import { MoodEntry } from '@/lib/mood-core/models';
import { getTodayLocal } from '@/lib/utils/dateUtils';

interface UseMoodDataOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

interface UseMoodDataReturn {
  // Data
  moodEntries: MoodEntry[];
  todayMood: MoodEntry | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // API connection status
  isOnline: boolean;
  lastSync: Date | null;
  
  // Actions
  createMoodEntry: (request: CreateMoodEntryRequest) => Promise<MoodEntry>;
  updateMoodEntry: (id: string, request: UpdateMoodEntryRequest) => Promise<MoodEntry>;
  deleteMoodEntry: (id: string) => Promise<void>;
  refreshMoodEntries: (params?: GetMoodEntriesParams) => Promise<void>;
  
  // Sync
  syncData: () => Promise<void>;
  clearError: () => void;
}

export function useMoodData(options: UseMoodDataOptions = {}): UseMoodDataReturn {
  const { autoSync = true, syncInterval = 300000 } = options;
  
  const { client } = useMoodApiContext();
  
  // State
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const userId = 'default-user'; // In a real app, this would come from auth
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);
  
  // Error handler
  const handleError = useCallback((err: any) => {
    console.error('Mood Data Error:', err);
    setError(err.message || 'An error occurred');
    setIsLoading(false);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Initialize - no database needed, just mark as ready
  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      setIsInitialized(true);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Load mood entries from API
  const refreshMoodEntries = useCallback(async (params?: GetMoodEntriesParams) => {
    if (!isInitialized) {
      console.warn('Not initialized yet, skipping data fetch');
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      
      // Always use API - no offline mode
      const entries = await client.getMoodEntries(params);
      setMoodEntries(entries);
      
      // Find today's mood
      const today = getTodayLocal();
      const todayEntry = entries.find(entry => entry.entryDate === today);
      setTodayMood(todayEntry || null);
      
      setLastSync(new Date());
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, client, handleError, clearError]);

  // Create mood entry
  const createMoodEntry = useCallback(async (request: CreateMoodEntryRequest): Promise<MoodEntry> => {
    try {
      setIsLoading(true);
      clearError();
      
      const newEntry = await client.createMoodEntry(request);
      
      // Refresh the list to include the new entry
      await refreshMoodEntries();
      
      return newEntry;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, refreshMoodEntries, handleError, clearError]);

  // Update mood entry
  const updateMoodEntry = useCallback(async (id: string, request: UpdateMoodEntryRequest): Promise<MoodEntry> => {
    try {
      setIsLoading(true);
      clearError();
      
      const updatedEntry = await client.updateMoodEntry(id, request);
      
      // Refresh the list to include the updated entry
      await refreshMoodEntries();
      
      return updatedEntry;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, refreshMoodEntries, handleError, clearError]);

  // Delete mood entry
  const deleteMoodEntry = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();
      
      await client.deleteMoodEntry(id);
      
      // Refresh the list to remove the deleted entry
      await refreshMoodEntries();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, refreshMoodEntries, handleError, clearError]);

  // Sync data (same as refresh for API-only mode)
  const syncData = useCallback(async () => {
    await refreshMoodEntries();
  }, [refreshMoodEntries]);

  // Initialize on mount
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // Load data when initialized
  useEffect(() => {
    if (isInitialized) {
      refreshMoodEntries();
    }
  }, [isInitialized, refreshMoodEntries]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && autoSync && isInitialized) {
      const interval = setInterval(() => {
        refreshMoodEntries();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [isOnline, autoSync, syncInterval, isInitialized, refreshMoodEntries]);

  return {
    moodEntries,
    todayMood,
    isLoading,
    isInitialized,
    error,
    isOnline,
    lastSync,
    createMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    refreshMoodEntries,
    syncData,
    clearError,
  };
}