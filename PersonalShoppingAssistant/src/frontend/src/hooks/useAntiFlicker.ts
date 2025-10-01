/**
 * Aggressive anti-flickering hook
 * Prevents any rapid state changes that could cause flickering
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAntiFlickerOptions {
  minDisplayTime?: number;
  debounceTime?: number;
  maxChangesPerSecond?: number;
}

export function useAntiFlicker<T>(
  value: T,
  options: UseAntiFlickerOptions = {}
) {
  const { 
    minDisplayTime = 500, 
    debounceTime = 100,
    maxChangesPerSecond = 2
  } = options;
  
  const [stableValue, setStableValue] = useState(value);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastChangeTime = useRef<number>(0);
  const changeCount = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<T>(value);

  const updateValue = useCallback((newValue: T) => {
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTime.current;
    
    // Reset change count if enough time has passed
    if (timeSinceLastChange > 1000) {
      changeCount.current = 0;
    }
    
    // Rate limiting: prevent too many changes per second
    if (changeCount.current >= maxChangesPerSecond && timeSinceLastChange < 1000) {
      return; // Skip this change
    }
    
    changeCount.current++;
    lastChangeTime.current = now;
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
    }
    
    // Debounce the change
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(true);
      
      // Ensure minimum display time
      const elapsed = now - lastChangeTime.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      if (remainingTime > 0) {
        minTimeTimeoutRef.current = setTimeout(() => {
          setStableValue(newValue);
          lastValueRef.current = newValue;
          setIsTransitioning(false);
        }, remainingTime);
      } else {
        setStableValue(newValue);
        lastValueRef.current = newValue;
        setIsTransitioning(false);
      }
    }, debounceTime);
  }, [minDisplayTime, debounceTime, maxChangesPerSecond]);

  useEffect(() => {
    if (value !== lastValueRef.current) {
      updateValue(value);
    }
  }, [value, updateValue]);

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
    value: stableValue,
    isTransitioning,
    isStable: !isTransitioning
  };
}
