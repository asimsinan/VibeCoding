import { ErrorCode, ErrorSeverity, AppError } from './error.types';

export class AppErrorClass extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.statusCode = statusCode;
    this.details = details || {};
    this.timestamp = new Date();
    this.context = context || {};

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppErrorClass.prototype);
  }

  /**
   * Create a validation error
   */
  static validation(
    message: string,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      400,
      details,
      context
    );
  }

  /**
   * Create an authentication error
   */
  static authentication(
    message: string = 'Authentication required',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.AUTHENTICATION_ERROR,
      ErrorSeverity.MEDIUM,
      401,
      details,
      context
    );
  }

  /**
   * Create an authorization error
   */
  static authorization(
    message: string = 'Access denied',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorSeverity.MEDIUM,
      403,
      details,
      context
    );
  }

  /**
   * Create a not found error
   */
  static notFound(
    message: string = 'Resource not found',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.NOT_FOUND,
      ErrorSeverity.LOW,
      404,
      details,
      context
    );
  }

  /**
   * Create a conflict error
   */
  static conflict(
    message: string = 'Resource conflict',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.CONFLICT,
      ErrorSeverity.MEDIUM,
      409,
      details,
      context
    );
  }

  /**
   * Create a rate limit error
   */
  static rateLimit(
    message: string = 'Rate limit exceeded',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorSeverity.MEDIUM,
      429,
      details,
      context
    );
  }

  /**
   * Create a database error
   */
  static database(
    message: string,
    code: ErrorCode = ErrorCode.DATABASE_QUERY_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.HIGH,
      500,
      details,
      context
    );
  }

  /**
   * Create a WebRTC error
   */
  static webrtc(
    message: string,
    code: ErrorCode = ErrorCode.WEBRTC_CONNECTION_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.HIGH,
      500,
      details,
      context
    );
  }

  /**
   * Create a WebSocket error
   */
  static websocket(
    message: string,
    code: ErrorCode = ErrorCode.WEBSOCKET_CONNECTION_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.MEDIUM,
      500,
      details,
      context
    );
  }

  /**
   * Create a room error
   */
  static room(
    message: string,
    code: ErrorCode = ErrorCode.ROOM_NOT_FOUND,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.MEDIUM,
      code === ErrorCode.ROOM_NOT_FOUND ? 404 : 500,
      details,
      context
    );
  }

  /**
   * Create a participant error
   */
  static participant(
    message: string,
    code: ErrorCode = ErrorCode.PARTICIPANT_NOT_FOUND,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.MEDIUM,
      code === ErrorCode.PARTICIPANT_NOT_FOUND ? 404 : 500,
      details,
      context
    );
  }

  /**
   * Create a chat error
   */
  static chat(
    message: string,
    code: ErrorCode = ErrorCode.MESSAGE_SEND_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.LOW,
      500,
      details,
      context
    );
  }

  /**
   * Create an internal server error
   */
  static internal(
    message: string = 'Internal server error',
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorSeverity.CRITICAL,
      500,
      details,
      context
    );
  }

  /**
   * Create a network error
   */
  static network(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    details?: Record<string, any>,
    context?: Record<string, any>
  ): AppErrorClass {
    return new AppErrorClass(
      message,
      code,
      ErrorSeverity.HIGH,
      500,
      details,
      context
    );
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Convert error to safe JSON (without sensitive data)
   */
  toSafeJSON(): Record<string, any> {
    const safeDetails = this.details ? { ...this.details } : undefined;
    
    // Remove sensitive data from details
    if (safeDetails) {
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
      sensitiveKeys.forEach(key => {
        if (safeDetails[key]) {
          safeDetails[key] = '[REDACTED]';
        }
      });
    }

    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      statusCode: this.statusCode,
      details: safeDetails,
      timestamp: this.timestamp.toISOString()
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.CONNECTION_REFUSED,
      ErrorCode.DATABASE_CONNECTION_ERROR,
      ErrorCode.WEBSOCKET_CONNECTION_ERROR,
      ErrorCode.WEBRTC_CONNECTION_ERROR
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Check if error should be logged
   */
  shouldLog(): boolean {
    const loggableSeverities = [
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL
    ];

    return loggableSeverities.includes(this.severity);
  }

  /**
   * Check if error should be reported to external services
   */
  shouldReport(): boolean {
    return this.severity === ErrorSeverity.CRITICAL || 
           this.severity === ErrorSeverity.HIGH;
  }
}
