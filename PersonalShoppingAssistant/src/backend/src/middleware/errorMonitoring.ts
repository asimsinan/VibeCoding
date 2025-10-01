/**
 * Error Monitoring Middleware
 * TASK-017: Error Handling - FR-001 through FR-007
 * 
 * This middleware provides comprehensive error monitoring, logging,
 * and alerting for the Personal Shopping Assistant API.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByStatus: Record<number, number>;
  recentErrors: Array<{
    timestamp: Date;
    error: string;
    endpoint: string;
    statusCode: number;
    userId?: number;
  }>;
}

class ErrorMonitor {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByEndpoint: {},
    errorsByStatus: {},
    recentErrors: []
  };

  private readonly MAX_RECENT_ERRORS = 100;

  /**
   * Record an error occurrence
   */
  public recordError(error: ApiError, req: Request): void {
    this.metrics.totalErrors++;
    
    // Record error by type
    const errorType = error.name || 'UnknownError';
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    
    // Record error by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    this.metrics.errorsByEndpoint[endpoint] = (this.metrics.errorsByEndpoint[endpoint] || 0) + 1;
    
    // Record error by status code
    const statusCode = error.statusCode || 500;
    this.metrics.errorsByStatus[statusCode] = (this.metrics.errorsByStatus[statusCode] || 0) + 1;
    
    // Add to recent errors
    this.metrics.recentErrors.unshift({
      timestamp: new Date(),
      error: error.message,
      endpoint,
      statusCode,
      userId: (req as any).user?.userId
    });
    
    // Keep only recent errors
    if (this.metrics.recentErrors.length > this.MAX_RECENT_ERRORS) {
      this.metrics.recentErrors = this.metrics.recentErrors.slice(0, this.MAX_RECENT_ERRORS);
    }
    
    // Log error details
    this.logError(error, req);
    
    // Check for error thresholds
    this.checkErrorThresholds();
  }

  /**
   * Get error metrics
   */
  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByEndpoint: {},
      errorsByStatus: {},
      recentErrors: []
    };
  }

  /**
   * Log error details
   */
  private logError(error: ApiError, req: Request): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.get('User-Agent'),
          'content-type': req.get('Content-Type'),
          'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
        },
        ip: req.ip,
        userId: (req as any).user?.userId
      },
      error: {
        name: error.name,
        statusCode: error.statusCode,
        isOperational: error.isOperational
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Details:', JSON.stringify(logData, null, 2));
    } else {
      // In production, you would send this to a logging service
      console.error('ERROR:', JSON.stringify(logData));
    }
  }

  /**
   * Check for error thresholds and alert
   */
  private checkErrorThresholds(): void {
    const recentErrorCount = this.metrics.recentErrors.filter(
      error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    // Alert if more than 10 errors in 5 minutes
    if (recentErrorCount > 10) {
      this.sendAlert(`High error rate detected: ${recentErrorCount} errors in the last 5 minutes`);
    }

    // Alert if error rate is above 5%
    const totalRequests = this.metrics.totalErrors + 1000; // Approximate total requests
    const errorRate = (this.metrics.totalErrors / totalRequests) * 100;
    
    if (errorRate > 5) {
      this.sendAlert(`High error rate detected: ${errorRate.toFixed(2)}% error rate`);
    }
  }

  /**
   * Send alert (placeholder for real alerting system)
   */
  private sendAlert(message: string): void {
    // In a real application, this would send alerts via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SMS
    // - etc.
    
    console.warn('🚨 ALERT:', message);
    
    // Example: Send to external monitoring service
    if (process.env.MONITORING_WEBHOOK_URL) {
      // fetch(process.env.MONITORING_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message, timestamp: new Date().toISOString() })
      // }).catch(console.error);
    }
  }
}

// Global error monitor instance
const errorMonitor = new ErrorMonitor();

/**
 * Error monitoring middleware
 * Records errors and provides monitoring capabilities
 */
export const errorMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Override res.json to capture response status
  const originalJson = res.json;
  res.json = function(body: any) {
    // Record successful responses for error rate calculation
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // This could be expanded to track success metrics
    }
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Error recording middleware
 * Records errors when they occur
 */
export const recordError = (error: ApiError, req: Request): void => {
  errorMonitor.recordError(error, req);
};

/**
 * Get error metrics
 */
export const getErrorMetrics = (): ErrorMetrics => {
  return errorMonitor.getMetrics();
};

/**
 * Reset error metrics
 */
export const resetErrorMetrics = (): void => {
  errorMonitor.resetMetrics();
};

/**
 * Health check for error monitoring
 */
export const getErrorMonitoringHealth = (): { status: string; metrics: Partial<ErrorMetrics> } => {
  const metrics = errorMonitor.getMetrics();
  
  // Check if error rate is acceptable
  const recentErrorCount = metrics.recentErrors.filter(
    error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000
  ).length;
  
  const status = recentErrorCount > 20 ? 'unhealthy' : 'healthy';
  
  return {
    status,
    metrics: {
      totalErrors: metrics.totalErrors,
      errorsByStatus: metrics.errorsByStatus,
      recentErrors: metrics.recentErrors.slice(0, 10) // Last 10 errors
    }
  };
};

/**
 * Performance monitoring middleware
 * Tracks response times and performance metrics
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️  ${req.method} ${req.url} - ${statusCode} - ${duration}ms`);
    }
    
    // Track slow requests (> 5 seconds)
    if (duration > 5000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Track error responses
    if (statusCode >= 400) {
      console.warn(`❌ Error response: ${req.method} ${req.url} - ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

/**
 * Request validation middleware
 * Validates request structure and content
 */
export const requestValidation = (req: Request, res: Response, next: NextFunction): void => {
  // Check for malformed JSON
  if (req.get('Content-Type')?.includes('application/json')) {
    try {
      if (req.body && typeof req.body === 'string') {
        JSON.parse(req.body);
      }
    } catch (error) {
      return next(new Error('Invalid JSON format'));
    }
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i
  ];
  
  const checkString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`🚨 Suspicious request detected: ${req.method} ${req.url}`);
      return next(new Error('Suspicious request detected'));
    }
  }
  
  next();
};

export default errorMonitor;
