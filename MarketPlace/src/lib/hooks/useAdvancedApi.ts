import { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedApiClient } from '../api/client-advanced';
import { ApiResponse, RequestConfig } from '../api/types';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  lastUpdated: number | null;
}

export interface UseApiOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  retryOnError?: boolean;
  optimisticUpdates?: boolean;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
  reset: () => void;
  isStale: boolean;
  isOffline: boolean;
  retryCount: number;
}

export function useAdvancedApi<T>(
  apiClient: AdvancedApiClient,
  url: string,
  config?: Partial<RequestConfig>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime: _cacheTime = 10 * 60 * 1000, // 10 minutes
    retryOnError = true,
    optimisticUpdates = false,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
    lastUpdated: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const isStale = state.lastUpdated ? Date.now() - state.lastUpdated > staleTime : true;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) {return;}

    const now = Date.now();
    if (!force && state.lastUpdated && now - state.lastUpdated < staleTime) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    lastFetchRef.current = now;

    try {
      const response = await apiClient.get<T>(url, config);
      setState({
        data: response.data,
        loading: false,
        error: null,
        success: true,
        lastUpdated: now,
      });
      setRetryCount(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));

      if (retryOnError && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchData(true), 1000 * Math.pow(2, retryCount));
      }
    }
  }, [enabled, url, config, staleTime, retryCount, retryOnError, state.lastUpdated]);

  const mutate = useCallback((newData: T) => {
    if (optimisticUpdates) {
      setState(prev => ({
        ...prev,
        data: newData,
        lastUpdated: Date.now(),
      }));
    }
  }, [optimisticUpdates]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
      lastUpdated: null,
    });
    setRetryCount(0);
  }, []);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  useEffect(() => {
    if (refetchInterval) {
      intervalRef.current = setInterval(() => {
        if (isStale) {
          fetchData();
        }
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    
    return undefined;
  }, [refetchInterval, fetchData, isStale]);

  useEffect(() => {
    const handleFocus = () => {
      if (refetchOnWindowFocus && isStale) {
        fetchData();
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      if (isStale) {
        fetchData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetchOnWindowFocus, fetchData, isStale]);

  return {
    ...state,
    refetch,
    mutate,
    reset,
    isStale,
    isOffline,
    retryCount,
  };
}

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | undefined, error: Error | null, variables: V) => void;
  optimisticUpdate?: (variables: V) => T;
  rollbackOnError?: boolean;
}

export interface UseMutationReturn<T, V> {
  mutate: (variables: V) => Promise<T>;
  mutateAsync: (variables: V) => Promise<T>;
  data: T | null;
  error: string | null;
  loading: boolean;
  success: boolean;
  reset: () => void;
}

export function useAdvancedMutation<T, V>(
  _apiClient: AdvancedApiClient,
  mutationFn: (variables: V) => Promise<ApiResponse<T>>,
  options: UseMutationOptions<T, V> = {}
): UseMutationReturn<T, V> {
  const {
    onSuccess,
    onError,
    onSettled,
    optimisticUpdate,
    rollbackOnError = true,
  } = options;

  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
    success: boolean;
  }>({
    data: null,
    error: null,
    loading: false,
    success: false,
  });

  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (optimisticUpdate) {
      const optimistic = optimisticUpdate(variables);
      setOptimisticData(optimistic);
    }

    try {
      const response = await mutationFn(variables);
      const data = response.data;

      setState({
        data,
        error: null,
        loading: false,
        success: true,
      });
      setOptimisticData(null);

      onSuccess?.(data, variables);
      onSettled?.(data, null, variables);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        success: false,
      }));

      if (rollbackOnError) {
        setOptimisticData(null);
      }

      onError?.(error as Error, variables);
      onSettled?.(undefined, error as Error, variables);

      throw error;
    }
  }, [mutationFn, optimisticUpdate, onSuccess, onError, onSettled, rollbackOnError]);

  const mutateAsync = mutate;

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      success: false,
    });
    setOptimisticData(null);
  }, []);

  return {
    mutate,
    mutateAsync,
    data: optimisticData || state.data,
    error: state.error,
    loading: state.loading,
    success: state.success,
    reset,
  };
}
