import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';
import { validate, ValidationError as ClassValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import logger from '../lib/logger';

// Request validation middleware
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Basic request validation
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('Request validation failed: Empty body', {
          method: req.method,
          url: req.url,
          ip: req.ip
        });
        return next(new ValidationError('Request body is required'));
      }
    }

    // Validate Content-Type for JSON requests
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn('Request validation failed: Invalid Content-Type', {
          method: req.method,
          url: req.url,
          contentType,
          ip: req.ip
        });
        return next(new ValidationError('Content-Type must be application/json'));
      }
    }

    // Validate request size
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength > maxSize) {
      logger.warn('Request validation failed: Payload too large', {
        method: req.method,
        url: req.url,
        contentLength,
        ip: req.ip
      });
      return next(new ValidationError('Request payload too large'));
    }

    next();
  } catch (error) {
    logger.error('Request validation error', {
      method: req.method,
      url: req.url,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    next(new ValidationError('Request validation failed'));
  }
};

// Pagination validation middleware
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pageStr = req.query.page as string;
  const limitStr = req.query.limit as string;
  
  const page = pageStr ? parseInt(pageStr) : 1;
  const limit = limitStr ? parseInt(limitStr) : 20;

  if (page < 1) {
    return next(new ValidationError('Page must be greater than 0'));
  }

  if (limit < 1 || limit > 100) {
    return next(new ValidationError('Limit must be between 1 and 100'));
  }

  // Add validated pagination to request
  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};

// UUID validation middleware
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    
    if (!uuid) {
      return next(new ValidationError(`${paramName} parameter is required`));
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }

    next();
  };
};

// Query parameter validation middleware
export const validateQueryParams = (allowedParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));

    if (invalidParams.length > 0) {
      return next(new ValidationError(`Invalid query parameters: ${invalidParams.join(', ')}`));
    }

    next();
  };
};

// Body validation middleware using class-validator
export const validateBody = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instance = plainToInstance(dtoClass, req.body);
      const errors: ClassValidationError[] = await validate(instance, { 
        whitelist: true, 
        forbidNonWhitelisted: true
      });

      if (errors.length > 0) {
        const errorMessages = errors.map(error => 
          Object.values(error.constraints || {})
        ).flat();
        
        logger.warn('Body validation failed', {
          method: req.method,
          url: req.url,
          errors: errorMessages,
          ip: req.ip,
          userId: (req as any).user?.id
        });
        
        return next(new ValidationError(`Validation failed: ${errorMessages.join(', ')}`));
      }

      // Replace req.body with validated instance
      req.body = instance;
      next();
    } catch (error) {
      logger.error('Body validation error', {
        method: req.method,
        url: req.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });
      next(new ValidationError('Invalid request body format'));
    }
  };
};

// Rate limiting middleware (enhanced implementation)
const requestCounts = new Map<string, { count: number; resetTime: number; blocked: boolean }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      
      const clientData = requestCounts.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        // Reset or initialize client data
        requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs,
          blocked: false
        });
        return next();
      }
      
      if (clientData.count >= maxRequests) {
        if (!clientData.blocked) {
          logger.warn('Rate limit exceeded', {
            ip: clientId,
            count: clientData.count,
            maxRequests,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent')
          });
          clientData.blocked = true;
        }
        
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }
      
      clientData.count++;
      next();
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        url: req.url
      });
      next();
    }
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    next();
  } catch (error) {
    logger.error('Security headers error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      url: req.url
    });
    next();
  }
};
