/**
 * Recommendation Hooks
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file provides React hooks for recommendation functionality
 * including generating recommendations, analytics, and management.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { recommendationService, Recommendation, RecommendationAlgorithm, RecommendationParams } from '../api';
import { useApi, useApiWithParams, useApiMutation, useApiPolling } from './useApi';

// Hook for recommendations with parameters
export function useRecommendations(params: RecommendationParams = {}) {
  const apiCall = useCallback(
    (params: RecommendationParams) => recommendationService.getRecommendations(params),
    []
  );
  return useApiWithParams(apiCall, params);
}

// Hook for specific recommendation algorithms
export function useCollaborativeRecommendations(limit: number = 10) {
  const apiCall = useCallback(
    (limit: number) => recommendationService.getCollaborativeRecommendations(limit),
    []
  );
  return useApiWithParams(apiCall, limit);
}

export function useContentBasedRecommendations(limit: number = 10) {
  const apiCall = useCallback(
    (limit: number) => recommendationService.getContentBasedRecommendations(limit),
    []
  );
  return useApiWithParams(apiCall, limit);
}

export function useHybridRecommendations(limit: number = 10) {
  const apiCall = useCallback(
    (limit: number) => recommendationService.getHybridRecommendations(limit),
    []
  );
  return useApiWithParams(apiCall, limit);
}

export function usePopularityRecommendations(limit: number = 10) {
  const apiCall = useCallback(
    (limit: number) => recommendationService.getPopularityRecommendations(limit),
    []
  );
  return useApiWithParams(apiCall, limit);
}

// Hook for recommendation score
export function useRecommendationScore(productId: number) {
  return useApiWithParams(
    (id: number) => recommendationService.getRecommendationScore(id),
    productId,
    { immediate: !!productId }
  );
}

// Hook for recommendation statistics
export function useRecommendationStats() {
  return useApi(() => recommendationService.getRecommendationStats());
}

// Hook for refreshing recommendations
export function useRefreshRecommendations() {
  return useApiMutation(() => recommendationService.refreshRecommendations());
}

// Hook for recommendation comparison
export function useRecommendationComparison(limit: number = 5) {
  const [comparison, setComparison] = useState<{
    collaborative: Recommendation[];
    contentBased: Recommendation[];
    hybrid: Recommendation[];
    popularity: Recommendation[];
  }>({
    collaborative: [],
    contentBased: [],
    hybrid: [],
    popularity: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getRecommendationComparison(limit);
      setComparison(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendation comparison');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return {
    comparison,
    loading,
    error,
    refetch: fetchComparison,
  };
}

// Hook for recommendation explanation
export function useRecommendationExplanation(productId: number) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getRecommendationExplanation(productId);
      setExplanation(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendation explanation');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);

  return {
    explanation,
    loading,
    error,
    refetch: fetchExplanation,
  };
}

// Hook for recommendation freshness
export function useRecommendationFreshness() {
  const [isFresh, setIsFresh] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFreshness = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.areRecommendationsFresh();
      setIsFresh(result);
    } catch (err: any) {
      setError(err.message || 'Failed to check recommendation freshness');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkFreshness();
  }, [checkFreshness]);

  return {
    isFresh,
    loading,
    error,
    refetch: checkFreshness,
  };
}

// Hook for recommendation quality metrics
export function useRecommendationQuality() {
  const [quality, setQuality] = useState<{
    averageScore: number;
    highConfidenceCount: number;
    totalCount: number;
    algorithmDistribution: Record<string, number>;
  }>({
    averageScore: 0,
    highConfidenceCount: 0,
    totalCount: 0,
    algorithmDistribution: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuality = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getRecommendationQuality();
      setQuality(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendation quality');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuality();
  }, [fetchQuality]);

  return {
    quality,
    loading,
    error,
    refetch: fetchQuality,
  };
}

// Hook for recommendation polling (real-time updates)
export function useRecommendationPolling(interval: number = 30000) {
  return useApiPolling(
    () => recommendationService.getRecommendations(),
    interval
  );
}

// Hook for recommendation management
export function useRecommendationManager() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<RecommendationAlgorithm>('content_based');
  const [limit, setLimit] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const { data, loading, error, refetch } = useRecommendations({
    algorithm: selectedAlgorithm,
    limit
  });

  const { mutate: refreshRecommendations, loading: refreshing } = useRefreshRecommendations();

  const handleAlgorithmChange = useCallback((algorithm: RecommendationAlgorithm) => {
    setSelectedAlgorithm(algorithm);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshRecommendations({});
      refetch();
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    }
  }, [refreshRecommendations, refetch]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const handleRefreshIntervalChange = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, handleRefresh]);

  return {
    selectedAlgorithm,
    limit,
    autoRefresh,
    refreshInterval,
    data,
    loading: loading || refreshing,
    error,
    refetch: handleRefresh,
    handleAlgorithmChange,
    handleLimitChange,
    toggleAutoRefresh,
    handleRefreshIntervalChange,
  };
}

// Hook for recommendation filtering and sorting
export function useRecommendationFilter() {
  const [filter, setFilter] = useState<{
    algorithm?: RecommendationAlgorithm;
    minScore?: number;
    maxScore?: number;
    confidence?: 'high' | 'medium' | 'low';
    sortBy?: 'score' | 'confidence' | 'algorithm';
    sortOrder?: 'asc' | 'desc';
  }>({});

  const { data, loading, error, refetch } = useRecommendations({
    algorithm: filter.algorithm,
    limit: 50 // Get more to filter client-side
  });

  const filteredRecommendations = useMemo(() => {
    return data?.recommendations?.filter(rec => {
      if (filter.minScore !== undefined && rec.score < filter.minScore) return false;
      if (filter.maxScore !== undefined && rec.score > filter.maxScore) return false;
      if (filter.confidence && rec.confidence !== filter.confidence) return false;
      return true;
    }).sort((a, b) => {
      if (!filter.sortBy) return 0;

      let aValue: any, bValue: any;

      switch (filter.sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'confidence':
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          aValue = confidenceOrder[a.confidence];
          bValue = confidenceOrder[b.confidence];
          break;
        case 'algorithm':
          aValue = a.algorithm;
          bValue = b.algorithm;
          break;
        default:
          return 0;
      }

      if (filter.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    }) || [];
  }, [data?.recommendations, filter.minScore, filter.maxScore, filter.confidence, filter.sortBy, filter.sortOrder]);

  const updateFilter = useCallback((newFilter: Partial<typeof filter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const getRecommendationCount = useCallback((algorithm: RecommendationAlgorithm) => {
    return filteredRecommendations.filter(rec => rec.algorithm === algorithm).length;
  }, [filteredRecommendations]);

  const getConfidenceCount = useCallback((confidence: 'high' | 'medium' | 'low') => {
    return filteredRecommendations.filter(rec => rec.confidence === confidence).length;
  }, [filteredRecommendations]);

  return {
    filter,
    recommendations: filteredRecommendations,
    loading,
    error,
    refetch,
    updateFilter,
    clearFilter,
    getRecommendationCount,
    getConfidenceCount,
  };
}
