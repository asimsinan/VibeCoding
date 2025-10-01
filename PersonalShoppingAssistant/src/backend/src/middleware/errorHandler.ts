/**
 * Error Handler Middleware
 * TASK-017: Error Handling - FR-001 through FR-007
 * 
 * This middleware handles all errors in the application and provides
 * consistent error responses with proper HTTP status codes.
 */

import { Request, Response, NextFunction } from 'express';
import { recordError } from './errorMonitoring';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of errors
 */
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let isOperational = error.isOperational !== false;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON format';
  } else if ((error as any).code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if ((error as any).code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if ((error as any).code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field is missing';
  }

  // Record error for monitoring
  recordError(error, req);

  // Log error details
  console.error('Error Details:', {
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message: isOperational ? message : 'Something went wrong',
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Handle async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

/**
 * Validation error helper
 */
export const validationError = (message: string): AppError => {
  return new AppError(message, 400);
};

/**
 * Authentication error helper
 */
export const authError = (message: string = 'Authentication required'): AppError => {
  return new AppError(message, 401);
};

/**
 * Authorization error helper
 */
export const authorizationError = (message: string = 'Insufficient permissions'): AppError => {
  return new AppError(message, 403);
};

/**
 * Not found error helper
 */
export const notFoundError = (message: string = 'Resource not found'): AppError => {
  return new AppError(message, 404);
};

/**
 * Conflict error helper
 */
export const conflictError = (message: string = 'Resource already exists'): AppError => {
  return new AppError(message, 409);
};
