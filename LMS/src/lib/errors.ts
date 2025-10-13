import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error (${service}): ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: any;

  private constructor() {
    this.logger = console; // In production, use a proper logger
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  public handleError(error: Error): NextResponse {
    // Log the error
    this.logError(error);

    // Handle specific error types
    if (error instanceof AppError) {
      return this.handleAppError(error);
    }

    if (error instanceof ZodError) {
      return this.handleValidationError(error);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return this.handlePrismaError(error);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return this.handlePrismaError(error);
    }

    // Handle unknown errors
    return this.handleUnknownError(error);
  }

  private handleAppError(error: AppError): NextResponse {
    const response = {
      error: error.code || 'APPLICATION_ERROR',
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  private handleValidationError(error: ZodError): NextResponse {
    const response = {
      error: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    };

    return NextResponse.json(response, { status: 400 });
  }

  private handlePrismaError(error: any): NextResponse {
    let statusCode = 500;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference';
        code = 'FOREIGN_KEY_CONSTRAINT';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid data provided';
        code = 'VALIDATION_ERROR';
        break;
      default:
        message = error.message || message;
    }

    const response = {
      error: code,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.meta,
        stack: error.stack 
      }),
    };

    return NextResponse.json(response, { status: statusCode });
  }

  private handleUnknownError(error: Error): NextResponse {
    const response = {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      }),
    };

    return NextResponse.json(response, { status: 500 });
  }

  private logError(error: Error): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        code: error.code,
        isOperational: error.isOperational,
        details: error.details,
      }),
    };

    this.logger.error(JSON.stringify(logData));
  }
}

// Global error handler
export const globalErrorHandler = (error: Error): NextResponse => {
  return ErrorHandler.getInstance().handleError(error);
};

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}

// Error boundary for React components
export class ErrorBoundary extends Error {
  constructor(message: string, componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
    this.stack = componentStack;
  }
}

// Validation error formatter
export function formatValidationErrors(errors: ZodError['errors']): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  errors.forEach(error => {
    const field = error.path.join('.');
    formatted[field] = error.message;
  });
  
  return formatted;
}

// Error response helpers
export const ErrorResponses = {
  unauthorized: (message: string = 'Authentication required') =>
    NextResponse.json(
      { error: 'UNAUTHORIZED', message },
      { status: 401 }
    ),
  
  forbidden: (message: string = 'Insufficient permissions') =>
    NextResponse.json(
      { error: 'FORBIDDEN', message },
      { status: 403 }
    ),
  
  notFound: (resource: string = 'Resource') =>
    NextResponse.json(
      { error: 'NOT_FOUND', message: `${resource} not found` },
      { status: 404 }
    ),
  
  conflict: (message: string, details?: any) =>
    NextResponse.json(
      { error: 'CONFLICT', message, ...(details && { details }) },
      { status: 409 }
    ),
  
  validationError: (message: string, details?: any) =>
    NextResponse.json(
      { error: 'VALIDATION_ERROR', message, ...(details && { details }) },
      { status: 400 }
    ),
  
  rateLimit: (message: string = 'Rate limit exceeded') =>
    NextResponse.json(
      { error: 'RATE_LIMIT', message },
      { status: 429 }
    ),
  
  internalError: (message: string = 'Internal server error') =>
    NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message },
      { status: 500 }
    ),
};

// Error monitoring and reporting
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorCounts: Map<string, number> = new Map();
  private errorThresholds: Map<string, number> = new Map();

  private constructor() {
    // Set default thresholds
    this.errorThresholds.set('VALIDATION_ERROR', 100);
    this.errorThresholds.set('DATABASE_ERROR', 50);
    this.errorThresholds.set('EXTERNAL_SERVICE_ERROR', 25);
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  public trackError(errorCode: string): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);

    // Check if threshold exceeded
    const threshold = this.errorThresholds.get(errorCode);
    if (threshold && count + 1 >= threshold) {
      this.alertThresholdExceeded(errorCode, count + 1, threshold);
    }
  }

  private alertThresholdExceeded(errorCode: string, count: number, threshold: number): void {
    console.warn(`🚨 Error threshold exceeded: ${errorCode} (${count}/${threshold})`);
    // In production, send alert to monitoring service
  }

  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  public resetCounts(): void {
    this.errorCounts.clear();
  }
}

// Export default error handler
export default ErrorHandler.getInstance();
