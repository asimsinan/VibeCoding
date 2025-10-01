/**
 * Custom hook to prevent flickering by ensuring minimum loading time
 * Based on web search recommendations for preventing flickering spinners
 */

import { useState, useEffect, useRef } from 'react';

interface UseStableLoadingOptions {
  minLoadingTime?: number; // Minimum time to show loading (ms)
  debounceTime?: number; // Debounce time for rapid changes (ms)
}

export function useStableLoading(
  isLoading: boolean,
  options: UseStableLoadingOptions = {}
) {
  const { minLoadingTime = 500, debounceTime = 100 } = options;
  const [stableLoading, setStableLoading] = useState(isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
    }

    if (isLoading) {
      // Start loading
      loadingStartTime.current = Date.now();
      setIsTransitioning(true);
      
      // Debounce the loading state change
      timeoutRef.current = setTimeout(() => {
        setStableLoading(true);
        setIsTransitioning(false);
      }, debounceTime);
    } else {
      // Stop loading - but ensure minimum time has passed
      const elapsed = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      if (remainingTime > 0) {
        minTimeTimeoutRef.current = setTimeout(() => {
          setStableLoading(false);
          setIsTransitioning(false);
        }, remainingTime);
      } else {
        setStableLoading(false);
        setIsTransitioning(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minTimeTimeoutRef.current) {
        clearTimeout(minTimeTimeoutRef.current);
      }
    };
  }, [isLoading, minLoadingTime, debounceTime]);

  return {
    isLoading: stableLoading,
    isTransitioning,
    isStable: !isTransitioning
  };
}
