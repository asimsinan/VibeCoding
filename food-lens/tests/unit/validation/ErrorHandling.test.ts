/**
 * Error Handling System Tests
 * Tests for error recovery, logging, and monitoring
 */

import { logger, LogLevel } from '../../../src/lib/food-label-scanner/utils/logger';
import { ErrorRecovery } from '../../../src/lib/food-label-scanner/utils/errorRecovery';
import { handleError, handleErrorWithLogging, AppError, ValidationError } from '../../../src/lib/food-label-scanner/utils/errors';

describe('Error Handling - Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);

    const errors = logger.getRecentErrors(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Test error message');
    expect(errors[0].error).toBe(error);
  });

  it('should log info messages', () => {
    logger.info('Info message', { key: 'value' });
    // Info messages are logged but not stored in error list
    expect(logger.getRecentErrors()).toHaveLength(0);
  });

  it('should respect log level', () => {
    logger.setLogLevel(LogLevel.ERROR);
    logger.debug('Debug message');
    logger.info('Info message');
    
    // Debug and info should not be stored
    expect(logger.getRecentErrors()).toHaveLength(0);
  });

  it('should store error with context', () => {
    logger.error('Error with context', new Error('Test'), { userId: '123' }, 'user123', 'req456');
    
    const errors = logger.getRecentErrors(1);
    expect(errors[0].context?.userId).toBe('123');
    expect(errors[0].userId).toBe('user123');
    expect(errors[0].requestId).toBe('req456');
  });
});

describe('Error Handling - Error Recovery', () => {
  it('should retry operation on failure', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await ErrorRecovery.retry(operation, {
      maxRetries: 3,
      retryDelay: 10,
    });

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('should throw after max retries', async () => {
    const operation = async () => {
      throw new Error('Always fails');
    };

    await expect(
      ErrorRecovery.retry(operation, { maxRetries: 2, retryDelay: 10 })
    ).rejects.toThrow('Always fails');
  });

  it('should not retry non-retryable errors', async () => {
    const validationError = new ValidationError('Invalid input');
    const operation = async () => {
      throw validationError;
    };

    await expect(
      ErrorRecovery.retry(operation, { maxRetries: 3, retryDelay: 10 })
    ).rejects.toThrow(ValidationError);
  });

  it('should use fallback on failure', async () => {
    const operation = async () => {
      throw new Error('Operation failed');
    };

    const fallback = async (error: Error) => {
      return `fallback: ${error.message}`;
    };

    const result = await ErrorRecovery.withRecovery(
      operation,
      fallback,
      { maxRetries: 2, retryDelay: 10 }
    );

    expect(result).toBe('fallback: Operation failed');
  });

  it('should implement circuit breaker pattern', async () => {
    const circuitBreaker = ErrorRecovery.createCircuitBreaker(2, 1000);
    
    // First failure
    await expect(
      circuitBreaker(async () => {
        throw new Error('Service error');
      })
    ).rejects.toThrow('Service error');

    // Second failure opens circuit
    await expect(
      circuitBreaker(async () => {
        throw new Error('Service error');
      })
    ).rejects.toThrow('Service error');

    // Circuit is now open
    await expect(
      circuitBreaker(async () => {
        return 'success';
      })
    ).rejects.toThrow('Circuit breaker is open');
  });
});

describe('Error Handling - Error Processing', () => {
  it('should handle AppError correctly', () => {
    const error = new ValidationError('Invalid input');
    const result = handleError(error);
    
    expect(result).toBe(error);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.statusCode).toBe(400);
  });

  it('should convert unknown errors to AppError', () => {
    const error = new Error('Unknown error');
    const result = handleError(error);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.statusCode).toBe(500);
  });

  it('should handle error with logging', () => {
    logger.clearLogs();
    
    const error = new Error('Test error');
    const result = handleErrorWithLogging(error, { context: 'test' }, 'user123', 'req456');
    
    expect(result).toBeInstanceOf(AppError);
    
    const errors = logger.getRecentErrors(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Error handled');
  });
});

