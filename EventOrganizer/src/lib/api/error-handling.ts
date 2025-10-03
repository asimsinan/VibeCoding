#!/usr/bin/env node
/**
 * Professional API Error Handling System
 * 
 * Implements comprehensive error handling with proper HTTP status codes,
 * error logging, error recovery, and user-friendly error messages.
 * 
 * @fileoverview API error handling utilities and middleware
 */

// Express types are not needed for frontend
// import { Request, Response, NextFunction } from 'express'

export interface APIError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId?: string
  stack?: string
  context?: {
    userId?: string
    endpoint?: string
    method?: string
    userAgent?: string
    ip?: string
  }
}

export interface ErrorHandlingConfig {
  enableErrorLogging: boolean
  enableStackTrace: boolean
  enableRequestContext: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  includeSensitiveData: boolean
  errorRecoveryEnabled: boolean
  maxRetryAttempts: number
  retryDelay: number
}

export class APIErrorHandler {
  private config: ErrorHandlingConfig
  private errorCodes: Map<string, { status: number; message: string }> = new Map()

  constructor(config: ErrorHandlingConfig) {
    this.config = config
    this.initializeErrorCodes()
  }

  /**
   * Initialize standard error codes
   */
  private initializeErrorCodes(): void {
    // Authentication errors
    this.errorCodes.set('UNAUTHORIZED', { status: 401, message: 'Authentication required' })
    this.errorCodes.set('FORBIDDEN', { status: 403, message: 'Access denied' })
    this.errorCodes.set('TOKEN_EXPIRED', { status: 401, message: 'Authentication token has expired' })
    this.errorCodes.set('INVALID_TOKEN', { status: 401, message: 'Invalid authentication token' })

    // Validation errors
    this.errorCodes.set('VALIDATION_ERROR', { status: 400, message: 'Request validation failed' })
    this.errorCodes.set('MISSING_REQUIRED_FIELD', { status: 400, message: 'Required field is missing' })
    this.errorCodes.set('INVALID_FORMAT', { status: 400, message: 'Invalid data format' })
    this.errorCodes.set('INVALID_VALUE', { status: 400, message: 'Invalid value provided' })

    // Resource errors
    this.errorCodes.set('NOT_FOUND', { status: 404, message: 'Resource not found' })
    this.errorCodes.set('CONFLICT', { status: 409, message: 'Resource conflict' })
    this.errorCodes.set('GONE', { status: 410, message: 'Resource no longer available' })

    // Business logic errors
    this.errorCodes.set('BUSINESS_RULE_VIOLATION', { status: 422, message: 'Business rule violation' })
    this.errorCodes.set('QUOTA_EXCEEDED', { status: 429, message: 'Rate limit exceeded' })
    this.errorCodes.set('CAPACITY_EXCEEDED', { status: 507, message: 'Capacity exceeded' })

    // System errors
    this.errorCodes.set('INTERNAL_ERROR', { status: 500, message: 'Internal server error' })
    this.errorCodes.set('SERVICE_UNAVAILABLE', { status: 503, message: 'Service temporarily unavailable' })
    this.errorCodes.set('TIMEOUT', { status: 504, message: 'Request timeout' })
    this.errorCodes.set('DATABASE_ERROR', { status: 500, message: 'Database operation failed' })
    this.errorCodes.set('EXTERNAL_SERVICE_ERROR', { status: 502, message: 'External service error' })

    // Event-specific errors
    this.errorCodes.set('EVENT_NOT_FOUND', { status: 404, message: 'Event not found' })
    this.errorCodes.set('EVENT_FULL', { status: 409, message: 'Event is at full capacity' })
    this.errorCodes.set('EVENT_CANCELLED', { status: 410, message: 'Event has been cancelled' })
    this.errorCodes.set('EVENT_ENDED', { status: 410, message: 'Event has ended' })
    this.errorCodes.set('REGISTRATION_CLOSED', { status: 409, message: 'Event registration is closed' })

    // Session-specific errors
    this.errorCodes.set('SESSION_NOT_FOUND', { status: 404, message: 'Session not found' })
    this.errorCodes.set('SESSION_CONFLICT', { status: 409, message: 'Session time conflict' })
    this.errorCodes.set('SESSION_FULL', { status: 409, message: 'Session is at full capacity' })

    // Attendee-specific errors
    this.errorCodes.set('ATTENDEE_NOT_FOUND', { status: 404, message: 'Attendee not found' })
    this.errorCodes.set('ALREADY_REGISTERED', { status: 409, message: 'Already registered for this event' })
    this.errorCodes.set('REGISTRATION_NOT_FOUND', { status: 404, message: 'Registration not found' })

    // Notification errors
    this.errorCodes.set('NOTIFICATION_FAILED', { status: 500, message: 'Failed to send notification' })
    this.errorCodes.set('INVALID_NOTIFICATION_TYPE', { status: 400, message: 'Invalid notification type' })

    // Networking errors
    this.errorCodes.set('CONNECTION_NOT_FOUND', { status: 404, message: 'Connection not found' })
    this.errorCodes.set('CONNECTION_EXISTS', { status: 409, message: 'Connection already exists' })
    this.errorCodes.set('SELF_CONNECTION', { status: 400, message: 'Cannot connect to yourself' })

    // File upload errors
    this.errorCodes.set('FILE_TOO_LARGE', { status: 413, message: 'File size exceeds limit' })
    this.errorCodes.set('INVALID_FILE_TYPE', { status: 400, message: 'Invalid file type' })
    this.errorCodes.set('UPLOAD_FAILED', { status: 500, message: 'File upload failed' })
  }

