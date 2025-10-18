import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../lib/utils/validation.js';
import { logger } from '../lib/utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error occurred', err);

  if (err instanceof ValidationError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        field: err.field,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: err.message,
      },
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

