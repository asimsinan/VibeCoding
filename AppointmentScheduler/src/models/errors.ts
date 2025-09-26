#!/usr/bin/env node
/**
 * Error Handling Types and Patterns for AppointmentScheduler
 * 
 * This file contains error types, error codes, and error handling patterns
 * for comprehensive error management throughout the system.
 * 
 * Maps to TASK-007: Create Data Models
 * TDD Phase: Contract
 * Constitutional Compliance: Anti-Abstraction Gate, Traceability Gate
 */

import {
  ValidationError as ValidationErrorType,
  AppointmentId,
  UserId
} from './types';

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Error Code Enumeration
 * Maps to FR-006: Error Handling
 */
export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_DURATION = 'INVALID_DURATION',
  INVALID_TIMEZONE = 'INVALID_TIMEZONE',
  INVALID_STATUS = 'INVALID_STATUS',
  
  // Business Logic Errors
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_EXPIRED = 'APPOINTMENT_EXPIRED',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  OUTSIDE_BUSINESS_HOURS = 'OUTSIDE_BUSINESS_HOURS',
  WEEKEND_BOOKING = 'WEEKEND_BOOKING',
  
  // User Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_USER_DATA = 'INVALID_USER_DATA',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Authentication/Authorization Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
}

/**
 * HTTP Status Code Mapping
 * Maps to FR-006: Error Handling
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Validation Errors (400)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_DATE]: 400,
  [ErrorCode.INVALID_DURATION]: 400,
  [ErrorCode.INVALID_TIMEZONE]: 400,
  [ErrorCode.INVALID_STATUS]: 400,
  
  // Business Logic Errors (409)
  [ErrorCode.APPOINTMENT_CONFLICT]: 409,
  [ErrorCode.APPOINTMENT_NOT_FOUND]: 404,
  [ErrorCode.APPOINTMENT_CANCELLED]: 410,
  [ErrorCode.APPOINTMENT_EXPIRED]: 410,
  [ErrorCode.INVALID_TIME_SLOT]: 400,
  [ErrorCode.OUTSIDE_BUSINESS_HOURS]: 400,
  [ErrorCode.WEEKEND_BOOKING]: 400,
  
  // User Errors (404, 409)
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.INVALID_USER_DATA]: 400,
  
  // System Errors (500)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.TIMEOUT_ERROR]: 504,
  [ErrorCode.CONFIGURATION_ERROR]: 500,
  
  // Authentication/Authorization Errors (401, 403)
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  
  // Rate Limiting Errors (429)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429
};

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base Error Class
 * Maps to FR-006: Error Handling
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any> | undefined;
  
  constructor(
    code: string,
    message: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation Error Class
 * Maps to FR-006: Error Handling
 */
export class ValidationError extends BaseError {
  public readonly field: string;
  public readonly value?: any;
  
  constructor(
    field: string,
    message: string,
    value?: any,
    context?: Record<string, any>
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, context);
    this.field = field;
    this.value = value;
  }
}

/**
 * Domain Error Class
 * Maps to FR-006: Error Handling
 */
export class DomainError extends BaseError {
  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, any>
  ) {
    super(code, message, context);
  }
}

/**
 * API Error Class
 * Maps to FR-006: Error Handling
 */
export class ApiError extends BaseError {
  public readonly statusCode: number;
  public readonly requestId?: string | undefined;
  public readonly details?: ValidationErrorType[] | undefined;
  
  constructor(
    code: ErrorCode,
    message: string,
    requestId?: string,
    details?: ValidationErrorType[],
    context?: Record<string, any>
  ) {
    super(code, message, context);
    this.statusCode = ERROR_STATUS_CODES[code];
    this.requestId = requestId;
    this.details = details;
  }
}

/**
 * Database Error Class
 * Maps to FR-006: Error Handling
 */
export class DatabaseError extends BaseError {
  public readonly query?: string | undefined;
  public readonly originalError?: Error | undefined;
  
  constructor(
    message: string,
    query?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(ErrorCode.DATABASE_ERROR, message, context);
    this.query = query;
    this.originalError = originalError;
  }
}

/**
 * Network Error Class
 * Maps to FR-006: Error Handling
 */
export class NetworkError extends BaseError {
  public readonly url?: string | undefined;
  public readonly method?: string | undefined;
  public readonly statusCode?: number | undefined;
  
  constructor(
    message: string,
    url?: string,
    method?: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(ErrorCode.NETWORK_ERROR, message, context);
    this.url = url;
    this.method = method;
    this.statusCode = statusCode;
  }
}

// ============================================================================
// Specific Error Factories
// ============================================================================

