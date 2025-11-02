/**
 * Error Recovery Mechanisms
 * Provides retry logic and error recovery strategies
 */

import { AppError } from './errors';
import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export class ErrorRecovery {
  /**
   * Retry operation with exponential backoff
   */
  public static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      retryableErrors = [],
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryableError(error, retryableErrors)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        
        logger.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
          { error: error instanceof Error ? error.message : String(error) }
        );

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(
    error: unknown,
    retryableErrors: string[]
  ): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    // Network errors are retryable
    const networkErrorCodes = [
      'ECONNABORTED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
    ];

    if (
      (error as any).code &&
      networkErrorCodes.includes((error as any).code)
    ) {
      return true;
    }

    // Check for specific error codes
    if (retryableErrors.length > 0) {
      const errorCode = (error as any).code || error.name;
      return retryableErrors.includes(errorCode);
    }

    // Server errors (5xx) are retryable
    if (error instanceof AppError && error.statusCode) {
      return error.statusCode >= 500 && error.statusCode < 600;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap operation with error recovery
   */
  public static withRecovery<T>(
    operation: () => Promise<T>,
    fallback: (error: Error) => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.retry(operation, retryOptions).catch(async (error) => {
      logger.error('Operation failed after retries, using fallback', error);
      return fallback(error);
    });
  }

  /**
   * Circuit breaker pattern for protecting external services
   */
  public static createCircuitBreaker(
    failureThreshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime: Date | null = null;
    let isOpen = false;

    return async <T>(operation: () => Promise<T>): Promise<T> => {
      // Check if circuit should be reset
      if (isOpen && lastFailureTime) {
        const timeSinceLastFailure = Date.now() - lastFailureTime.getTime();
        if (timeSinceLastFailure > resetTimeout) {
          isOpen = false;
          failures = 0;
          logger.info('Circuit breaker reset');
        }
      }

      // Circuit is open, reject immediately
      if (isOpen) {
        throw new Error('Circuit breaker is open - service unavailable');
      }

      try {
        const result = await operation();
        // Success resets failure count
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = new Date();

        if (failures >= failureThreshold) {
          isOpen = true;
          logger.error(
            `Circuit breaker opened after ${failures} failures`,
            error instanceof Error ? error : new Error(String(error))
          );
        }

        throw error;
      }
    };
  }
}

