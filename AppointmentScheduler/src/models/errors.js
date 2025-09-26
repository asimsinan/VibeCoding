#!/usr/bin/env node
/**
 * Errors JavaScript Export
 * 
 * JavaScript version of the error handling for Node.js compatibility
 */

// Error Codes
const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  UNAUTHORIZED_ERROR: 'UNAUTHORIZED_ERROR',
  FORBIDDEN_ERROR: 'FORBIDDEN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Error Utilities
const errorUtils = {
  ErrorCode,
  
  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.DATABASE_ERROR
    ];
    return retryableCodes.includes(error.code);
  },
  
  /**
   * Get retry configuration
   */
  getRetryConfig(error) {
    if (!this.isRetryableError(error)) {
      return null;
    }
    
    const RETRY_CONFIG = {
      NETWORK_ERROR: { maxRetries: 3, delay: 1000 },
      DATABASE_ERROR: { maxRetries: 2, delay: 2000 }
    };
    
    return RETRY_CONFIG[error.code] || { maxRetries: 1, delay: 1000 };
  }
};

module.exports = {
  ErrorCode,
  errorUtils
};
