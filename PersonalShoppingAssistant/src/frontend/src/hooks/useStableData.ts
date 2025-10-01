/**
 * Smart data management hook that prevents data disappearing
 * Maintains data stability while allowing necessary updates
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStableDataOptions {
  minDisplayTime?: number;
  debounceTime?: number;
  // preserveData?: boolean; // Keep data even when loading - currently unused
}

export function useStableData<T>(
  data: T | null,
  isLoading: boolean,
  options: UseStableDataOptions = {}
) {
  const { 
    minDisplayTime = 300, 
    debounceTime = 100
  } = options;
  
  const [stableData, setStableData] = useState<T | null>(data);
  const [stableLoading, setStableLoading] = useState(isLoading);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T | null>(data);
  const loadingStartTime = useRef<number | null>(null);

  const updateData = useCallback((newData: T | null, newLoading: boolean) => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
    }

    // Always update data when it changes (including null to allow initial loading)
    if (newData !== lastDataRef.current) {
      setStableData(newData);
      lastDataRef.current = newData;
      if (newData) {
        setIsInitialized(true);
      }
    }

    // Handle loading state - be more permissive for initial load
    if (newLoading) {
      loadingStartTime.current = Date.now();
      setStableLoading(true);
    } else {
      // Only debounce if we already have data (not initial load)
      if (isInitialized) {
        timeoutRef.current = setTimeout(() => {
          const elapsed = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
          const remainingTime = Math.max(0, minDisplayTime - elapsed);
          
          if (remainingTime > 0) {
            minTimeTimeoutRef.current = setTimeout(() => {
              setStableLoading(false);
            }, remainingTime);
          } else {
            setStableLoading(false);
          }
        }, debounceTime);
      } else {
        // For initial load, update immediately
        setStableLoading(false);
      }
    }
  }, [minDisplayTime, debounceTime, isInitialized]);

  useEffect(() => {
    updateData(data, isLoading);
  }, [data, isLoading, updateData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minTimeTimeoutRef.current) {
        clearTimeout(minTimeTimeoutRef.current);
      }
    };
  }, []);

  return {
    data: stableData,
    loading: stableLoading,
    isInitialized,
    hasData: !!stableData
  };
}
