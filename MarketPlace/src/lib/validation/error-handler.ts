// API Error Handler
// Centralized error handling for API routes

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from '@/lib/middleware/api-middleware';

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
  version: string;
  code?: string;
}

export interface ApiSuccessResponse<T = any> {
  data?: T;
  message?: string;
  timestamp: string;
  version: string;
}

// Error types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_REQUEST = 'BAD_REQUEST',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Error messages
export const ErrorMessages = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.AUTHENTICATION_ERROR]: 'Authentication required',
  [ErrorCode.AUTHORIZATION_ERROR]: 'Not authorized to perform this action',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.CONFLICT]: 'Resource already exists',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.PAYMENT_ERROR]: 'Payment processing error',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
};

// HTTP status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Create error response
export function createErrorResponse(
  error: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: ErrorCode,
  details?: any,
  message?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    code,
  };

  return NextResponse.json(response, { status: statusCode });
}

// Create success response
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = HttpStatus.OK
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    data,
    message,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  return NextResponse.json(response, { status: statusCode });
}

// Handle Zod validation errors
export function handleValidationError(error: ZodError): NextResponse<ApiErrorResponse> {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return createErrorResponse(
    ErrorMessages[ErrorCode.VALIDATION_ERROR],
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR,
    details
  );
}

// Handle API errors
export function handleApiError(error: ApiError): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    error.message,
    error.statusCode,
    error.code as ErrorCode
  );
}

// Handle generic errors
export function handleGenericError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('[API Error]:', error);

  if (error instanceof ApiError) {
    return handleApiError(error);
  }

  if (error instanceof ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof Error) {
    return createErrorResponse(
      ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR],
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      undefined,
      error.message
    );
  }

  return createErrorResponse(
    ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR],
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_SERVER_ERROR
  );
}

// Specific error handlers
export function handleAuthenticationError(message: string = ErrorMessages[ErrorCode.AUTHENTICATION_ERROR]): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    HttpStatus.UNAUTHORIZED,
    ErrorCode.AUTHENTICATION_ERROR
  );
}

export function handleAuthorizationError(message: string = ErrorMessages[ErrorCode.AUTHORIZATION_ERROR]): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    HttpStatus.FORBIDDEN,
    ErrorCode.AUTHORIZATION_ERROR
  );
}

export function handleNotFoundError(resource: string = 'Resource'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    ErrorCode.NOT_FOUND
  );
}

export function handleConflictError(message: string = ErrorMessages[ErrorCode.CONFLICT]): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    HttpStatus.CONFLICT,
    ErrorCode.CONFLICT
  );
}

export function handleRateLimitError(): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED],
    HttpStatus.TOO_MANY_REQUESTS,
    ErrorCode.RATE_LIMIT_EXCEEDED
  );
}

export function handlePaymentError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    HttpStatus.BAD_REQUEST,
    ErrorCode.PAYMENT_ERROR
  );
}

export function handleDatabaseError(message: string = ErrorMessages[ErrorCode.DATABASE_ERROR]): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.DATABASE_ERROR
  );
}

// Method not allowed handler
export function handleMethodNotAllowed(allowedMethods: string[]): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    'Method not allowed',
    HttpStatus.METHOD_NOT_ALLOWED,
    undefined,
    { allowedMethods }
  );
}

// Async error wrapper
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error; // Re-throw to be handled by Next.js error boundary
    }
  };
}

// Request validation wrapper
export function withValidation<T>(
  schema: any,
  handler: (data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return handleValidationError(result.error);
      }

      return await handler(result.data);
    } catch (error) {
      return handleGenericError(error);
    }
  };
}

// Query validation wrapper
export function withQueryValidation<T>(
  schema: any,
  handler: (data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const params: Record<string, string> = {};

      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      const result = schema.safeParse(params);

      if (!result.success) {
        return handleValidationError(result.error);
      }

      return await handler(result.data);
    } catch (error) {
      return handleGenericError(error);
    }
  };
}

// Authentication wrapper
export function withAuth(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return handleAuthenticationError();
      }

      const _token = authHeader.substring(7);
      
      // In real implementation, verify JWT token
      // For now, extract user ID from token (mock)
      const userId = 'current-user-id';

      return await handler(request, userId);
    } catch (error) {
      return handleGenericError(error);
    }
  };
}

// Rate limiting wrapper
export function withRateLimit(
  _maxRequests: number = 100,
  _windowMs: number = 15 * 60 * 1000
) {
  return function<T extends any[], R>(
    handler: (...args: T) => Promise<R>
  ) {
    return async (...args: T): Promise<R> => {
      // In real implementation, check rate limit
      // For now, always allow
      return await handler(...args);
    };
  };
}

// Logging wrapper
export function withLogging<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      console.log(`[API] Handler completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`[API] Handler failed after ${duration}ms:`, error);
      
      throw error;
    }
  };
}
