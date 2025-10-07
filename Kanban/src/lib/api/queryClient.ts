/**
 * React Query Configuration
 * Centralized query client setup with caching and error handling
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default query options
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.statusCode >= 400 && error?.statusCode < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false, // Don't retry mutations by default
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  
  // Workspace queries
  workspaces: {
    all: ['workspaces'] as const,
    list: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.workspaces.all, 'members', id] as const,
  },
  
  // Board queries
  boards: {
    all: ['boards'] as const,
    list: (workspaceId: string) => [...queryKeys.boards.all, 'list', workspaceId] as const,
    detail: (id: string) => [...queryKeys.boards.all, 'detail', id] as const,
    columns: (id: string) => [...queryKeys.boards.all, 'columns', id] as const,
  },
  
  // Task queries
  tasks: {
    all: ['tasks'] as const,
    list: (boardId: string, filters?: any) => 
      [...queryKeys.tasks.all, 'list', boardId, filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    search: (query: string, boardId?: string) => 
      [...queryKeys.tasks.all, 'search', query, boardId] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
  },
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity
  invalidateEntity: (entity: string) => {
    queryClient.invalidateQueries({ queryKey: [entity] });
  },
  
  // Invalidate specific query
  invalidateQuery: (queryKey: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },
  
  // Set query data directly
  setQueryData: <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get query data
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
};

// Error handling utilities
export const errorUtils = {
  // Check if error is a network error
  isNetworkError: (error: any): boolean => {
    return error?.statusCode === 0 || error?.message?.includes('Network error');
  },
  
  // Check if error is an authentication error
  isAuthError: (error: any): boolean => {
    return error?.statusCode === 401 || error?.statusCode === 403;
  },
  
  // Check if error is a validation error
  isValidationError: (error: any): boolean => {
    return error?.statusCode === 400;
  },
  
  // Get user-friendly error message
  getErrorMessage: (error: any): string => {
    if (errorUtils.isNetworkError(error)) {
      return 'Network error - please check your connection';
    }
    if (errorUtils.isAuthError(error)) {
      return 'Authentication required - please sign in';
    }
    if (errorUtils.isValidationError(error)) {
      return error?.message || 'Invalid input - please check your data';
    }
    return error?.message || 'An unexpected error occurred';
  },
};
