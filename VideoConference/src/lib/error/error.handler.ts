import { NextRequest, NextResponse } from 'next/server';
import { AppErrorClass } from './app.error';
import { ErrorCode, ErrorSeverity, ErrorLog } from './error.types';
import { randomBytes } from 'crypto';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: Map<string, ErrorLog> = new Map();
  private errorMetrics: Map<ErrorCode, number> = new Map();
  private severityMetrics: Map<ErrorSeverity, number> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log an error
   */
  handleError(
    error: Error | AppErrorClass,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      request?: NextRequest;
      additionalContext?: Record<string, any>;
    }
  ): AppErrorClass {
    let appError: AppErrorClass;

    // Convert regular Error to AppError if needed
    if (error instanceof AppErrorClass) {
      appError = error;
    } else {
      appError = new AppErrorClass(
        error.message || 'Unknown error occurred',
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.MEDIUM,
        500,
        { originalError: error.name },
        context?.additionalContext
      );
    }

    // Add context to error
    if (context) {
      const newContext = {
        ...appError.context,
        userId: context.userId,
        sessionId: context.sessionId,
        requestId: context.requestId,
        url: context.request?.url,
        method: context.request?.method,
        userAgent: context.request?.headers.get('user-agent'),
        ...context.additionalContext
      };
      
      // Create a new error with updated context
      appError = new AppErrorClass(
        appError.message,
        appError.code,
        appError.severity,
        appError.statusCode,
        appError.details,
        newContext
      );
    }

    // Log error
    this.logError(appError, context);

    // Update metrics
    this.updateMetrics(appError);

    // Report critical errors
    if (appError.shouldReport()) {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Handle API errors and return appropriate response
   */
  handleApiError(
    error: Error | AppErrorClass,
    request?: NextRequest,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
    }
  ): NextResponse {
    const appError = this.handleError(error, {
      ...context,
      ...(request && { request })
    });

    // Log error details
    console.error(`[${appError.code}] ${appError.message}`, {
      error: appError.toSafeJSON(),
      context: appError.context
    });

    // Return appropriate HTTP response
    return NextResponse.json(
      {
        success: false,
        error: appError.code,
        message: appError.message,
        details: appError.details,
        timestamp: appError.timestamp.toISOString(),
        requestId: context?.requestId
      },
      { 
        status: appError.statusCode,
        headers: {
          'X-Error-Code': appError.code,
          'X-Error-Severity': appError.severity,
          'X-Request-ID': context?.requestId || 'unknown'
        }
      }
    );
  }

  /**
   * Log error to internal storage
   */
  private logError(
    error: AppErrorClass,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
    }
  ): void {
    const errorLog: ErrorLog = {
      id: randomBytes(16).toString('hex'),
      error,
      ...(context?.userId && { userId: context.userId }),
      ...(context?.sessionId && { sessionId: context.sessionId }),
      ...(context?.requestId && { requestId: context.requestId }),
      timestamp: new Date(),
      resolved: false
    };

    this.errorLogs.set(errorLog.id, errorLog);

    // Log to console based on severity
    if (error.shouldLog()) {
      const logLevel = this.getLogLevel(error.severity);
      console[logLevel](`[${error.severity}] ${error.code}: ${error.message}`, {
        errorId: errorLog.id,
        context: error.context,
        stack: error.stack
      });
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: AppErrorClass): void {
    // Update error code metrics
    const currentCount = this.errorMetrics.get(error.code) || 0;
    this.errorMetrics.set(error.code, currentCount + 1);

    // Update severity metrics
    const currentSeverityCount = this.severityMetrics.get(error.severity) || 0;
    this.severityMetrics.set(error.severity, currentSeverityCount + 1);
  }

  /**
   * Report critical errors to external services
   */
  private reportError(error: AppErrorClass): void {
    // In a real application, this would send to services like Sentry, DataDog, etc.
    console.error(`[CRITICAL ERROR REPORT] ${error.code}: ${error.message}`, {
      error: error.toSafeJSON(),
      context: error.context,
      timestamp: error.timestamp.toISOString()
    });

    // TODO: Implement actual error reporting service integration
    // Examples:
    // - Sentry.captureException(error)
    // - DataDog.logError(error)
    // - Slack notification
    // - Email alert
  }

  /**
   * Get log level based on severity
   */
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  /**
   * Get error metrics
   */
  getMetrics(): {
    totalErrors: number;
    errorsByCode: Record<ErrorCode, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{
      code: ErrorCode;
      count: number;
      lastOccurred: Date;
    }>;
  } {
    const totalErrors = Array.from(this.errorMetrics.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByCode = Object.fromEntries(
      Array.from(this.errorMetrics.entries())
    ) as Record<ErrorCode, number>;

    const errorsBySeverity = Object.fromEntries(
      Array.from(this.severityMetrics.entries())
    ) as Record<ErrorSeverity, number>;

    const topErrors = Array.from(this.errorMetrics.entries())
      .map(([code, count]) => ({
        code,
        count,
        lastOccurred: new Date() // In a real app, track last occurrence time
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      errorsByCode,
      errorsBySeverity,
      topErrors
    };
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit: number = 100): ErrorLog[] {
    return Array.from(this.errorLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get error by ID
   */
  getErrorById(errorId: string): ErrorLog | undefined {
    return this.errorLogs.get(errorId);
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string, resolvedBy: string): boolean {
    const errorLog = this.errorLogs.get(errorId);
    if (errorLog) {
      errorLog.resolved = true;
      errorLog.resolvedAt = new Date();
      errorLog.resolvedBy = resolvedBy;
      return true;
    }
    return false;
  }

  /**
   * Clear old error logs (cleanup)
   */
  clearOldLogs(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let clearedCount = 0;
    for (const [id, log] of this.errorLogs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.errorLogs.delete(id);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Create a request ID for tracking
   */
  createRequestId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Wrap async function with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      request?: NextRequest;
    }
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.handleError(error as Error, context);
    }
  }

  /**
   * Wrap sync function with error handling
   */
  wrapSync<T>(
    fn: () => T,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      request?: NextRequest;
    }
  ): T {
    try {
      return fn();
    } catch (error) {
      throw this.handleError(error as Error, context);
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
