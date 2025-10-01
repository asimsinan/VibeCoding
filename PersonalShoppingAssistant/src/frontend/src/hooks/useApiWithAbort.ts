/**
 * Enhanced API hook with AbortController to prevent race conditions
 * Prevents data disappearing by canceling previous requests
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '../api';

interface UseApiWithAbortOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApiWithAbort<T>(
  apiCall: (signal?: AbortSignal) => Promise<ApiResponse<T>>,
  options: UseApiWithAbortOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(controller.signal);

      if (isMountedRef.current && !controller.signal.aborted) {
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
      if (isMountedRef.current && !controller.signal.aborted) {
        if (err.name === 'AbortError') {
          // Request was aborted, don't update state
          return;
        }
        const errorMessage = err?.message || 'An unexpected error occurred';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, options.immediate]);

  return { data, loading, error, refetch };
}
