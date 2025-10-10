import { randomBytes } from 'crypto';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  APPLICATION = 'APPLICATION',
  DATABASE = 'DATABASE',
  WEBSOCKET = 'WEBSOCKET',
  WEBRTC = 'WEBRTC',
  AUTH = 'AUTH',
  API = 'API',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  AUDIT = 'AUDIT'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  stack?: string;
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<LogCategory, number>;
  logsByTimeRange: {
    lastHour: number;
    last24Hours: number;
    last7Days: number;
  };
  averageLogsPerMinute: number;
}

export class Logger {
  private static instance: Logger;
  private logs: Map<string, LogEntry> = new Map();
  private metrics: Map<LogLevel, number> = new Map();
  private categoryMetrics: Map<LogCategory, number> = new Map();
  private timeMetrics: Date[] = [];

  private constructor() {
    this.initializeMetrics();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): void {
    Object.values(LogLevel).forEach(level => {
      this.metrics.set(level, 0);
    });

    Object.values(LogCategory).forEach(category => {
      this.categoryMetrics.set(category, 0);
    });
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string,
    duration?: number,
    stack?: string
  ): LogEntry {
    return {
      id: randomBytes(16).toString('hex'),
      timestamp: new Date(),
      level,
      category,
      message,
      context: this.sanitizeContext(context) || {},
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      ...(requestId && { requestId }),
      ...(duration && { duration }),
      ...(stack && { stack })
    };
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'authorization'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Log a message
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string,
    duration?: number,
    stack?: string
  ): void {
    const logEntry = this.createLogEntry(
      level,
      category,
      message,
      context,
      userId,
      sessionId,
      requestId,
      duration,
      stack
    );

    // Store log
    this.logs.set(logEntry.id, logEntry);

    // Update metrics
    this.updateMetrics(logEntry);

    // Output to console
    this.outputToConsole(logEntry);
  }

  /**
   * Update metrics
   */
  private updateMetrics(logEntry: LogEntry): void {
    // Update level metrics
    const currentLevelCount = this.metrics.get(logEntry.level) || 0;
    this.metrics.set(logEntry.level, currentLevelCount + 1);

    // Update category metrics
    const currentCategoryCount = this.categoryMetrics.get(logEntry.category) || 0;
    this.categoryMetrics.set(logEntry.category, currentCategoryCount + 1);

    // Update time metrics
    this.timeMetrics.push(logEntry.timestamp);
  }

  /**
   * Output to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const level = logEntry.level.padEnd(5);
    const category = `[${logEntry.category}]`;
    const message = logEntry.message;
    const contextStr = logEntry.context ? ` ${JSON.stringify(logEntry.context)}` : '';
    const durationStr = logEntry.duration ? ` (${logEntry.duration}ms)` : '';

    const logMessage = `${timestamp} ${level} ${category} ${message}${contextStr}${durationStr}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
    }
  }

  /**
   * Debug log
   */
  debug(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.DEBUG, category, message, context, userId, sessionId, requestId);
  }

  /**
   * Info log
   */
  info(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.INFO, category, message, context, userId, sessionId, requestId);
  }

  /**
   * Warn log
   */
  warn(
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.WARN, category, message, context, userId, sessionId, requestId);
  }

  /**
   * Error log
   */
  error(
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.ERROR,
      category,
      message,
      context,
      userId,
      sessionId,
      requestId,
      undefined,
      error?.stack
    );
  }

  /**
   * Fatal log
   */
  fatal(
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.FATAL,
      category,
      message,
      context,
      userId,
      sessionId,
      requestId,
      undefined,
      error?.stack
    );
  }

  /**
   * Performance log
   */
  performance(
    message: string,
    duration: number,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      message,
      context,
      userId,
      sessionId,
      requestId,
      duration
    );
  }

  /**
   * Security log
   */
  security(
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, message, context, userId, sessionId, requestId);
  }

  /**
   * Audit log
   */
  audit(
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(LogLevel.INFO, LogCategory.AUDIT, message, context, userId, sessionId, requestId);
  }

  /**
   * API request log
   */
  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.INFO,
      LogCategory.API,
      `${method} ${url} - ${statusCode}`,
      { ...context, statusCode },
      userId,
      sessionId,
      requestId,
      duration
    );
  }

  /**
   * Database operation log
   */
  database(
    operation: string,
    table: string,
    duration: number,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.DEBUG,
      LogCategory.DATABASE,
      `${operation} on ${table}`,
      { ...context, table, operation },
      userId,
      sessionId,
      requestId,
      duration
    );
  }

  /**
   * WebSocket event log
   */
  websocket(
    event: string,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.DEBUG,
      LogCategory.WEBSOCKET,
      `${event}: ${message}`,
      { ...context, event },
      userId,
      sessionId,
      requestId
    );
  }

  /**
   * WebRTC event log
   */
  webrtc(
    event: string,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): void {
    this.log(
      LogLevel.DEBUG,
      LogCategory.WEBRTC,
      `${event}: ${message}`,
      { ...context, event },
      userId,
      sessionId,
      requestId
    );
  }

  /**
   * Get log metrics
   */
  getMetrics(): LogMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const logsByLevel = Object.fromEntries(this.metrics.entries()) as Record<LogLevel, number>;
    const logsByCategory = Object.fromEntries(this.categoryMetrics.entries()) as Record<LogCategory, number>;

    const lastHour = this.timeMetrics.filter(time => time > oneHourAgo).length;
    const last24Hours = this.timeMetrics.filter(time => time > oneDayAgo).length;
    const last7Days = this.timeMetrics.filter(time => time > oneWeekAgo).length;

    const totalLogs = Array.from(this.metrics.values()).reduce((sum, count) => sum + count, 0);
    const averageLogsPerMinute = totalLogs / (this.timeMetrics.length > 0 ? 
      (now.getTime() - (this.timeMetrics[0]?.getTime() || now.getTime())) / (1000 * 60) : 1);

    return {
      totalLogs,
      logsByLevel,
      logsByCategory,
      logsByTimeRange: {
        lastHour,
        last24Hours,
        last7Days
      },
      averageLogsPerMinute: Math.round(averageLogsPerMinute * 100) / 100
    };
  }

  /**
   * Get logs
   */
  getLogs(limit: number = 100, level?: LogLevel, category?: LogCategory): LogEntry[] {
    let logs = Array.from(this.logs.values());

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (category) {
      logs = logs.filter(log => log.category === category);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let clearedCount = 0;
    for (const [id, log] of this.logs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.logs.delete(id);
        clearedCount++;
      }
    }

    // Clear old time metrics
    this.timeMetrics = this.timeMetrics.filter(time => time > cutoffDate);

    return clearedCount;
  }

  /**
   * Create request ID
   */
  createRequestId(): string {
    return randomBytes(16).toString('hex');
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