  /**
   * Create standardized API error
   */
  public createError(
    code: string,
    message?: string,
    details?: any,
    context?: APIError['context']
  ): APIError {
    const errorInfo = this.errorCodes.get(code)
    const status = errorInfo?.status || 500
    const defaultMessage = errorInfo?.message || 'Unknown error'

    return {
      code,
      message: message || defaultMessage,
      details,
      timestamp: new Date().toISOString(),
      context: this.config.enableRequestContext ? context : undefined
    }
  }

  /**
   * Log error
   */
  private logError(error: APIError, req?: Request): void {
    if (!this.config.enableErrorLogging) return

    const logData = {
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        requestId: error.requestId
      },
      request: req ? {
        method: req.method || 'GET',
        url: req.url || '/',
        userAgent: 'Unknown',
        ip: 'Unknown',
        userId: undefined
      } : undefined,
      stack: this.config.enableStackTrace ? error.stack : undefined
    }

    switch (this.config.logLevel) {
      case 'error':
        break
      case 'warn':
        break
      case 'info':
        break
      case 'debug':
        break
    }
  }

  /**
   * Send error response
   */
  public sendErrorResponse(
    error: APIError,
    req?: any
  ): any {
    const errorInfo = this.errorCodes.get(error.code)
    const status = errorInfo?.status || 500

    // Log error
    this.logError(error, req)

    // Prepare response
    const response: any = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      }
    }

    // Add details if configured
    if (error.details && this.config.includeSensitiveData) {
      response.error.details = error.details
    }

    // Add request ID if available
    if (error.requestId) {
      response.error.requestId = error.requestId
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && this.config.enableStackTrace) {
      response.error.stack = error.stack
    }

    // Add context if enabled
    if (this.config.enableRequestContext && error.context) {
      response.error.context = error.context
    }

    // Return error response (for API routes)
    return {
      success: false,
      error: response,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Handle async errors
   */
  public asyncHandler(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }

  /**
   * Global error handler middleware
   */
  public globalErrorHandler() {
    return (error: any, req: any, res: any, next: any) => {
      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return this.handleValidationError(error, req, res)
      }

      if (error.name === 'CastError') {
        return this.handleCastError(error, req, res)
      }

      if (error.name === 'MongoError' || error.name === 'MongooseError') {
        return this.handleDatabaseError(error, req, res)
      }

      if (error.name === 'JsonWebTokenError') {
        return this.handleJWTError(error, req, res)
      }

      if (error.name === 'TokenExpiredError') {
        return this.handleTokenExpiredError(error, req, res)
      }

      if (error.code === 'ECONNREFUSED') {
        return this.handleConnectionError(error, req, res)
      }

      if (error.code === 'ENOTFOUND') {
        return this.handleNotFoundError(error, req, res)
      }

      // Handle custom API errors
      if (error.code && this.errorCodes.has(error.code)) {
        return this.sendErrorResponse(error, req)
      }

      // Handle unknown errors
      return this.handleUnknownError(error, req, res)
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'VALIDATION_ERROR',
      'Request validation failed',
      error.details || error.message,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle cast errors
   */
  private handleCastError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'INVALID_FORMAT',
      'Invalid data format',
      { field: error.path, value: error.value },
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle database errors
   */
  private handleDatabaseError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'DATABASE_ERROR',
      'Database operation failed',
      this.config.includeSensitiveData ? error.message : undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle JWT errors
   */
  private handleJWTError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'INVALID_TOKEN',
      'Invalid authentication token',
      undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle token expired errors
   */
  private handleTokenExpiredError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'TOKEN_EXPIRED',
      'Authentication token has expired',
      undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'SERVICE_UNAVAILABLE',
      'Service temporarily unavailable',
      undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'NOT_FOUND',
      'Resource not found',
      undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(error: any, req: Request, res: Response): void {
    const apiError = this.createError(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      this.config.includeSensitiveData ? error.message : undefined,
      this.getRequestContext(req)
    )
    this.sendErrorResponse(apiError, req)
  }

  /**
   * Get request context
   */
  private getRequestContext(req: any): APIError['context'] {
    return {
      endpoint: req.path || '/',
      method: req.method || 'GET',
      userAgent: 'Unknown',
      ip: 'Unknown',
      userId: (req as any).user?.id
    }
  }

  /**
   * Error recovery mechanism
   */
  public async attemptRecovery<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.maxRetryAttempts
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        // Don't retry certain types of errors
        if (this.isNonRetryableError(error)) {
          throw error
        }

        // Wait before retry
        if (attempt < maxAttempts) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    throw lastError
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'VALIDATION_ERROR',
      'INVALID_FORMAT',
      'INVALID_VALUE',
      'BUSINESS_RULE_VIOLATION'
    ]

    return nonRetryableCodes.includes(error.code)
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Add custom error code
   */
  public addErrorCode(code: string, status: number, message: string): void {
    this.errorCodes.set(code, { status, message })
  }

  /**
   * Get error code information
   */
  public getErrorCodeInfo(code: string): { status: number; message: string } | null {
    return this.errorCodes.get(code) || null
  }

  /**
   * Get all error codes
   */
  public getAllErrorCodes(): Map<string, { status: number; message: string }> {
    return new Map(this.errorCodes)
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Default configuration
export const defaultErrorHandlingConfig: ErrorHandlingConfig = {
  enableErrorLogging: true,
  enableStackTrace: process.env.NODE_ENV === 'development',
  enableRequestContext: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  includeSensitiveData: process.env.NODE_ENV === 'development',
  errorRecoveryEnabled: true,
  maxRetryAttempts: 3,
  retryDelay: 1000
}

// Express middleware extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

// CLI interface
export class APIErrorHandlingCLI {
  private handler: APIErrorHandler

  constructor(config: ErrorHandlingConfig = defaultErrorHandlingConfig) {
    this.handler = new APIErrorHandler(config)
  }

  public async run(args: string[]): Promise<void> {
    const command = args[0] || 'list'

    switch (command) {
      case 'list':
        this.listErrorCodes()
        break
      case 'add':
        if (args.length < 4) {
          return
        }
        this.handler.addErrorCode(args[1], parseInt(args[2]), args[3])
        break
      case 'info':
        if (args.length < 2) {
          return
        }
        const info = this.handler.getErrorCodeInfo(args[1])
        if (info) {
        } else {
        }
        break
      default:
    }
  }

  private listErrorCodes(): void {
    const errorCodes = this.handler.getAllErrorCodes()
    errorCodes.forEach((info, code) => {
    })
  }
}

export default APIErrorHandler
