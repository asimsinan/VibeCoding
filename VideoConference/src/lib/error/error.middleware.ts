import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from './error.handler';
import { AppErrorClass } from './app.error';
import { ErrorCode } from './error.types';

export class ErrorMiddleware {
  /**
   * Global error handler for API routes
   */
  static withErrorHandling(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const requestId = errorHandler.createRequestId();
      
      try {
        // Add request ID to headers
        const response = await handler(request, context);
        response.headers.set('X-Request-ID', requestId);
        return response;
      } catch (error) {
        return errorHandler.handleApiError(error as Error, request, {
          requestId,
          ...context
        });
      }
    };
  }

  /**
   * Error handler for async operations
   */
  static async withAsyncErrorHandling<T>(
    operation: () => Promise<T>,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      request?: NextRequest;
    }
  ): Promise<T> {
    return errorHandler.wrapAsync(operation, context);
  }

  /**
   * Error handler for sync operations
   */
  static withSyncErrorHandling<T>(
    operation: () => T,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      request?: NextRequest;
    }
  ): T {
    return errorHandler.wrapSync(operation, context);
  }

  /**
   * Validation error handler
   */
  static handleValidationError(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.validation(message, details, context);
  }

  /**
   * Authentication error handler
   */
  static handleAuthError(
    message: string = 'Authentication required',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.authentication(message, details, context);
  }

  /**
   * Authorization error handler
   */
  static handleAuthzError(
    message: string = 'Access denied',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.authorization(message, details, context);
  }

  /**
   * Not found error handler
   */
  static handleNotFoundError(
    message: string = 'Resource not found',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.notFound(message, details, context);
  }

  /**
   * Conflict error handler
   */
  static handleConflictError(
    message: string = 'Resource conflict',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.conflict(message, details, context);
  }

  /**
   * Database error handler
   */
  static handleDatabaseError(
    message: string,
    code: ErrorCode = ErrorCode.DATABASE_QUERY_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.database(message, code, details, context);
  }

  /**
   * WebRTC error handler
   */
  static handleWebRTCError(
    message: string,
    code: ErrorCode = ErrorCode.WEBRTC_CONNECTION_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.webrtc(message, code, details, context);
  }

  /**
   * WebSocket error handler
   */
  static handleWebSocketError(
    message: string,
    code: ErrorCode = ErrorCode.WEBSOCKET_CONNECTION_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.websocket(message, code, details, context);
  }

  /**
   * Room error handler
   */
  static handleRoomError(
    message: string,
    code: ErrorCode = ErrorCode.ROOM_NOT_FOUND,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.room(message, code, details, context);
  }

  /**
   * Participant error handler
   */
  static handleParticipantError(
    message: string,
    code: ErrorCode = ErrorCode.PARTICIPANT_NOT_FOUND,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.participant(message, code, details, context);
  }

  /**
   * Chat error handler
   */
  static handleChatError(
    message: string,
    code: ErrorCode = ErrorCode.MESSAGE_SEND_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.chat(message, code, details, context);
  }

  /**
   * Network error handler
   */
  static handleNetworkError(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.network(message, code, details, context);
  }

  /**
   * Internal server error handler
   */
  static handleInternalError(
    message: string = 'Internal server error',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.internal(message, details, context);
  }

  /**
   * Rate limit error handler
   */
  static handleRateLimitError(
    message: string = 'Rate limit exceeded',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return AppErrorClass.rateLimit(message, details, context);
  }

  /**
   * Create error response
   */
  static createErrorResponse(
    error: AppErrorClass,
    requestId?: string
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        requestId
      },
      { 
        status: error.statusCode,
        headers: {
          'X-Error-Code': error.code,
          'X-Error-Severity': error.severity,
          'X-Request-ID': requestId || 'unknown'
        }
      }
    );
  }

  /**
   * Handle unhandled promise rejections
   */
  static setupUnhandledRejectionHandler(): void {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      const error = reason instanceof Error 
        ? reason 
        : new Error(String(reason));
      
      errorHandler.handleError(error, {
        additionalContext: {
          type: 'unhandledRejection',
          promise: promise.toString()
        }
      });
    });
  }

  /**
   * Handle uncaught exceptions
   */
  static setupUncaughtExceptionHandler(): void {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      
      errorHandler.handleError(error, {
        additionalContext: {
          type: 'uncaughtException'
        }
      });

      // Exit process after handling critical error
      process.exit(1);
    });
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalErrorHandlers(): void {
    this.setupUnhandledRejectionHandler();
    this.setupUncaughtExceptionHandler();
  }
}
