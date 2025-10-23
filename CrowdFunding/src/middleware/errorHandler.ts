import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../lib/logger';

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Global error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    isOperational = true;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  } else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate field value';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed';
    } else if (prismaError.code === 'P2014') {
      statusCode = 400;
      message = 'Invalid ID format';
    }
    isOperational = true;
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    isOperational = true;
  }

  // Create error context for logging
  const errorContext = {
    message: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString()
  };

  // Log error based on severity
  if (statusCode >= 500) {
    logger.error('Server Error', errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.info('Error', errorContext);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: errorContext 
    })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === 'P2002') {
    return new ConflictError('Duplicate field value');
  } else if (error.code === 'P2025') {
    return new NotFoundError('Record not found');
  } else if (error.code === 'P2003') {
    return new ValidationError('Foreign key constraint failed');
  } else if (error.code === 'P2014') {
    return new ValidationError('Invalid ID format');
  }
  
  return new AppError('Database operation failed', 500);
};
