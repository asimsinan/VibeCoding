// Error Handling Middleware
// Centralized error handling for API routes

import { NextRequest, NextResponse } from 'next/server';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

export class AuthorizationError extends Error implements ApiError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}

export class RateLimitError extends Error implements ApiError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
  }
}

export class InternalServerError extends Error implements ApiError {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
  }
}

class ErrorHandler {
  private isDevelopment = process.env.NODE_ENV === 'development';

  handle(error: Error | ApiError, request?: NextRequest): NextResponse {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      url: request?.url,
      method: request?.method,
      timestamp: new Date().toISOString()
    });

    // Handle known API errors
    if ('statusCode' in error && 'code' in error) {
      return this.handleApiError(error as ApiError);
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      return this.handlePrismaError(error as any);
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      return this.handleValidationError(error as any);
    }

    // Handle unknown errors
    return this.handleUnknownError(error);
  }

  private handleApiError(error: ApiError): NextResponse {
    const response: any = {
      success: false,
      error: error.message,
      code: error.code
    };

    if (error.details) {
      response.details = error.details;
    }

    if (this.isDevelopment) {
      response.stack = error.stack;
    }

    return NextResponse.json(response, { status: error.statusCode || 500 });
  }

  private handlePrismaError(error: any): NextResponse {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: 'Resource already exists',
            code: 'DUPLICATE_RESOURCE',
            details: error.meta
          },
          { status: 409 }
        );
      
      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: 'Resource not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      
      case 'P2003':
        return NextResponse.json(
          {
            success: false,
            error: 'Foreign key constraint failed',
            code: 'FOREIGN_KEY_CONSTRAINT'
          },
          { status: 400 }
        );
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database operation failed',
            code: 'DATABASE_ERROR'
          },
          { status: 500 }
        );
    }
  }

  private handleValidationError(error: any): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      },
      { status: 400 }
    );
  }

  private handleUnknownError(error: Error): NextResponse {
    const response: any = {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR'
    };

    if (this.isDevelopment) {
      response.message = error.message;
      response.stack = error.stack;
    }

    return NextResponse.json(response, { status: 500 });
  }

  // Helper method to wrap async handlers
  async wrap<T>(
    handler: () => Promise<T>,
    request?: NextRequest
  ): Promise<NextResponse | T> {
    try {
      return await handler();
    } catch (error) {
      return this.handle(error as Error, request);
    }
  }
}

// Singleton instance
const errorHandler = new ErrorHandler();

// Helper function for API routes
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  request?: NextRequest
): Promise<NextResponse | T> {
  return errorHandler.wrap(handler, request);
}

// Helper function to create standardized success responses
export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

// Helper function to create standardized error responses
export function createErrorResponse(
  error: string,
  code?: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error,
    code,
    details
  }, { status });
}

export default errorHandler;
