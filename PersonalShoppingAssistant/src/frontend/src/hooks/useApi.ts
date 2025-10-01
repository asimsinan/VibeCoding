/**
 * API Hooks
 * TASK-020: API Client Setup - FR-001 through FR-007
 * 
 * This file provides React hooks for API integration with proper
 * loading state management, error handling, and caching.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiResponse } from '../api';

// API Hook Options
export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// API Hook State
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic API hook - SIMPLIFIED VERSION
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (isMountedRef.current) {
        if (response.success) {
          setData(response.data || null);
          options.onSuccess?.(response.data);
        } else {
          const errorMessage = response.error?.message || 'An error occurred';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('❌ useApi API call failed:', err);
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An unexpected error occurred';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, options]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, options.immediate]);

  return { data, loading, error, refetch };
}

// Hook for API calls with parameters - SIMPLIFIED VERSION
export function useApiWithParams<T, P>(
  apiCall: (params: P) => Promise<ApiResponse<T>>,
  params: P,
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    
    console.log('🔄 useApiWithParams: Effect triggered', { 
      params, 
      immediate: options.immediate,
      refetchTrigger 
    });
    
    const execute = async () => {
      if (!isSubscribed) return;
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
        });

        const response = await Promise.race([
          apiCall(params),
          timeoutPromise
        ]);
        
        if (isSubscribed && !controller.signal.aborted) {
          if (response.success) {
            setData(response.data || null);
            options.onSuccess?.(response.data);
          } else {
            const errorMessage = response.error?.message || 'An error occurred';
            setError(errorMessage);
            options.onError?.(errorMessage);
          }
        }
      } catch (err: any) {
        if (isSubscribed && !controller.signal.aborted) {
          if (err.name === 'AbortError') {
            return; // Request was aborted, don't update state
          }
          console.error('❌ useApiWithParams API call failed:', err);
          const errorMessage = err?.message || 'An unexpected error occurred';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      } finally {
        if (isSubscribed && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (options.immediate !== false) {
      execute();
    }

    return () => {
      isSubscribed = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [apiCall, params, options.immediate, refetchTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(async () => {
    setRefetchTrigger(prev => prev + 1);
    return Promise.resolve();
  }, []);

  return { data, loading, error, refetch };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<{ data: T[]; pagination: any }>>,
  initialPage: number = 1,
  initialLimit: number = 20,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [pagination, setPagination] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  const execute = useCallback(async (pageNum: number, resetData: boolean = false) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(pageNum, limit);

      if (isMountedRef.current) {
        if (response.success && response.data) {
          const newData = response.data.data || [];
          setData(prevData => resetData ? newData : [...prevData, ...newData]);
          setPagination(response.data.pagination);
          setHasMore(response.data.pagination?.hasMore || false);
          options.onSuccess?.(response.data);
        } else {
          const errorMessage = response.error?.message || 'An error occurred';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An unexpected error occurred';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, limit, options]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      return execute(nextPage, false);
    }
    return Promise.resolve();
  }, [page, hasMore, loading, execute]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    return execute(1, false);
  }, [execute]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    return execute(1, false);
  }, [execute]);

  useEffect(() => {
    if (options.immediate !== false) {
      execute(page, false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, options.immediate, page]);

  return {
    data,
    loading,
    error,
    pagination,
    hasMore,
    loadMore,
    reset,
    changeLimit,
    refetch: () => execute(page, true)
  };
}

// Hook for API mutations
export function useApiMutation<T, P>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const mutate = useCallback(async (params: P) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await mutationFn(params);

      if (isMountedRef.current) {
        if (response.success) {
          setData(response.data || null);
          options.onSuccess?.(response.data);
        } else {
          const errorMessage = response.error?.message || 'An error occurred';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An unexpected error occurred';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset
  };
}

// Hook for API polling
export function useApiPolling<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  interval: number = 5000,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (isMountedRef.current) {
        if (response.success) {
          setData(response.data || null);
          options.onSuccess?.(response.data);
        } else {
          const errorMessage = response.error?.message || 'An error occurred';
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An unexpected error occurred';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, options]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsPolling(true);
    execute(); // Execute immediately
    
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        execute();
      }
    }, interval);
  }, [execute, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [startPolling, stopPolling, options.immediate]);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch: execute
  };
}