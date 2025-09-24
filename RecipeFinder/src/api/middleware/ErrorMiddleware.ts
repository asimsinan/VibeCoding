/**
 * Error Middleware Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorMiddleware as IErrorMiddleware, ApiError } from '../types/ApiTypes';

export class ErrorMiddleware implements IErrorMiddleware {
  handleError(error: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    let statusCode = 500;
    let errorType = 'InternalServerError';
    let message = 'An internal server error occurred';

    // Determine error type and status code
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorType = 'ValidationError';
      message = error.message;
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      errorType = 'NotFoundError';
      message = error.message;
    } else if (error.name === 'DatabaseError') {
      statusCode = 500;
      errorType = 'DatabaseError';
      message = 'Database operation failed';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorType = 'ValidationError';
      message = error.message;
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorType = 'NotFoundError';
      message = error.message;
    } else if (error.message.includes('JSON') || error.message.includes('Unexpected token') || error.message.includes('Expected')) {
      statusCode = 400;
      errorType = 'BadRequestError';
      message = 'Malformed JSON in request body.';
    }

    // Sanitize error message in production
    if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
      message = 'An internal server error occurred';
    }

    const apiError: ApiError = {
      error: errorType,
      message,
      statusCode,
      timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(apiError);
  }

  handleNotFound(req: Request, res: Response, _next: NextFunction): void {
    const apiError: ApiError = {
      error: 'NotFoundError',
      message: `Route ${req.method} ${req.url} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString()
    };

    res.status(404).json(apiError);
  }
}
