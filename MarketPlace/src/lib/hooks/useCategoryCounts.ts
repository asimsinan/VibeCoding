// Category Counts Hook
// React hook for fetching product counts by category

import { useState, useEffect, useCallback } from 'react';

interface CategoryCounts {
  [categoryName: string]: number;
}

interface CategoryCountsState {
  counts: CategoryCounts;
  isLoading: boolean;
  error: string | null;
  totalCategories: number;
}

export function useCategoryCounts(): CategoryCountsState & {
  fetchCounts: () => Promise<void>;
  getCountForCategory: (categoryName: string) => number;
} {
  const [state, setState] = useState<CategoryCountsState>({
    counts: {},
    isLoading: false,
    error: null,
    totalCategories: 0,
  });

  const fetchCounts = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/categories/counts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch category counts');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        counts: data.counts,
        totalCategories: data.totalCategories,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch category counts',
        isLoading: false,
      }));
    }
  }, []);

  const getCountForCategory = useCallback((categoryName: string): number => {
    return state.counts[categoryName] || 0;
  }, [state.counts]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    ...state,
    fetchCounts,
    getCountForCategory,
  };
}
