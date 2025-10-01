/**
 * Simple hook that loads data once and allows manual refresh
 * Based on web search recommendations for load-once strategy
 */

import { useState, useEffect, useCallback } from 'react';

interface UseLoadOnceOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useLoadOnce<T>(
  apiCall: () => Promise<T>,
  options: UseLoadOnceOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load data once on mount if immediate is true
  useEffect(() => {
    if (immediate && !hasLoaded) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const result = await apiCall();
          setData(result);
          setHasLoaded(true);
          onSuccess?.(result);
        } catch (err: any) {
          const errorMessage = err?.message || 'An error occurred';
          setError(errorMessage);
          onError?.(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [immediate, hasLoaded, apiCall, onSuccess, onError]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      setData(result);
      setHasLoaded(true);
      onSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    hasLoaded
  };
}
