/**
 * Loading States Hook
 * TASK-022: API Data Flow Integration
 * 
 * Provides comprehensive loading state management for the application.
 */

import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  message: string;
  canCancel: boolean;
  onCancel?: () => void;
}

export interface LoadingStates {
  // Global loading states
  global: LoadingState;
  
  // Specific loading states
  products: LoadingState;
  recommendations: LoadingState;
  interactions: LoadingState;
  authentication: LoadingState;
  preferences: LoadingState;
  
  // Action loading states
  search: LoadingState;
  filter: LoadingState;
  compare: LoadingState;
  share: LoadingState;
}

const createLoadingState = (): LoadingState => ({
  isLoading: false,
  progress: 0,
  message: '',
  canCancel: false,
});

const createLoadingStates = (): LoadingStates => ({
  global: createLoadingState(),
  products: createLoadingState(),
  recommendations: createLoadingState(),
  interactions: createLoadingState(),
  authentication: createLoadingState(),
  preferences: createLoadingState(),
  search: createLoadingState(),
  filter: createLoadingState(),
  compare: createLoadingState(),
  share: createLoadingState(),
});

export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(createLoadingStates());
  const { state } = useApp();

  // Update loading state
  const setLoading = useCallback((
    key: keyof LoadingStates,
    updates: Partial<LoadingState>
  ) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates,
      },
    }));
  }, []);

  // Start loading
  const startLoading = useCallback((
    key: keyof LoadingStates,
    message: string = 'Loading...',
    canCancel: boolean = false,
    onCancel?: () => void
  ) => {
    setLoading(key, {
      isLoading: true,
      progress: 0,
      message,
      canCancel,
      onCancel,
    });
  }, [setLoading]);

  // Update progress
  const updateProgress = useCallback((
    key: keyof LoadingStates,
    progress: number,
    message?: string
  ) => {
    setLoading(key, {
      progress: Math.max(0, Math.min(100, progress)),
      ...(message && { message }),
    });
  }, [setLoading]);

  // Complete loading
  const completeLoading = useCallback((key: keyof LoadingStates) => {
    setLoading(key, {
      isLoading: false,
      progress: 100,
      message: 'Complete',
    });

    // Reset after a short delay
    setTimeout(() => {
      setLoading(key, createLoadingState());
    }, 1000);
  }, [setLoading]);

  // Cancel loading
  const cancelLoading = useCallback((key: keyof LoadingStates) => {
    const currentState = loadingStates[key];
    if (currentState.onCancel) {
      currentState.onCancel();
    }
    
    setLoading(key, {
      isLoading: false,
      progress: 0,
      message: 'Cancelled',
    });
  }, [loadingStates, setLoading]);

  // Set error state
  const setError = useCallback((
    key: keyof LoadingStates,
    message: string
  ) => {
    setLoading(key, {
      isLoading: false,
      progress: 0,
      message,
    });
  }, [setLoading]);

  // Check if any loading is active
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  // Get loading summary
  const getLoadingSummary = useCallback(() => {
    const activeLoadings = Object.entries(loadingStates)
      .filter(([, state]) => state.isLoading)
      .map(([key, state]) => ({ key, ...state }));

    return {
      count: activeLoadings.length,
      active: activeLoadings,
      isAnyLoading: activeLoadings.length > 0,
    };
  }, [loadingStates]);

  // Simulate progress for long-running operations
  const simulateProgress = useCallback((
    key: keyof LoadingStates,
    duration: number = 3000,
    message: string = 'Processing...'
  ) => {
    startLoading(key, message, true);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      updateProgress(key, progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        completeLoading(key);
      }
    }, duration / 10);
  }, [startLoading, updateProgress, completeLoading]);

  // Auto-sync with app context loading states
  useEffect(() => {
    setLoading('products', { isLoading: state.loading.products });
    setLoading('recommendations', { isLoading: state.loading.recommendations });
    setLoading('interactions', { isLoading: state.loading.interactions });
  }, [state.loading, setLoading]);

  return {
    loadingStates,
    setLoading,
    startLoading,
    updateProgress,
    completeLoading,
    cancelLoading,
    setError,
    isAnyLoading,
    getLoadingSummary,
    simulateProgress,
  };
};
