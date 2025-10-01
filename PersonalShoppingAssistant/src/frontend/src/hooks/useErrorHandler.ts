/**
 * Error Handler Hook
 * TASK-022: API Data Flow Integration
 * 
 * Provides comprehensive error handling and user feedback for the application.
 */

import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export interface ErrorInfo {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  source: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible: boolean;
  autoDismiss?: number; // milliseconds
}

export interface ErrorState {
  errors: ErrorInfo[];
  isVisible: boolean;
  hasUnreadErrors: boolean;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    errors: [],
    isVisible: false,
    hasUnreadErrors: false,
  });
  
  const { state, setError: setAppError } = useApp();

  // Add error
  const addError = useCallback((
    type: ErrorInfo['type'],
    title: string,
    message: string,
    options: {
      details?: string;
      source?: string;
      action?: ErrorInfo['action'];
      dismissible?: boolean;
      autoDismiss?: number;
    } = {}
  ) => {
    const error: ErrorInfo = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      details: options.details,
      timestamp: new Date(),
      source: options.source || 'unknown',
      action: options.action,
      dismissible: options.dismissible !== false,
      autoDismiss: options.autoDismiss,
    };

    setErrorState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
      isVisible: true,
      hasUnreadErrors: true,
    }));

    // Auto-dismiss if specified
    if (options.autoDismiss) {
      setTimeout(() => {
        dismissError(error.id);
      }, options.autoDismiss);
    }

    // Update app context error state
    if (type === 'error') {
      setAppError('products', message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAppError]);

  // Add API error
  const addApiError = useCallback((
    error: any,
    source: string = 'api',
    context?: string
  ) => {
    const title = error.response?.status 
      ? `API Error ${error.response.status}`
      : 'Network Error';
    
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const details = error.response?.data?.details || error.stack;

    addError('error', title, message, {
      details,
      source: `${source}${context ? ` (${context})` : ''}`,
      dismissible: true,
      autoDismiss: 10000, // 10 seconds
    });
  }, [addError]);

  // Add validation error
  const addValidationError = useCallback((
    field: string,
    message: string,
    details?: string
  ) => {
    addError('warning', `Validation Error: ${field}`, message, {
      details,
      source: 'validation',
      dismissible: true,
      autoDismiss: 5000, // 5 seconds
    });
  }, [addError]);

  // Add network error
  const addNetworkError = useCallback((
    message: string = 'Network connection failed',
    details?: string
  ) => {
    addError('error', 'Network Error', message, {
      details,
      source: 'network',
      action: {
        label: 'Retry',
        handler: () => window.location.reload(),
      },
      dismissible: true,
    });
  }, [addError]);

  // Add offline error
  const addOfflineError = useCallback(() => {
    addError('warning', 'You are offline', 'Some features may not be available while offline', {
      source: 'network',
      dismissible: true,
      autoDismiss: 0, // Don't auto-dismiss
    });
  }, [addError]);

  // Dismiss error
  const dismissError = useCallback((errorId: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId),
      isVisible: prev.errors.length > 1,
    }));
  }, []);

  // Dismiss all errors
  const dismissAllErrors = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      errors: [],
      isVisible: false,
      hasUnreadErrors: false,
    }));
  }, []);

  // Clear errors by source
  const clearErrorsBySource = useCallback((source: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.source !== source),
      isVisible: prev.errors.length > 1,
    }));
  }, []);

  // Clear errors by type
  const clearErrorsByType = useCallback((type: ErrorInfo['type']) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.type !== type),
      isVisible: prev.errors.length > 1,
    }));
  }, []);

  // Toggle error visibility
  const toggleErrorVisibility = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isVisible: !prev.isVisible,
      hasUnreadErrors: false,
    }));
  }, []);

  // Get error summary
  const getErrorSummary = useCallback(() => {
    const errorsByType = errorState.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: errorState.errors.length,
      byType: errorsByType,
      hasErrors: errorState.errors.length > 0,
      hasUnread: errorState.hasUnreadErrors,
      isVisible: errorState.isVisible,
    };
  }, [errorState]);

  // Get errors by source
  const getErrorsBySource = useCallback((source: string) => {
    return errorState.errors.filter(error => error.source === source);
  }, [errorState.errors]);

  // Get errors by type
  const getErrorsByType = useCallback((type: ErrorInfo['type']) => {
    return errorState.errors.filter(error => error.type === type);
  }, [errorState.errors]);

  // Handle global errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      addError('error', 'JavaScript Error', event.message, {
        details: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
        source: 'javascript',
        dismissible: true,
        autoDismiss: 10000,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError('error', 'Unhandled Promise Rejection', event.reason?.message || 'Unknown error', {
        details: event.reason?.stack,
        source: 'promise',
        dismissible: true,
        autoDismiss: 10000,
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addError]);

  // Monitor app context errors
  useEffect(() => {
    if (state.errors.products) {
      addError('error', 'Product Error', state.errors.products, {
        source: 'products',
        dismissible: true,
      });
    }
    
    if (state.errors.recommendations) {
      addError('error', 'Recommendation Error', state.errors.recommendations, {
        source: 'recommendations',
        dismissible: true,
      });
    }
    
    if (state.errors.interactions) {
      addError('error', 'Interaction Error', state.errors.interactions, {
        source: 'interactions',
        dismissible: true,
      });
    }
  }, [state.errors, addError]);

  // Monitor offline status
  useEffect(() => {
    if (!state.isOnline) {
      addOfflineError();
    }
  }, [state.isOnline, addOfflineError]);

  return {
    errorState,
    addError,
    addApiError,
    addValidationError,
    addNetworkError,
    addOfflineError,
    dismissError,
    dismissAllErrors,
    clearErrorsBySource,
    clearErrorsByType,
    toggleErrorVisibility,
    getErrorSummary,
    getErrorsBySource,
    getErrorsByType,
  };
};