/**
 * Appointment Conflict Error
 * Maps to FR-004: Availability Checking
 */
export function createAppointmentConflictError(
  appointmentId: AppointmentId,
  conflictingAppointments: AppointmentId[]
): DomainError {
  return new DomainError(
    ErrorCode.APPOINTMENT_CONFLICT,
    `Appointment conflicts with existing appointments: ${conflictingAppointments.join(', ')}`,
    {
      appointmentId,
      conflictingAppointments
    }
  );
}

/**
 * Appointment Not Found Error
 * Maps to FR-003: Appointment Management
 */
export function createAppointmentNotFoundError(appointmentId: AppointmentId): DomainError {
  return new DomainError(
    ErrorCode.APPOINTMENT_NOT_FOUND,
    `Appointment with ID ${appointmentId} not found`,
    { appointmentId }
  );
}

/**
 * Invalid Time Slot Error
 * Maps to FR-002: Appointment Booking
 */
export function createInvalidTimeSlotError(
  startTime: Date,
  endTime: Date,
  reason: string
): DomainError {
  return new DomainError(
    ErrorCode.INVALID_TIME_SLOT,
    `Invalid time slot: ${reason}`,
    { startTime, endTime }
  );
}

/**
 * Outside Business Hours Error
 * Maps to FR-002: Appointment Booking
 */
export function createOutsideBusinessHoursError(date: Date): DomainError {
  return new DomainError(
    ErrorCode.OUTSIDE_BUSINESS_HOURS,
    `Appointment time ${date.toISOString()} is outside business hours (9 AM - 5 PM)`,
    { date }
  );
}

/**
 * Weekend Booking Error
 * Maps to FR-002: Appointment Booking
 */
export function createWeekendBookingError(date: Date): DomainError {
  return new DomainError(
    ErrorCode.WEEKEND_BOOKING,
    `Appointment time ${date.toISOString()} is on a weekend`,
    { date }
  );
}

/**
 * Invalid Email Error
 * Maps to FR-002: Appointment Booking
 */
export function createInvalidEmailError(email: string): ValidationError {
  return new ValidationError(
    'email',
    `Invalid email format: ${email}`,
    email
  );
}

/**
 * Invalid Date Error
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function createInvalidDateError(
  field: string,
  date: any,
  reason: string
): ValidationError {
  return new ValidationError(
    field,
    `Invalid date: ${reason}`,
    date
  );
}

/**
 * Invalid Duration Error
 * Maps to FR-002: Appointment Booking
 */
export function createInvalidDurationError(
  duration: number,
  minDuration: number,
  maxDuration: number
): ValidationError {
  return new ValidationError(
    'duration',
    `Duration ${duration} minutes is invalid. Must be between ${minDuration} and ${maxDuration} minutes`,
    duration
  );
}

/**
 * User Not Found Error
 * Maps to FR-002: Appointment Booking
 */
export function createUserNotFoundError(userId: UserId): DomainError {
  return new DomainError(
    ErrorCode.USER_NOT_FOUND,
    `User with ID ${userId} not found`,
    { userId }
  );
}

/**
 * Database Connection Error
 * Maps to FR-006: Error Handling
 */
export function createDatabaseConnectionError(originalError: Error): DatabaseError {
  return new DatabaseError(
    'Failed to connect to database',
    undefined,
    originalError
  );
}

/**
 * Database Query Error
 * Maps to FR-006: Error Handling
 */
export function createDatabaseQueryError(
  query: string,
  originalError: Error
): DatabaseError {
  return new DatabaseError(
    'Database query failed',
    query,
    originalError
  );
}

/**
 * Network Request Error
 * Maps to FR-006: Error Handling
 */
export function createNetworkRequestError(
  url: string,
  method: string,
  statusCode: number,
  message: string
): NetworkError {
  return new NetworkError(
    `Network request failed: ${message}`,
    url,
    method,
    statusCode
  );
}

/**
 * Rate Limit Exceeded Error
 * Maps to FR-006: Error Handling
 */
export function createRateLimitExceededError(
  limit: number,
  window: number
): ApiError {
  return new ApiError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    `Rate limit exceeded. Maximum ${limit} requests per ${window} seconds`,
    undefined,
    undefined,
    { limit, window }
  );
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Check if error is a validation error
 * Maps to FR-006: Error Handling
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a domain error
 * Maps to FR-006: Error Handling
 */
export function isDomainError(error: any): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Check if error is an API error
 * Maps to FR-006: Error Handling
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Check if error is a database error
 * Maps to FR-006: Error Handling
 */
export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Check if error is a network error
 * Maps to FR-006: Error Handling
 */
