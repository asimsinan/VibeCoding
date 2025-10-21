export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  service?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  filePath?: string;
  remoteEndpoint?: string;
  service: string;
  environment: string;
}

export class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;
  private isTest: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      service: 'resume-reviewer',
      environment: process.env.NODE_ENV || 'development',
      ...config
    };

    this.isDevelopment = this.config.environment === 'development';
    this.isTest = this.config.environment === 'test';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseEntry = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      service: this.config.service,
      environment: this.config.environment,
      message: entry.message,
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.operation && { operation: entry.operation }),
      ...(entry.duration && { duration: entry.duration }),
      ...(entry.metadata && { metadata: entry.metadata }),
      ...(entry.error && { error: entry.error })
    };

    return JSON.stringify(baseEntry);
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;
    if (this.isTest) return; // Don't log in tests

    const formattedLog = this.formatLogEntry(entry);

    if (this.config.enableConsole) {
      this.writeToConsole(entry, formattedLog);
    }

    if (this.config.enableFile && this.config.filePath) {
      this.writeToFile(formattedLog);
    }

    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.writeToRemote(formattedLog);
    }
  }

  private writeToConsole(entry: LogEntry, formattedLog: string): void {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[35m', // Magenta
      [LogLevel.TRACE]: '\x1b[37m'   // White
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || '';

    if (this.isDevelopment) {
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${formattedLog}`);
    } else {
      console.log(formattedLog);
    }
  }

  private writeToFile(formattedLog: string): void {
    // In a real implementation, you would write to a file
    // For now, we'll just log to console
    console.log(`[FILE] ${formattedLog}`);
  }

  private writeToRemote(formattedLog: string): void {
    // In a real implementation, you would send to a remote logging service
    // For now, we'll just log to console
    console.log(`[REMOTE] ${formattedLog}`);
  }

  // Public logging methods
  error(message: string, metadata?: Record<string, any>, error?: Error, requestId?: string, userId?: string): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined
    });
  }

  warn(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      metadata
    });
  }

  info(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      metadata
    });
  }

  debug(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      metadata
    });
  }

  trace(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    this.writeLog({
      level: LogLevel.TRACE,
      message,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      metadata
    });
  }

  // Specialized logging methods
  logRequest(method: string, url: string, requestId: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Request: ${method} ${url}`, {
      method,
      url,
      ...metadata
    }, requestId, userId);
  }

  logResponse(method: string, url: string, statusCode: number, duration: number, requestId: string, userId?: string): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.writeLog({
      level,
      message: `Response: ${method} ${url} - ${statusCode}`,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      operation: 'response',
      duration,
      metadata: {
        method,
        url,
        statusCode
      }
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number, requestId?: string, userId?: string): void {
    this.debug(`Database ${operation} on ${table}`, {
      operation,
      table,
      duration
    }, requestId, userId);
  }

  logExternalServiceCall(service: string, operation: string, duration: number, success: boolean, requestId?: string, userId?: string): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    this.writeLog({
      level,
      message: `External service ${service}: ${operation}`,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      operation: 'external_service',
      duration,
      metadata: {
        externalService: service,
        operation,
        success
      }
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    const level = severity === 'critical' ? LogLevel.ERROR : 
                  severity === 'high' ? LogLevel.WARN : 
                  LogLevel.INFO;

    this.writeLog({
      level,
      message: `Security event: ${event}`,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      operation: 'security',
      metadata: {
        event,
        severity,
        ...metadata
      }
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>, requestId?: string, userId?: string): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    
    this.writeLog({
      level,
      message: `Performance: ${operation} took ${duration}ms`,
      timestamp: new Date(),
      requestId,
      userId,
      service: this.config.service,
      operation: 'performance',
      duration,
      metadata: {
        operation,
        ...metadata
      }
    });
  }

  // Utility methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setService(service: string): void {
    this.config.service = service;
  }

  enableConsole(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  enableFile(enabled: boolean, filePath?: string): void {
    this.config.enableFile = enabled;
    if (filePath) {
      this.config.filePath = filePath;
    }
  }

  enableRemote(enabled: boolean, endpoint?: string): void {
    this.config.enableRemote = enabled;
    if (endpoint) {
      this.config.remoteEndpoint = endpoint;
    }
  }
}

// Global logger instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  enableConsole: process.env.NODE_ENV !== 'test',
  service: 'resume-reviewer',
  environment: process.env.NODE_ENV || 'development'
});

// Middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  
  logger.logRequest(req.method, req.url, requestId, req.user?.id, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    referer: req.headers.referer
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logResponse(req.method, req.url, res.statusCode, duration, requestId, req.user?.id);
  });

  next();
};

// Utility for timing operations
export const timeOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId?: string,
  userId?: string
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    logger.logPerformance(operationName, duration, undefined, requestId, userId);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Operation failed: ${operationName}`, { duration }, error as Error, requestId, userId);
    throw error;
  }
};

// Utility for logging database operations
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  requestId?: string,
  userId?: string
) => {
  logger.logDatabaseOperation(operation, table, duration, requestId, userId);
};

// Utility for logging external service calls
export const logExternalServiceCall = (
  service: string,
  operation: string,
  duration: number,
  success: boolean,
  requestId?: string,
  userId?: string
) => {
  logger.logExternalServiceCall(service, operation, duration, success, requestId, userId);
};

// Utility for logging security events
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>,
  requestId?: string,
  userId?: string
) => {
  logger.logSecurityEvent(event, severity, metadata, requestId, userId);
};
