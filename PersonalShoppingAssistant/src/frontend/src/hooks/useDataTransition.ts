/**
 * Custom hook to maintain previous state during transitions
 * Prevents flickering by keeping previous data until new data is ready
 */

import { useState, useEffect, useRef } from 'react';

interface UseDataTransitionOptions {
  keepPreviousData?: boolean;
  transitionDelay?: number;
}

export function useDataTransition<T>(
  newData: T | null,
  isLoading: boolean,
  options: UseDataTransitionOptions = {}
) {
  const { keepPreviousData = true, transitionDelay = 0 } = options;
  const [data, setData] = useState<T | null>(newData);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousDataRef = useRef<T | null>(newData);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If we're loading and have previous data, keep it
    if (isLoading && keepPreviousData && previousDataRef.current) {
      setIsTransitioning(true);
      return;
    }

    // If we have new data and not loading, update after delay
    if (newData && !isLoading) {
      if (transitionDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          setData(newData);
          previousDataRef.current = newData;
          setIsTransitioning(false);
        }, transitionDelay);
      } else {
        setData(newData);
        previousDataRef.current = newData;
        setIsTransitioning(false);
      }
    } else if (!isLoading && !newData) {
      // If no data and not loading, clear data
      setData(null);
      previousDataRef.current = null;
      setIsTransitioning(false);
    } else if (isLoading && !previousDataRef.current) {
      // If loading and no previous data, show loading state
      setIsTransitioning(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [newData, isLoading, keepPreviousData, transitionDelay]);

  return {
    data,
    isTransitioning,
    hasPreviousData: !!previousDataRef.current
  };
}