export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Get HTTP status code for error
 * Maps to FR-006: Error Handling
 */
export function getErrorStatusCode(error: any): number {
  if (isApiError(error)) {
    return error.statusCode;
  }
  
  if (isDomainError(error)) {
    return ERROR_STATUS_CODES[error.code as ErrorCode] || 500;
  }
  
  if (isValidationError(error)) {
    return 400;
  }
  
  return 500;
}

/**
 * Convert error to API error format
 * Maps to FR-006: Error Handling
 */
export function convertToApiError(
  error: any,
  requestId?: string
): ApiError {
  if (isApiError(error)) {
    return error;
  }
  
  if (isDomainError(error)) {
    return new ApiError(
      error.code as ErrorCode,
      error.message,
      requestId,
      undefined,
      error.context
    );
  }
  
  if (isValidationError(error)) {
    return new ApiError(
      ErrorCode.VALIDATION_ERROR,
      error.message,
      requestId,
      [error],
      { field: error.field, value: error.value }
    );
  }
  
  if (isDatabaseError(error)) {
    return new ApiError(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      requestId,
      undefined,
      { originalError: error.originalError?.message }
    );
  }
  
  if (isNetworkError(error)) {
    return new ApiError(
      ErrorCode.NETWORK_ERROR,
      'Network operation failed',
      requestId,
      undefined,
      { url: error.url, method: error.method, statusCode: error.statusCode }
    );
  }
  
  // Generic error
  return new ApiError(
    ErrorCode.INTERNAL_ERROR,
    'An internal error occurred',
    requestId,
    undefined,
    { originalError: error?.message || 'Unknown error' }
  );
}

/**
 * Log error with appropriate level
 * Maps to FR-006: Error Handling
 */
export function logError(error: any, context?: Record<string, any>): void {
  const errorInfo = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message,
    timestamp: error.timestamp || new Date(),
    context: { ...error.context, ...context },
    stack: error.stack
  };
  
  if (isApiError(error) && error.statusCode >= 500) {
    console.error('Server Error:', errorInfo);
  } else if (isDomainError(error)) {
    console.warn('Domain Error:', errorInfo);
  } else if (isValidationError(error)) {
    console.info('Validation Error:', errorInfo);
  } else {
    console.error('Unknown Error:', errorInfo);
  }
}

/**
 * Create error response for API
 * Maps to FR-006: Error Handling
 */
export function createErrorResponse(
  error: any,
  requestId?: string
): { statusCode: number; body: ApiError } {
  const apiError = convertToApiError(error, requestId);
  
  return {
    statusCode: apiError.statusCode,
    body: apiError
  };
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Retry configuration for different error types
 * Maps to FR-006: Error Handling
 */
export const RETRY_CONFIG = {
  [ErrorCode.NETWORK_ERROR]: { maxRetries: 3, delay: 1000 },
  [ErrorCode.TIMEOUT_ERROR]: { maxRetries: 2, delay: 2000 },
  [ErrorCode.DATABASE_ERROR]: { maxRetries: 1, delay: 500 },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: { maxRetries: 1, delay: 5000 }
};

/**
 * Check if error is retryable
 * Maps to FR-006: Error Handling
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.RATE_LIMIT_EXCEEDED
  ];
  
  return retryableCodes.includes(error.code);
}

/**
 * Get retry configuration for error
 * Maps to FR-006: Error Handling
 */
export function getRetryConfig(error: any): { maxRetries: number; delay: number } | null {
  if (!isRetryableError(error)) {
    return null;
  }
  
  const config = RETRY_CONFIG[error.code as keyof typeof RETRY_CONFIG];
  return config || { maxRetries: 1, delay: 1000 };
}

// ============================================================================
// Export All Error Utilities
// ============================================================================

export const errorUtils = {
  // Error classes
  BaseError,
  ValidationError,
  DomainError,
  ApiError,
  DatabaseError,
  NetworkError,
  
  // Error factories
  createAppointmentConflictError,
  createAppointmentNotFoundError,
  createInvalidTimeSlotError,
  createOutsideBusinessHoursError,
  createWeekendBookingError,
  createInvalidEmailError,
  createInvalidDateError,
  createInvalidDurationError,
  createUserNotFoundError,
  createDatabaseConnectionError,
  createDatabaseQueryError,
  createNetworkRequestError,
  createRateLimitExceededError,
  
  // Error utilities
  isValidationError,
  isDomainError,
  isApiError,
  isDatabaseError,
  isNetworkError,
  getErrorStatusCode,
  convertToApiError,
  logError,
  createErrorResponse,
  
  // Retry utilities
  isRetryableError,
  getRetryConfig
};
