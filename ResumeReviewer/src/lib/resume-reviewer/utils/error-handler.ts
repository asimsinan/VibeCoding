export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  
  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  
  // Resume analysis errors
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  FEEDBACK_GENERATION_FAILED = 'FEEDBACK_GENERATION_FAILED',
  INVALID_RESUME_FORMAT = 'INVALID_RESUME_FORMAT',
  RESUME_TOO_SHORT = 'RESUME_TOO_SHORT',
  RESUME_TOO_LONG = 'RESUME_TOO_LONG',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // External service errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',
  STORAGE_SERVICE_UNAVAILABLE = 'STORAGE_SERVICE_UNAVAILABLE',
  
  // Input validation errors
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_PASSWORD_FORMAT = 'INVALID_PASSWORD_FORMAT',
  INVALID_UPLOAD_ID = 'INVALID_UPLOAD_ID',
  MISSING_UPLOAD_ID = 'MISSING_UPLOAD_ID',
  INVALID_SESSION_ID = 'INVALID_SESSION_ID',
  MISSING_SESSION_ID = 'MISSING_SESSION_ID',
  
  // Business logic errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UPLOAD_NOT_FOUND = 'UPLOAD_NOT_FOUND',
  FEEDBACK_NOT_FOUND = 'FEEDBACK_NOT_FOUND',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  stack?: string;
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string,
    userId?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;
    this.userId = userId;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      stack: this.stack
    };
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details, requestId);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details, requestId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.FORBIDDEN, message, 403, details, requestId);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.NOT_FOUND, message, 404, details, requestId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.CONFLICT, message, 409, details, requestId);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details, requestId);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details, requestId);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message: string, details?: any, requestId?: string) {
    super(ErrorCode.AI_SERVICE_ERROR, message, 502, details, requestId);
    this.name = 'ExternalServiceError';
  }
}

// Error factory functions
export const createError = {
  validation: (message: string, details?: any, requestId?: string) => 
    new ValidationError(message, details, requestId),
  
  authentication: (message: string, details?: any, requestId?: string) => 
    new AuthenticationError(message, details, requestId),
  
  authorization: (message: string, details?: any, requestId?: string) => 
    new AuthorizationError(message, details, requestId),
  
  notFound: (message: string, details?: any, requestId?: string) => 
    new NotFoundError(message, details, requestId),
  
  conflict: (message: string, details?: any, requestId?: string) => 
    new ConflictError(message, details, requestId),
  
  rateLimit: (message: string, details?: any, requestId?: string) => 
    new RateLimitError(message, details, requestId),
  
  database: (message: string, details?: any, requestId?: string) => 
    new DatabaseError(message, details, requestId),
  
  externalService: (message: string, details?: any, requestId?: string) => 
    new ExternalServiceError(message, details, requestId),
  
  internal: (message: string, details?: any, requestId?: string) => 
    new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, requestId)
};

// Error handler utilities
export class ErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isTest = process.env.NODE_ENV === 'test';

  static handle(error: Error, requestId?: string, userId?: string): AppError {
    // If it's already our custom error, return it
    if (error instanceof CustomError) {
      return error.toJSON();
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return createError.validation(error.message, undefined, requestId).toJSON();
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return this.handlePrismaError(error, requestId);
    }

    if (error.name === 'PrismaClientUnknownRequestError') {
      return createError.database('Database operation failed', { originalError: error.message }, requestId).toJSON();
    }

    if (error.name === 'PrismaClientValidationError') {
      return createError.validation('Database validation failed', { originalError: error.message }, requestId).toJSON();
    }

    // Handle network/connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return createError.externalService('Service unavailable', { originalError: error.message }, requestId).toJSON();
    }

    // Handle timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return createError.externalService('Request timeout', { originalError: error.message }, requestId).toJSON();
    }

    // Default to internal server error
    const appError = createError.internal(
      this.isDevelopment ? error.message : 'An unexpected error occurred',
      this.isDevelopment ? { stack: error.stack } : undefined,
      requestId
    );

    return appError.toJSON();
  }

  private static handlePrismaError(error: any, requestId?: string): AppError {
    const { code, meta } = error;

    switch (code) {
      case 'P2002':
        // Unique constraint violation
        return createError.conflict(
          'Resource already exists',
          { field: meta?.target, constraint: 'unique' },
          requestId
        ).toJSON();

      case 'P2025':
        // Record not found
        return createError.notFound(
          'Resource not found',
          { model: meta?.model },
          requestId
        ).toJSON();

      case 'P2003':
        // Foreign key constraint violation
        return createError.validation(
          'Invalid reference',
          { field: meta?.field_name, constraint: 'foreign_key' },
          requestId
        ).toJSON();

      case 'P2014':
        // Required relation violation
        return createError.validation(
          'Required relation missing',
          { relation: meta?.relation_name },
          requestId
        ).toJSON();

      default:
        return createError.database(
          'Database operation failed',
          { code, originalError: error.message },
          requestId
        ).toJSON();
    }
  }

  static logError(error: AppError, context?: any): void {
    if (this.isTest) return; // Don't log in tests

    const logData = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId: error.requestId,
      userId: error.userId,
      details: error.details,
      stack: error.stack,
      context
    };

    if (error.statusCode >= 500) {
      console.error('Server Error:', logData);
    } else if (error.statusCode >= 400) {
      console.warn('Client Error:', logData);
    } else {
      console.info('Application Error:', logData);
    }
  }

  static createResponse(error: AppError): Response {
    const responseBody = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(this.isDevelopment && error.details && { details: error.details }),
        ...(this.isDevelopment && error.stack && { stack: error.stack }),
        timestamp: error.timestamp.toISOString(),
        requestId: error.requestId
      }
    };

    return new Response(JSON.stringify(responseBody), {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': error.requestId || 'unknown'
      }
    });
  }
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error boundary for async functions
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  requestId?: string,
  userId?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = ErrorHandler.handle(error as Error, requestId, userId);
      ErrorHandler.logError(appError);
      throw new CustomError(
        appError.code,
        appError.message,
        appError.statusCode,
        appError.details,
        appError.requestId,
        appError.userId
      );
    }
  };
};
