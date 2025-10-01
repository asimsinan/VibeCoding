/**
 * Interaction Hooks
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file provides React hooks for interaction functionality
 * including recording interactions, analytics, and history.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { interactionService, Interaction, InteractionType, InteractionCreateData, InteractionStats } from '../api';
import { useApi, useApiWithParams, useApiMutation } from './useApi';

// Hook for user interactions with pagination
export function useUserInteractions(page: number = 1, limit: number = 20) {
  return useApi(() => interactionService.getUserInteractions(page, limit));
}

// Hook for interaction statistics
export function useInteractionStats() {
  return useApi(() => interactionService.getUserInteractionStats());
}

// Hook for user analytics
export function useUserAnalytics() {
  return useApi(() => interactionService.getUserAnalytics());
}

// Hook for recent interactions
export function useRecentInteractions(hours: number = 24) {
  return useApiWithParams(
    (hours: number) => interactionService.getRecentInteractions(hours),
    hours
  );
}

// Hook for interaction history for a specific product
export function useInteractionHistory(productId: number) {
  return useApiWithParams(
    (id: number) => interactionService.getInteractionHistory(id),
    productId,
    { immediate: !!productId }
  );
}

// Hook for recommendation history
export function useRecommendationHistory() {
  return useApi(() => interactionService.getRecommendationHistory());
}

// Hook for top products (Admin)
export function useTopProducts(limit: number = 10, timeRange: 'day' | 'week' | 'month' = 'week') {
  return useApiWithParams(
    (params: { limit: number; timeRange: 'day' | 'week' | 'month' }) => 
      interactionService.getTopProducts(params.limit, params.timeRange),
    { limit, timeRange }
  );
}

// Hook for recording interactions
export function useRecordInteraction() {
  return useApiMutation(interactionService.recordInteraction);
}

// Hook for updating interactions
export function useUpdateInteraction() {
  return useApiMutation((params: { interactionId: number; type: InteractionType; metadata?: Record<string, any> }) => 
    interactionService.updateInteraction(params.interactionId, params.type, params.metadata)
  );
}

// Hook for deleting interactions
export function useDeleteInteraction() {
  return useApiMutation(interactionService.deleteInteraction);
}

// Hook for specific interaction types
export function useRecordView() {
  return useApiMutation(interactionService.recordView);
}

export function useRecordLike() {
  return useApiMutation(interactionService.recordLike);
}

export function useRecordDislike() {
  return useApiMutation(interactionService.recordDislike);
}

export function useRecordPurchase() {
  return useApiMutation(interactionService.recordPurchase);
}

// Hook for interaction tracking with local state
export function useInteractionTracker() {
  const [trackedInteractions, setTrackedInteractions] = useState<Map<number, InteractionType[]>>(new Map());
  const [pendingInteractions, setPendingInteractions] = useState<InteractionCreateData[]>([]);

  const recordInteraction = useCallback(async (data: InteractionCreateData) => {
    // Add to pending interactions
    setPendingInteractions(prev => [...prev, data]);
    
    // Update local tracking
    setTrackedInteractions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.productId) || [];
      if (!existing.includes(data.type)) {
        newMap.set(data.productId, [...existing, data.type]);
      }
      return newMap;
    });

    try {
      await interactionService.recordInteraction(data);
      // Remove from pending on success
      setPendingInteractions(prev => prev.filter(i => i !== data));
    } catch (error) {
      console.error('Failed to record interaction:', error);
      // Keep in pending for retry
    }
  }, []);

  const hasInteracted = useCallback((productId: number, type?: InteractionType) => {
    const interactions = trackedInteractions.get(productId) || [];
    return type ? interactions.includes(type) : interactions.length > 0;
  }, [trackedInteractions]);

  const getInteractionTypes = useCallback((productId: number) => {
    return trackedInteractions.get(productId) || [];
  }, [trackedInteractions]);

  const clearTracking = useCallback(() => {
    setTrackedInteractions(new Map());
    setPendingInteractions([]);
  }, []);

  return {
    trackedInteractions,
    pendingInteractions,
    recordInteraction,
    hasInteracted,
    getInteractionTypes,
    clearTracking,
  };
}

// Hook for interaction analytics with real-time updates
export function useInteractionAnalytics() {
  const { data: stats, loading, error, refetch } = useInteractionStats();
  const [analytics, setAnalytics] = useState<InteractionStats | null>(null);

  useEffect(() => {
    if (stats) {
      setAnalytics(stats);
    }
  }, [stats]);

  const updateAnalytics = useCallback((newInteraction: Interaction) => {
    setAnalytics(prev => {
      if (!prev) return prev;

      const updated = { ...prev };
      updated.totalInteractions += 1;

      switch (newInteraction.type) {
        case 'view':
          updated.views += 1;
          break;
        case 'like':
          updated.likes += 1;
          break;
        case 'dislike':
          updated.dislikes += 1;
          break;
        case 'purchase':
          updated.purchases += 1;
          break;
      }

      // Recalculate conversion rate
      updated.conversionRate = updated.purchases / updated.totalInteractions;

      return updated;
    });
  }, []);

  const resetAnalytics = useCallback(() => {
    setAnalytics(null);
    refetch();
  }, [refetch]);

  return {
    analytics,
    loading,
    error,
    refetch,
    updateAnalytics,
    resetAnalytics,
  };
}

// Hook for interaction history with filtering
export function useInteractionHistoryWithFilter(productId?: number) {
  const [filter, setFilter] = useState<{
    type?: InteractionType;
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, loading, error, refetch } = useInteractionHistory(productId || 0);

  const filteredInteractions = useMemo(() => {
    return data?.interactions?.filter(interaction => {
      if (filter.type && interaction.type !== filter.type) return false;
      if (filter.startDate && new Date(interaction.timestamp) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(interaction.timestamp) > new Date(filter.endDate)) return false;
      return true;
    }) || [];
  }, [data?.interactions, filter.type, filter.startDate, filter.endDate]);

  const updateFilter = useCallback((newFilter: Partial<typeof filter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const getInteractionCount = useCallback((type: InteractionType) => {
    return filteredInteractions.filter(i => i.type === type).length;
  }, [filteredInteractions]);

  const getInteractionTimeline = useCallback(() => {
    return filteredInteractions
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(interaction => ({
        ...interaction,
        date: new Date(interaction.timestamp).toLocaleDateString(),
        time: new Date(interaction.timestamp).toLocaleTimeString(),
      }));
  }, [filteredInteractions]);

  return {
    interactions: filteredInteractions,
    loading,
    error,
    refetch,
    filter,
    updateFilter,
    clearFilter,
    getInteractionCount,
    getInteractionTimeline,
  };
}

// Hook for batch interaction recording
export function useBatchInteractionRecorder() {
  const [batch, setBatch] = useState<InteractionCreateData[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setBatch([]);
  }, []);

  const addToBatch = useCallback((interaction: InteractionCreateData) => {
    if (isRecording) {
      setBatch(prev => [...prev, interaction]);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const submitBatch = useCallback(async () => {
    if (batch.length === 0) return;

    try {
      await Promise.all(batch.map(interaction => interactionService.recordInteraction(interaction)));
      setBatch([]);
    } catch (error) {
      console.error('Failed to submit batch interactions:', error);
      throw error;
    }
  }, [batch]);

  const clearBatch = useCallback(() => {
    setBatch([]);
  }, []);

  return {
    batch,
    isRecording,
    startRecording,
    addToBatch,
    stopRecording,
    submitBatch,
    clearBatch,
    batchSize: batch.length,
  };
}
