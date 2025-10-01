/**
 * Ultra-simple data loading hook to prevent infinite loops
 * Based on web search recommendations for fixing unresponsive React apps
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useSimpleData<T>(
  apiCall: () => Promise<T>,
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 useSimpleData: Starting fetchData');
      setLoading(true);
      setError(null);
      
      console.log('🔄 useSimpleData: Calling API...');
      const result = await apiCall();
      console.log('✅ useSimpleData: API call successful', result);
      setData(result);
      hasLoadedRef.current = true;
    } catch (err: any) {
      console.error('❌ useSimpleData: API call failed', err);
      const errorMessage = err?.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      console.log('🔄 useSimpleData: Setting loading to false');
      setLoading(false);
    }
  }, [apiCall]);

  // Load data once on mount and when apiCall changes
  useEffect(() => {
    if (immediate && !hasLoadedRef.current) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}
