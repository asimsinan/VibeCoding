import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log entry interface
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  duration?: number;
  error?: Error;
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableMetrics: boolean;
  metricsEndpoint?: string;
}

// Default logger configuration
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  filePath: './logs/app.log',
  enableRemote: false,
  remoteEndpoint: process.env.LOG_ENDPOINT,
  enableMetrics: false,
  metricsEndpoint: process.env.METRICS_ENDPOINT,
};

// Application logger
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private metricsBuffer: Record<string, number> = {};

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  // Log methods
  public error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Main log method
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // Check if log level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Output to console
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Write to file
    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(logEntry);
    }

    // Send to remote endpoint
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.logToRemote(logEntry);
    }

    // Keep buffer size manageable
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-500);
    }
  }

  // Check if log level is enabled
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  // Log to console
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? `\n${entry.error.stack}` : '';

    const logMessage = `[${timestamp}] ${level} ${entry.message}${contextStr}${errorStr}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }
  }

  // Log to file
  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join, dirname } = await import('path');
      
      const logDir = dirname(this.config.filePath!);
      await mkdir(logDir, { recursive: true });
      
      const logLine = JSON.stringify(entry) + '\n';
      await writeFile(this.config.filePath!, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Log to remote endpoint
  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  // Get recent logs
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear logs
  public clearLogs(): void {
    this.logBuffer = [];
  }

  // Update configuration
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Request logger middleware
export class RequestLogger {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance();
  }

  // Log request start
  public logRequestStart(request: NextRequest): string {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      startTime,
    });

    return requestId;
  }

  // Log request end
  public logRequestEnd(requestId: string, statusCode: number, duration: number): void {
    this.logger.info('Request completed', {
      requestId,
      statusCode,
      duration,
    });
  }

  // Log request error
  public logRequestError(requestId: string, error: Error, duration: number): void {
    this.logger.error('Request failed', {
      requestId,
      duration,
    }, error);
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Performance metrics collector
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Record<string, number> = {};
  private timers: Record<string, number> = {};

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Increment counter
  public incrementCounter(name: string, value: number = 1): void {
    this.metrics[name] = (this.metrics[name] || 0) + value;
  }

  // Set gauge value
  public setGauge(name: string, value: number): void {
    this.metrics[name] = value;
  }

  // Start timer
  public startTimer(name: string): void {
    this.timers[name] = Date.now();
  }

  // End timer and record duration
  public endTimer(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics[`${name}_duration`] = duration;
    delete this.timers[name];
    return duration;
  }

  // Get all metrics
  public getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  // Reset metrics
  public resetMetrics(): void {
    this.metrics = {};
    this.timers = {};
  }

  // Export metrics
  public async exportMetrics(): Promise<void> {
    const logger = Logger.getInstance();
    logger.info('Metrics exported', { metrics: this.metrics });
  }
}

// Application monitoring
export class ApplicationMonitor {
  private static instance: ApplicationMonitor;
  private logger: Logger;
  private metrics: MetricsCollector;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  private constructor() {
    this.logger = Logger.getInstance();
    this.metrics = MetricsCollector.getInstance();
  }

  public static getInstance(): ApplicationMonitor {
    if (!ApplicationMonitor.instance) {
      ApplicationMonitor.instance = new ApplicationMonitor();
    }
    return ApplicationMonitor.instance;
  }

  // Register health check
  public registerHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(name, check);
  }

  // Run all health checks
  public async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, check] of this.healthChecks) {
      try {
        results[name] = await check();
      } catch (error) {
        this.logger.error(`Health check failed: ${name}`, {}, error as Error);
        results[name] = false;
      }
    }

    return results;
  }

  // Get application status
  public async getApplicationStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: Record<string, number>;
    uptime: number;
  }> {
    const checks = await this.runHealthChecks();
    const metrics = this.metrics.getMetrics();
    const uptime = process.uptime();

    const allHealthy = Object.values(checks).every(check => check);
    const someHealthy = Object.values(checks).some(check => check);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      status = 'healthy';
    } else if (someHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      metrics,
      uptime,
    };
  }

  // Monitor database connection
  public async monitorDatabase(): Promise<boolean> {
    try {
      const { PrismaClient } = await import('../generated/prisma');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', {}, error as Error);
      return false;
    }
  }

  // Monitor memory usage
  public monitorMemory(): boolean {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    const maxMemoryMB = 512; // 512MB limit

    this.metrics.setGauge('memory_usage_mb', memUsageMB);
    this.metrics.setGauge('memory_limit_mb', maxMemoryMB);

    return memUsageMB < maxMemoryMB;
  }

  // Monitor CPU usage
  public monitorCPU(): boolean {
    const cpuUsage = process.cpuUsage();
    const totalCpuUsage = cpuUsage.user + cpuUsage.system;
    const maxCpuUsage = 1000000; // 1 second in microseconds

    this.metrics.setGauge('cpu_usage_us', totalCpuUsage);
    this.metrics.setGauge('cpu_limit_us', maxCpuUsage);

    return totalCpuUsage < maxCpuUsage;
  }
}

// Error tracking
export class ErrorTracker {
  private static instance: ErrorTracker;
  private logger: Logger;
  private errorCounts: Map<string, number> = new Map();

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track error
  public trackError(error: Error, context?: Record<string, any>): void {
    const errorType = error.constructor.name;
    const errorMessage = error.message;
    const errorKey = `${errorType}:${errorMessage}`;

    // Increment error count
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    // Log error
    this.logger.error('Error tracked', {
      errorType,
      errorMessage,
      errorKey,
      count: count + 1,
      ...context,
    }, error);

    // Update metrics
    const metrics = MetricsCollector.getInstance();
    metrics.incrementCounter('errors_total');
    metrics.incrementCounter(`errors_${errorType.toLowerCase()}`);
  }

  // Get error statistics
  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  // Clear error statistics
  public clearErrorStats(): void {
    this.errorCounts.clear();
  }
}

// Logging middleware for API routes
export function withLogging(
  handler: (request: NextRequest) => Promise<Response>,
  options?: {
    logLevel?: LogLevel;
    includeBody?: boolean;
    includeHeaders?: boolean;
  }
) {
  return async (request: NextRequest): Promise<Response> => {
    const logger = Logger.getInstance();
    const requestLogger = new RequestLogger(logger);
    const metrics = MetricsCollector.getInstance();

    const requestId = requestLogger.logRequestStart(request);
    const startTime = Date.now();

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      requestLogger.logRequestEnd(requestId, response.status, duration);
      metrics.incrementCounter('requests_total');
      metrics.incrementCounter(`requests_${response.status}`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.logRequestError(requestId, error as Error, duration);

      const errorTracker = ErrorTracker.getInstance();
      errorTracker.trackError(error as Error, {
        requestId,
        method: request.method,
        url: request.url,
      });

      throw error;
    }
  };
}

// Export default logger
export default Logger.getInstance();
