import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function useApi<T>(endpoint: string): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('useApi fetching:', endpoint);
      const response = await apiClient.get<T>(endpoint);
      console.log('useApi response:', { endpoint, response });
      if (response.success) {
        // Handle different response structures
        if (response.data !== undefined) {
          setData(response.data);
        } else if ((response as any).campaigns !== undefined) {
          setData((response as any).campaigns);
        } else if ((response as any).user !== undefined) {
          setData((response as any).user);
        } else {
          // For other response structures, use the response itself
          setData(response as T);
        }
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('useApi error:', { endpoint, error: err });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return {
    data: data as T,
    loading,
    error,
    refetch: fetchData,
  };
}