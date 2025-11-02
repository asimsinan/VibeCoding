import { handleError, handleErrorWithLogging, AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Base controller with common request/response handling
 * Consolidates duplicate logic across all controllers
 * Enhanced with error logging and monitoring
 */
export interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    timestamp?: string;
    requestId?: string;
  };
  message?: string;
}

export abstract class BaseController {
  private requestIdCounter = 0;

  /**
   * Generate unique request ID for tracking
   */
  protected generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Format error response consistently with logging
   * Enhanced with error monitoring
   */
  protected formatErrorResponse(
    error: unknown,
    userId?: string,
    requestId?: string
  ): ControllerResponse {
    const appError = handleErrorWithLogging(
      error,
      { controller: this.constructor.name },
      userId,
      requestId || this.generateRequestId()
    );

    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
        timestamp: new Date().toISOString(),
        requestId: requestId || this.generateRequestId(),
      },
    };
  }

  /**
   * Format success response with data
   */
  protected formatSuccessResponse<T>(data?: T, message?: string): ControllerResponse<T> {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  /**
   * Format not found response
   */
  protected formatNotFoundResponse(resource: string): ControllerResponse {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`,
        statusCode: 404,
      },
    };
  }

  /**
   * Format validation error response
   */
  protected formatValidationError(message: string): ControllerResponse {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        statusCode: 400,
      },
    };
  }
}

