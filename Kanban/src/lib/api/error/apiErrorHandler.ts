/**
 * API Error Handler - Centralized error handling and formatting
 * FR-001: API-First Design - Error handling implementation
 */

import {
  ApiError,
  ValidationError,
  NetworkError,
  TimeoutError,
  ErrorResponse,
  ValidationErrorResponse,
  isApiError,
  isValidationError,
  isNetworkError,
  isTimeoutError,
} from '../../../contracts/types/api.types';

export interface ErrorHandlerConfig {
  logErrors: boolean;
  showUserFriendlyMessages: boolean;
  retryableErrors: number[];
  maxRetries: number;
}

export class ApiErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      logErrors: true,
      showUserFriendlyMessages: true,
      retryableErrors: [408, 429, 500, 502, 503, 504],
      maxRetries: 3,
      ...config,
    };
  }

  public handleError(error: unknown): Error {
    if (isApiError(error)) {
      return this.handleApiError(error);
    }

    if (isValidationError(error)) {
      return this.handleValidationError(error);
    }

    if (isNetworkError(error)) {
      return this.handleNetworkError(error);
    }

    if (isTimeoutError(error)) {
      return this.handleTimeoutError(error);
    }

    return this.handleUnknownError(error);
  }

  private handleApiError(error: ApiError): Error {
    if (this.config.logErrors) {
      console.error('API Error:', {
        status: error.status,
        message: error.message,
      });
    }

    // Check if error is retryable
    if (this.config.retryableErrors.includes(error.status)) {
      return new RetryableError(error.message, error.status, error);
    }

    // Return user-friendly message if enabled
    if (this.config.showUserFriendlyMessages) {
      const userMessage = this.getUserFriendlyMessage(error.status, error.error);
      return new ApiError(error.status, error.error, userMessage, error.details);
    }

    return error;
  }

  private handleValidationError(error: ValidationError): Error {
    if (this.config.logErrors) {
      console.error('Validation Error:', {
        details: error.details,
        message: error.message,
      });
    }

    return error;
  }

  private handleNetworkError(error: NetworkError): Error {
    if (this.config.logErrors) {
      console.error('Network Error:', error.message);
    }

    return new RetryableError(error.message, 0, error);
  }

  private handleTimeoutError(error: TimeoutError): Error {
    if (this.config.logErrors) {
      console.error('Timeout Error:', error.message);
    }

    return new RetryableError(error.message, 408, error);
  }

  private handleUnknownError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (this.config.logErrors) {
      console.error('Unknown Error:', error);
    }

    return new Error(message);
  }

  private getUserFriendlyMessage(status: number, code: string): string {
    const messages: Record<string, string> = {
      'UNAUTHORIZED': 'Please log in to continue',
      'FORBIDDEN': 'You do not have permission to perform this action',
      'NOT_FOUND': 'The requested resource was not found',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again',
      'SERVER_ERROR': 'Something went wrong. Please try again later',
      'NETWORK_ERROR': 'Please check your internet connection and try again',
    };

    return messages[code] || `Error ${status}: ${this.getDefaultMessage(status)}`;
  }

  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      408: 'Request Timeout',
      409: 'Conflict',
      422: 'Validation Error',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return messages[status] || 'Unknown Error';
  }

  public isRetryable(error: Error): boolean {
    return error instanceof RetryableError;
  }

  public shouldRetry(error: Error, attempt: number): boolean {
    if (!this.isRetryable(error)) {
      return false;
    }

    if (attempt >= this.config.maxRetries) {
      return false;
    }

    const retryableError = error as RetryableError;
    return this.config.retryableErrors.includes(retryableError.status);
  }

  public getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const jitter = Math.random() * 1000; // 0-1 second jitter
    
    const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);
    return Math.floor(delay);
  }

  public formatErrorForUser(error: Error): string {
    if (isApiError(error)) {
      return this.getUserFriendlyMessage(error.status, error.error);
    }

    if (isValidationError(error)) {
      return 'Please check your input and try again';
    }

    if (isNetworkError(error)) {
      return 'Please check your internet connection and try again';
    }

    if (isTimeoutError(error)) {
      return 'Request timed out. Please try again';
    }

    return 'Something went wrong. Please try again';
  }

  public formatErrorForLogging(error: Error): Record<string, any> {
    const baseLog = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    if (isApiError(error)) {
      return {
        ...baseLog,
        type: 'API_ERROR',
        status: error.status,
        error: error.error,
        message: error.message,
      };
    }

    if (isValidationError(error)) {
      return {
        ...baseLog,
        type: 'VALIDATION_ERROR',
        details: error.details,
      };
    }

    if (isNetworkError(error)) {
      return {
        ...baseLog,
        type: 'NETWORK_ERROR',
      };
    }

    if (isTimeoutError(error)) {
      return {
        ...baseLog,
        type: 'TIMEOUT_ERROR',
      };
    }

    return {
      ...baseLog,
      type: 'UNKNOWN_ERROR',
    };
  }
}

// Retryable error class
export class RetryableError extends Error {
  constructor(
    message: string,
    public status: number,
    public originalError: Error
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

// Global error handler instance
let globalErrorHandler: ApiErrorHandler | null = null;

export function getErrorHandler(): ApiErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ApiErrorHandler();
  }
  return globalErrorHandler;
}

export function setErrorHandler(handler: ApiErrorHandler): void {
  globalErrorHandler = handler;
}

// Error boundary utilities
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: any) => {
    const handler = getErrorHandler();
    const logData = handler.formatErrorForLogging(error);
    
    console.error('Error Boundary Caught Error:', {
      ...logData,
      errorInfo,
    });

    // You could send this to an error reporting service here
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  };
}

// Retry utility
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  const handler = getErrorHandler();
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (!handler.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = handler.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
