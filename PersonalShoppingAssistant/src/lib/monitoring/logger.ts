/**
 * Comprehensive Logging System for Personal Shopping Assistant
 * 
 * Provides structured logging with different levels, contexts, and output formats
 */

import winston from 'winston';
import { Request, Response } from 'express';

// Log levels configuration
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Custom log colors
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Register colors with winston
winston.addColors(LOG_COLORS);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOG_LEVELS,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: {
    service: 'personal-shopping-assistant',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/app.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.http('Request completed', logData);
    }
  });

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: Function) => {
  logger.error('Unhandled error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  });

  next(error);
};

// Security event logging
export const securityLogger = {
  loginAttempt: (email: string, success: boolean, ip: string) => {
    logger.info('Login attempt', {
      event: 'login_attempt',
      email,
      success,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  registrationAttempt: (email: string, success: boolean, ip: string) => {
    logger.info('Registration attempt', {
      event: 'registration_attempt',
      email,
      success,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  },

  suspiciousActivity: (activity: string, details: any) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
export const performanceLogger = {
  databaseQuery: (query: string, duration: number, success: boolean) => {
    logger.debug('Database query', {
      event: 'database_query',
      query: query.substring(0, 100) + '...',
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString()
    });
  },

  apiResponse: (endpoint: string, duration: number, statusCode: number) => {
    logger.info('API response', {
      event: 'api_response',
      endpoint,
      duration: `${duration}ms`,
      statusCode,
      timestamp: new Date().toISOString()
    });
  },

  recommendationGeneration: (userId: number, duration: number, count: number) => {
    logger.info('Recommendation generated', {
      event: 'recommendation_generation',
      userId,
      duration: `${duration}ms`,
      count,
      timestamp: new Date().toISOString()
    });
  }
};

// Business event logging
export const businessLogger = {
  userRegistered: (userId: number, email: string) => {
    logger.info('User registered', {
      event: 'user_registered',
      userId,
      email,
      timestamp: new Date().toISOString()
    });
  },

  productViewed: (userId: number, productId: number) => {
    logger.info('Product viewed', {
      event: 'product_viewed',
      userId,
      productId,
      timestamp: new Date().toISOString()
    });
  },

  productLiked: (userId: number, productId: number) => {
    logger.info('Product liked', {
      event: 'product_liked',
      userId,
      productId,
      timestamp: new Date().toISOString()
    });
  },

  recommendationRequested: (userId: number, count: number) => {
    logger.info('Recommendation requested', {
      event: 'recommendation_requested',
      userId,
      count,
      timestamp: new Date().toISOString()
    });
  }
};

// System monitoring
export const systemLogger = {
  startup: (port: number, environment: string) => {
    logger.info('Application started', {
      event: 'application_startup',
      port,
      environment,
      timestamp: new Date().toISOString()
    });
  },

  shutdown: (reason: string) => {
    logger.info('Application shutting down', {
      event: 'application_shutdown',
      reason,
      timestamp: new Date().toISOString()
    });
  },

  healthCheck: (status: string, details: any) => {
    logger.info('Health check', {
      event: 'health_check',
      status,
      details,
      timestamp: new Date().toISOString()
    });
  },

  databaseConnection: (status: string, details?: any) => {
    logger.info('Database connection', {
      event: 'database_connection',
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Utility functions
export const createChildLogger = (context: string) => {
  return logger.child({ context });
};

export const logWithContext = (level: string, message: string, context: any) => {
  logger.log(level, message, { context });
};

// Export the main logger
export default logger;
