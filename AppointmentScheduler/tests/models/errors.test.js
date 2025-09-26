#!/usr/bin/env node
/**
 * Unit Tests for Error Handling
 * 
 * Tests cover:
 * - Error classes and inheritance
 * - Error codes and status codes
 * - Error factories and creation
 * - Error utilities and helpers
 * - Error recovery strategies
 * 
 * Maps to TASK-008: Create Model Tests
 * TDD Phase: Unit
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const {
  ErrorCode,
  ERROR_STATUS_CODES,
  BaseError,
  ValidationError,
  DomainError,
  ApiError,
  DatabaseError,
  NetworkError,
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
  isValidationError,
  isDomainError,
  isApiError,
  isDatabaseError,
  isNetworkError,
  getErrorStatusCode,
  convertToApiError,
  logError,
  createErrorResponse,
  isRetryableError,
  getRetryConfig
} = require('../../src/models/errors');

describe('Error Handling', () => {
  describe('Error Codes', () => {
    test('should have all required error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_EMAIL).toBe('INVALID_EMAIL');
      expect(ErrorCode.APPOINTMENT_CONFLICT).toBe('APPOINTMENT_CONFLICT');
      expect(ErrorCode.APPOINTMENT_NOT_FOUND).toBe('APPOINTMENT_NOT_FOUND');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should have correct HTTP status code mappings', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.VALIDATION_ERROR]).toBe(400);
      expect(ERROR_STATUS_CODES[ErrorCode.APPOINTMENT_CONFLICT]).toBe(409);
      expect(ERROR_STATUS_CODES[ErrorCode.APPOINTMENT_NOT_FOUND]).toBe(404);
      expect(ERROR_STATUS_CODES[ErrorCode.INTERNAL_ERROR]).toBe(500);
      expect(ERROR_STATUS_CODES[ErrorCode.UNAUTHORIZED]).toBe(401);
      expect(ERROR_STATUS_CODES[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
    });
  });

  describe('Error Classes', () => {
    describe('BaseError', () => {
      test('should create base error with required properties', () => {
        const error = new BaseError('TEST_ERROR', 'Test error message', { key: 'value' });

        expect(error.code).toBe('TEST_ERROR');
        expect(error.message).toBe('Test error message');
        expect(error.context).toEqual({ key: 'value' });
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.name).toBe('BaseError');
        expect(error.stack).toBeDefined();
      });

      test('should handle missing context', () => {
        const error = new BaseError('TEST_ERROR', 'Test error message');

        expect(error.context).toBeUndefined();
      });
    });

    describe('ValidationError', () => {
      test('should create validation error', () => {
        const error = new ValidationError('email', 'Invalid email format', 'invalid-email');

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Invalid email format');
        expect(error.field).toBe('email');
        expect(error.value).toBe('invalid-email');
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.name).toBe('ValidationError');
      });

      test('should handle missing value', () => {
        const error = new ValidationError('email', 'Invalid email format');

        expect(error.value).toBeUndefined();
      });
    });

    describe('DomainError', () => {
      test('should create domain error', () => {
        const error = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Appointment conflicts');

        expect(error.code).toBe('APPOINTMENT_CONFLICT');
        expect(error.message).toBe('Appointment conflicts');
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.name).toBe('DomainError');
      });
    });

    describe('ApiError', () => {
      test('should create API error', () => {
        const error = new ApiError(
          ErrorCode.VALIDATION_ERROR,
          'Request validation failed',
          'req-123',
          [],
          { field: 'email' }
        );

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Request validation failed');
        expect(error.statusCode).toBe(400);
        expect(error.requestId).toBe('req-123');
        expect(error.details).toEqual([]);
        expect(error.context).toEqual({ field: 'email' });
      });

      test('should handle missing optional parameters', () => {
        const error = new ApiError(ErrorCode.INTERNAL_ERROR, 'Internal error');

        expect(error.requestId).toBeUndefined();
        expect(error.details).toBeUndefined();
      });
    });

    describe('DatabaseError', () => {
      test('should create database error', () => {
        const originalError = new Error('Connection failed');
        const error = new DatabaseError('Database operation failed', 'SELECT * FROM users', originalError);

        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('Database operation failed');
        expect(error.query).toBe('SELECT * FROM users');
        expect(error.originalError).toBe(originalError);
      });

      test('should handle missing optional parameters', () => {
        const error = new DatabaseError('Database operation failed');

        expect(error.query).toBeUndefined();
        expect(error.originalError).toBeUndefined();
      });
    });

    describe('NetworkError', () => {
      test('should create network error', () => {
        const error = new NetworkError('Request failed', 'https://api.example.com', 'GET', 500);

        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Request failed');
        expect(error.url).toBe('https://api.example.com');
        expect(error.method).toBe('GET');
        expect(error.statusCode).toBe(500);
      });

      test('should handle missing optional parameters', () => {
        const error = new NetworkError('Request failed');

        expect(error.url).toBeUndefined();
        expect(error.method).toBeUndefined();
        expect(error.statusCode).toBeUndefined();
      });
    });
  });

  describe('Error Factories', () => {
    describe('createAppointmentConflictError', () => {
      test('should create appointment conflict error', () => {
        const error = createAppointmentConflictError('app-123', ['app-456', 'app-789']);

        expect(error.code).toBe('APPOINTMENT_CONFLICT');
        expect(error.message).toContain('app-456');
        expect(error.message).toContain('app-789');
        expect(error.context.appointmentId).toBe('app-123');
        expect(error.context.conflictingAppointments).toEqual(['app-456', 'app-789']);
      });
    });

    describe('createAppointmentNotFoundError', () => {
      test('should create appointment not found error', () => {
        const error = createAppointmentNotFoundError('app-123');

        expect(error.code).toBe('APPOINTMENT_NOT_FOUND');
        expect(error.message).toContain('app-123');
        expect(error.context.appointmentId).toBe('app-123');
      });
    });

    describe('createInvalidTimeSlotError', () => {
      test('should create invalid time slot error', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T11:00:00Z');
        const error = createInvalidTimeSlotError(startTime, endTime, 'Outside business hours');

        expect(error.code).toBe('INVALID_TIME_SLOT');
        expect(error.message).toContain('Outside business hours');
        expect(error.context.startTime).toBe(startTime);
        expect(error.context.endTime).toBe(endTime);
      });
    });

    describe('createOutsideBusinessHoursError', () => {
      test('should create outside business hours error', () => {
        const date = new Date('2025-01-01T08:00:00Z');
        const error = createOutsideBusinessHoursError(date);

        expect(error.code).toBe('OUTSIDE_BUSINESS_HOURS');
        expect(error.message).toContain('outside business hours');
        expect(error.context.date).toBe(date);
      });
    });

    describe('createWeekendBookingError', () => {
      test('should create weekend booking error', () => {
        const date = new Date('2025-01-04T10:00:00Z'); // Saturday
        const error = createWeekendBookingError(date);

        expect(error.code).toBe('WEEKEND_BOOKING');
        expect(error.message).toContain('weekend');
        expect(error.context.date).toBe(date);
      });
    });

    describe('createInvalidEmailError', () => {
      test('should create invalid email error', () => {
        const error = createInvalidEmailError('invalid-email');

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.field).toBe('email');
        expect(error.value).toBe('invalid-email');
        expect(error.message).toContain('invalid-email');
      });
    });

    describe('createInvalidDateError', () => {
      test('should create invalid date error', () => {
        const error = createInvalidDateError('startTime', 'invalid-date', 'Invalid format');

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.field).toBe('startTime');
        expect(error.value).toBe('invalid-date');
        expect(error.message).toContain('Invalid format');
      });
    });

    describe('createInvalidDurationError', () => {
      test('should create invalid duration error', () => {
        const error = createInvalidDurationError(10, 15, 480);

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.field).toBe('duration');
        expect(error.value).toBe(10);
        expect(error.message).toContain('between 15 and 480 minutes');
      });
    });

    describe('createUserNotFoundError', () => {
      test('should create user not found error', () => {
        const error = createUserNotFoundError('user-123');

        expect(error.code).toBe('USER_NOT_FOUND');
        expect(error.message).toContain('user-123');
        expect(error.context.userId).toBe('user-123');
      });
    });

    describe('createDatabaseConnectionError', () => {
      test('should create database connection error', () => {
        const originalError = new Error('Connection timeout');
        const error = createDatabaseConnectionError(originalError);

        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('Failed to connect to database');
        expect(error.originalError).toBe(originalError);
      });
    });

    describe('createDatabaseQueryError', () => {
      test('should create database query error', () => {
        const originalError = new Error('Syntax error');
        const error = createDatabaseQueryError('SELECT * FROM', originalError);

        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('Database query failed');
        expect(error.query).toBe('SELECT * FROM');
        expect(error.originalError).toBe(originalError);
      });
    });

    describe('createNetworkRequestError', () => {
      test('should create network request error', () => {
        const error = createNetworkRequestError('https://api.example.com', 'POST', 404, 'Not Found');

        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.message).toContain('Not Found');
        expect(error.url).toBe('https://api.example.com');
        expect(error.method).toBe('POST');
        expect(error.statusCode).toBe(404);
      });
    });

    describe('createRateLimitExceededError', () => {
      test('should create rate limit exceeded error', () => {
        const error = createRateLimitExceededError(100, 60);

        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.message).toContain('100 requests per 60 seconds');
        expect(error.statusCode).toBe(429);
        expect(error.context.limit).toBe(100);
        expect(error.context.window).toBe(60);
      });
    });
  });

  describe('Error Utilities', () => {
    describe('isValidationError', () => {
      test('should identify validation errors', () => {
        const validationError = new ValidationError('email', 'Invalid email');
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');

        expect(isValidationError(validationError)).toBe(true);
        expect(isValidationError(domainError)).toBe(false);
        expect(isValidationError(null)).toBe(false);
      });
    });

    describe('isDomainError', () => {
      test('should identify domain errors', () => {
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');
        const validationError = new ValidationError('email', 'Invalid email');

        expect(isDomainError(domainError)).toBe(true);
        expect(isDomainError(validationError)).toBe(false);
        expect(isDomainError(null)).toBe(false);
      });
    });

    describe('isApiError', () => {
      test('should identify API errors', () => {
        const apiError = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed');
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');

        expect(isApiError(apiError)).toBe(true);
        expect(isApiError(domainError)).toBe(false);
        expect(isApiError(null)).toBe(false);
      });
    });

    describe('isDatabaseError', () => {
      test('should identify database errors', () => {
        const dbError = new DatabaseError('Database failed');
        const apiError = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed');

        expect(isDatabaseError(dbError)).toBe(true);
        expect(isDatabaseError(apiError)).toBe(false);
        expect(isDatabaseError(null)).toBe(false);
      });
    });

    describe('isNetworkError', () => {
      test('should identify network errors', () => {
        const networkError = new NetworkError('Network failed');
        const apiError = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed');

        expect(isNetworkError(networkError)).toBe(true);
        expect(isNetworkError(apiError)).toBe(false);
        expect(isNetworkError(null)).toBe(false);
      });
    });

    describe('getErrorStatusCode', () => {
      test('should get correct status codes', () => {
        const apiError = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed');
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');
        const validationError = new ValidationError('email', 'Invalid email');

        expect(getErrorStatusCode(apiError)).toBe(400);
        expect(getErrorStatusCode(domainError)).toBe(409);
        expect(getErrorStatusCode(validationError)).toBe(400);
        expect(getErrorStatusCode(new Error('Generic error'))).toBe(500);
      });
    });

    describe('convertToApiError', () => {
      test('should convert API error', () => {
        const apiError = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 'req-123');
        const converted = convertToApiError(apiError, 'req-456');

        expect(converted).toBe(apiError);
        expect(converted.requestId).toBe('req-123'); // Original request ID preserved
      });

      test('should convert domain error', () => {
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict', { id: 'app-123' });
        const converted = convertToApiError(domainError, 'req-123');

        expect(converted.code).toBe('APPOINTMENT_CONFLICT');
        expect(converted.message).toBe('Conflict');
        expect(converted.requestId).toBe('req-123');
        expect(converted.statusCode).toBe(409);
      });

      test('should convert validation error', () => {
        const validationError = new ValidationError('email', 'Invalid email', 'invalid-email');
        const converted = convertToApiError(validationError, 'req-123');

        expect(converted.code).toBe('VALIDATION_ERROR');
        expect(converted.message).toBe('Invalid email');
        expect(converted.requestId).toBe('req-123');
        expect(converted.statusCode).toBe(400);
        expect(converted.details).toHaveLength(1);
        expect(converted.details[0].field).toBe('email');
      });

      test('should convert database error', () => {
        const dbError = new DatabaseError('Database failed', 'SELECT * FROM users');
        const converted = convertToApiError(dbError, 'req-123');

        expect(converted.code).toBe('DATABASE_ERROR');
        expect(converted.message).toBe('Database operation failed');
        expect(converted.requestId).toBe('req-123');
        expect(converted.statusCode).toBe(500);
      });

      test('should convert network error', () => {
        const networkError = new NetworkError('Network failed', 'https://api.example.com', 'GET', 500);
        const converted = convertToApiError(networkError, 'req-123');

        expect(converted.code).toBe('NETWORK_ERROR');
        expect(converted.message).toBe('Network operation failed');
        expect(converted.requestId).toBe('req-123');
        expect(converted.statusCode).toBe(503);
      });

      test('should convert generic error', () => {
        const genericError = new Error('Something went wrong');
        const converted = convertToApiError(genericError, 'req-123');

        expect(converted.code).toBe('INTERNAL_ERROR');
        expect(converted.message).toBe('An internal error occurred');
        expect(converted.requestId).toBe('req-123');
        expect(converted.statusCode).toBe(500);
      });
    });

    describe('logError', () => {
      test('should log error with appropriate level', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

        const apiError = new ApiError(ErrorCode.INTERNAL_ERROR, 'Internal error');
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');
        const validationError = new ValidationError('email', 'Invalid email');

        logError(apiError);
        logError(domainError);
        logError(validationError);

        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleInfoSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleInfoSpy.mockRestore();
      });
    });

    describe('createErrorResponse', () => {
      test('should create error response', () => {
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');
        const response = createErrorResponse(domainError, 'req-123');

        expect(response.statusCode).toBe(409);
        expect(response.body.code).toBe('APPOINTMENT_CONFLICT');
        expect(response.body.message).toBe('Conflict');
        expect(response.body.requestId).toBe('req-123');
      });
    });
  });

  describe('Error Recovery Strategies', () => {
    describe('isRetryableError', () => {
      test('should identify retryable errors', () => {
        const networkError = new NetworkError('Network failed');
        const timeoutError = new Error('Timeout');
        timeoutError.code = 'TIMEOUT_ERROR';
        const dbError = new DatabaseError('Database failed');
        const rateLimitError = new Error('Rate limit exceeded');
        rateLimitError.code = 'RATE_LIMIT_EXCEEDED';

        const validationError = new ValidationError('email', 'Invalid email');
        const domainError = new DomainError(ErrorCode.APPOINTMENT_CONFLICT, 'Conflict');

        expect(isRetryableError(networkError)).toBe(true);
        expect(isRetryableError(timeoutError)).toBe(true);
        expect(isRetryableError(dbError)).toBe(true);
        expect(isRetryableError(rateLimitError)).toBe(true);
        expect(isRetryableError(validationError)).toBe(false);
        expect(isRetryableError(domainError)).toBe(false);
      });
    });

    describe('getRetryConfig', () => {
      test('should get retry configuration', () => {
        const networkError = new NetworkError('Network failed');
        const timeoutError = new Error('Timeout');
        timeoutError.code = 'TIMEOUT_ERROR';
        const dbError = new DatabaseError('Database failed');
        const rateLimitError = new Error('Rate limit exceeded');
        rateLimitError.code = 'RATE_LIMIT_EXCEEDED';

        const validationError = new ValidationError('email', 'Invalid email');

        expect(getRetryConfig(networkError)).toEqual({ maxRetries: 3, delay: 1000 });
        expect(getRetryConfig(timeoutError)).toEqual({ maxRetries: 2, delay: 2000 });
        expect(getRetryConfig(dbError)).toEqual({ maxRetries: 1, delay: 500 });
        expect(getRetryConfig(rateLimitError)).toEqual({ maxRetries: 1, delay: 5000 });
        expect(getRetryConfig(validationError)).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined errors', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isDomainError(undefined)).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(getErrorStatusCode(null)).toBe(500);
      expect(convertToApiError(null, 'req-123').code).toBe('INTERNAL_ERROR');
    });

    test('should handle errors without code', () => {
      const errorWithoutCode = new Error('Generic error');
      expect(getErrorStatusCode(errorWithoutCode)).toBe(500);
      expect(convertToApiError(errorWithoutCode, 'req-123').code).toBe('INTERNAL_ERROR');
    });

    test('should handle errors with invalid codes', () => {
      const errorWithInvalidCode = new Error('Invalid code error');
      errorWithInvalidCode.code = 'INVALID_CODE';
      expect(getErrorStatusCode(errorWithInvalidCode)).toBe(500);
    });
  });
});
