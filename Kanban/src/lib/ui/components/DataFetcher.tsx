/**
 * Data Fetcher Component
 * Wrapper component that handles loading, error, and success states for API data
 */

'use client';

import React, { ReactNode } from 'react';
import { LoadingSpinner, ApiError } from './LoadingSpinner';
import { errorUtils } from '../../api/queryClient';

interface DataFetcherProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: any;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  children: (data: T) => ReactNode;
  onRetry?: () => void;
  showEmptyState?: boolean;
  emptyCondition?: (data: T) => boolean;
}

export function DataFetcher<T>({
  data,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  onRetry,
  showEmptyState = true,
  emptyCondition = (data: T) => Array.isArray(data) ? data.length === 0 : !data,
}: DataFetcherProps<T>) {
  // Show loading state
  if (isLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        )}
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        {errorComponent || (
          <ApiError error={error} onRetry={onRetry} />
        )}
      </>
    );
  }

  // Show empty state
  if (showEmptyState && data && emptyCondition(data)) {
    return (
      <>
        {emptyComponent || (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no items to display at the moment.
            </p>
          </div>
        )}
      </>
    );
  }

  // Show data
  if (data) {
    return <>{children(data)}</>;
  }

  // Fallback
  return null;
}

// Hook for handling API state
export function useApiState<T>(
  data: T | undefined,
  isLoading: boolean,
  error: any,
  onRetry?: () => void
) {
  const getState = () => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (!data) return 'empty';
    return 'success';
  };

  const getErrorMessage = () => {
    if (!error) return null;
    return errorUtils.getErrorMessage(error);
  };

  const isNetworkError = () => {
    return errorUtils.isNetworkError(error);
  };

  const isAuthError = () => {
    return errorUtils.isAuthError(error);
  };

  return {
    state: getState(),
    errorMessage: getErrorMessage(),
    isNetworkError: isNetworkError(),
    isAuthError: isAuthError(),
    onRetry,
  };
}
