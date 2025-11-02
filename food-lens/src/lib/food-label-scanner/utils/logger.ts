/**
 * Error Logging and Monitoring System
 * Provides structured logging for errors, warnings, and info
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.logLevel = LogLevel.INFO;
    
    // In production, this would integrate with external logging services
    // For now, we'll use in-memory logging and console
    if (process.env.NODE_ENV === 'development') {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  /**
   * Log error message
   */
  public error(
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string,
    requestId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      context: {
        ...context,
        errorName: error?.name,
        errorStack: error?.stack,
      },
      error,
      userId,
      requestId,
    };

    this.addLog(entry);

    // Console error for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, { error, context, userId, requestId });
    }

    // In production, send to external logging service
    this.sendToMonitoringService(entry);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    this.addLog(entry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const levelName = LogLevel[level];
      console.log(`[${levelName}] ${message}`, context || '');
    }
  }

  /**
   * Add log entry to memory buffer
   */
  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Send error to monitoring service (Firebase Analytics, Sentry, etc.)
   */
  private sendToMonitoringService(entry: LogEntry): void {
    // In production, integrate with monitoring service
    // Example: Firebase Crashlytics, Sentry, etc.
    if (process.env.EXPO_PUBLIC_ENABLE_ERROR_MONITORING === 'true') {
      // Send to monitoring service
      // This would be implemented based on chosen service
    }
  }

  /**
   * Get recent error logs
   */
  public getRecentErrors(count: number = 10): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-count)
      .reverse();
  }

  /**
   * Get all logs within time range
   */
  public getLogsByTimeRange(start: Date, end: Date): LogEntry[] {
    return this.logs.filter(
      log => log.timestamp >= start && log.timestamp <= end
    );
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Set log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = Logger.getInstance();

