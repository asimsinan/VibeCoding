/**
 * Error Handler Component
 * Comprehensive error handling with retry logic and offline support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LoadingSpinner, ApiError } from './LoadingSpinner';

interface ErrorHandlerProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  className?: string;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = true,
  className = '',
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getErrorType = (error: any) => {
    if (isOffline) return 'offline';
    if (error?.statusCode === 0) return 'network';
    if (error?.statusCode === 401) return 'auth';
    if (error?.statusCode === 403) return 'permission';
    if (error?.statusCode === 404) return 'notFound';
    if (error?.statusCode >= 500) return 'server';
    return 'unknown';
  };

  const getErrorMessage = (error: any, errorType: string) => {
    switch (errorType) {
      case 'offline':
        return 'You are currently offline. Please check your internet connection and try again.';
      case 'network':
        return 'Network error - please check your connection and try again.';
      case 'auth':
        return 'Authentication required - please sign in to continue.';
      case 'permission':
        return 'You do not have permission to perform this action.';
      case 'notFound':
        return 'The requested resource was not found.';
      case 'server':
        return 'Server error - please try again later.';
      default:
        return error?.message || 'An unexpected error occurred.';
    }
  };

  const getRetryDelay = (retryCount: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, retryCount), 16000);
  };

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Add delay for exponential backoff
    const delay = getRetryDelay(retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error, errorType);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {errorType === 'offline' ? (
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {errorType === 'offline' ? 'Offline' : 'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
            {retryCount > 0 && (
              <p className="mt-1 text-xs text-red-600">
                Retry attempt {retryCount}
              </p>
            )}
          </div>
          <div className="mt-4 flex space-x-3">
            {showRetry && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || isOffline}
                className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Retrying...</span>
                  </div>
                ) : (
                  'Try Again'
                )}
              </button>
            )}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="bg-white text-red-800 text-sm font-medium px-3 py-1 rounded-md border border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Global error boundary for unhandled errors
export const GlobalErrorHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <ErrorHandler
            error={error}
            onRetry={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
            showDismiss={false}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
