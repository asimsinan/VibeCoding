/**
 * Error Handling Utilities
 * Standardized error handling and error types
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    // Ensure message is always a string
    const errorMessage = message || 'An unknown error occurred';
    super(errorMessage);
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    this.name = 'AppError';
    this.code = code || 'UNKNOWN_ERROR';
    this.statusCode = statusCode || 500;
    
    // Fix for TypeScript/React Native - ensure prototype chain is correct
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ProcessingError extends AppError {
  constructor(message: string = 'Processing failed') {
    super(message, 'PROCESSING_ERROR', 500);
    this.name = 'ProcessingError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class SanitizationError extends AppError {
  constructor(message: string = 'Input sanitization failed') {
    super(message, 'SANITIZATION_ERROR', 400);
    this.name = 'SanitizationError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    // Ensure message is a valid string
    const message = error.message || error.toString() || 'An unknown error occurred';
    return new AppError(message, 'UNKNOWN_ERROR', 500);
  }
  
  // Handle non-Error objects
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as any).message) || 'An unknown error occurred';
    return new AppError(message, 'UNKNOWN_ERROR', 500);
  }
  
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
};

/**
 * Enhanced error handling with logging
 */
export const handleErrorWithLogging = (
  error: unknown,
  context?: Record<string, any>,
  userId?: string,
  requestId?: string
): AppError => {
  const appError = handleError(error);
  
  // Import logger here to avoid circular dependencies
  const { logger } = require('./logger');
  logger.error(
    `Error handled: ${appError.message}`,
    error instanceof Error ? error : new Error(appError.message),
    {
      ...context,
      errorCode: appError.code,
      statusCode: appError.statusCode,
    },
    userId,
    requestId
  );

  return appError;
};

