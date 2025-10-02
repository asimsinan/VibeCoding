export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  timestamp: number;
  url?: string;
  method?: string;
  userAgent?: string;
  stack?: string;
  component?: string;
  action?: string;
}

export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: number;
  resolvedAt?: number;
  retryCount: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition: (error: any) => boolean;
}

export interface ErrorHandlerConfig {
  enableReporting: boolean;
  enableRetry: boolean;
  enableUserFeedback: boolean;
  enableLogging: boolean;
  retryConfig: RetryConfig;
  reportEndpoint?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface UserFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorReports: Map<string, ErrorReport> = new Map();
  private retryQueue: Map<string, { error: Error; retryCount: number; resolve: Function; reject: Function }> = new Map();
  private feedbackCallbacks: Array<(feedback: UserFeedback) => void> = [];

  constructor(config: ErrorHandlerConfig) {
    this.config = config;
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          component: 'global',
          action: 'unhandled_error',
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          component: 'global',
          action: 'unhandled_promise_rejection',
        });
      });
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'medium';
    }
    
    if (error.name === 'ValidationError') {
      return 'low';
    }
    
    if (error.name === 'AuthenticationError') {
      return 'high';
    }
    
    if (error.name === 'AuthorizationError') {
      return 'high';
    }
    
    if (context.component === 'payment' || context.component === 'checkout') {
      return 'critical';
    }
    
    return 'medium';
  }

  private shouldRetry(error: Error): boolean {
    if (!this.config.enableRetry) {return false;}
    
    return this.config.retryConfig.retryCondition(error);
  }

  private calculateRetryDelay(retryCount: number): number {
    const { baseDelay, maxDelay, backoffMultiplier } = this.config.retryConfig;
    const delay = baseDelay * Math.pow(backoffMultiplier, retryCount);
    return Math.min(delay, maxDelay);
  }

  async handleError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    const errorId = this.generateErrorId();
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      stack: error.stack || '',
      ...context,
    };

    const severity = this.determineSeverity(error, fullContext);
    
    const errorReport: ErrorReport = {
      id: errorId,
      type: error.name || 'UnknownError',
      message: error.message,
      context: fullContext,
      severity,
      resolved: false,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.config.retryConfig.maxRetries,
    };

    this.errorReports.set(errorId, errorReport);

    if (this.config.enableLogging) {
      this.logError(errorReport);
    }

    if (this.config.enableReporting) {
      await this.reportError(errorReport);
    }

    if (this.config.enableUserFeedback) {
      this.showUserFeedback(errorReport);
    }

    if (this.shouldRetry(error)) {
      await this.scheduleRetry(errorId, error);
    }
  }

  private logError(errorReport: ErrorReport): void {
    const logMessage = `[${errorReport.severity.toUpperCase()}] ${errorReport.type}: ${errorReport.message}`;
    
    switch (this.config.logLevel) {
      case 'debug':
        console.debug(logMessage, errorReport);
        break;
      case 'info':
        console.info(logMessage, errorReport);
        break;
      case 'warn':
        console.warn(logMessage, errorReport);
        break;
      case 'error':
        console.error(logMessage, errorReport);
        break;
    }
  }

  private async reportError(errorReport: ErrorReport): Promise<void> {
    if (!this.config.reportEndpoint) {return;}

    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  private showUserFeedback(errorReport: ErrorReport): void {
    const feedback: UserFeedback = {
      type: this.getFeedbackType(errorReport.severity),
      title: this.getFeedbackTitle(errorReport),
      message: this.getFeedbackMessage(errorReport),
      duration: this.getFeedbackDuration(errorReport.severity),
      actions: this.getFeedbackActions(errorReport),
    };

    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(feedback);
      } catch (error) {
        console.error('Error in feedback callback:', error);
      }
    });
  }

  private getFeedbackType(severity: string): 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  private getFeedbackTitle(errorReport: ErrorReport): string {
    switch (errorReport.type) {
      case 'NetworkError':
        return 'Connection Error';
      case 'ValidationError':
        return 'Invalid Input';
      case 'AuthenticationError':
        return 'Authentication Failed';
      case 'AuthorizationError':
        return 'Access Denied';
      default:
        return 'An Error Occurred';
    }
  }

  private getFeedbackMessage(errorReport: ErrorReport): string {
    switch (errorReport.type) {
      case 'NetworkError':
        return 'Please check your internet connection and try again.';
      case 'ValidationError':
        return 'Please check your input and try again.';
      case 'AuthenticationError':
        return 'Please log in again to continue.';
      case 'AuthorizationError':
        return 'You do not have permission to perform this action.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private getFeedbackDuration(severity: string): number {
    switch (severity) {
      case 'critical':
        return 0; // No auto-dismiss
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }

  private getFeedbackActions(errorReport: ErrorReport): Array<{ label: string; action: () => void; primary?: boolean }> {
    const actions: Array<{ label: string; action: () => void; primary?: boolean }> = [];

    if (errorReport.type === 'NetworkError') {
      actions.push({
        label: 'Retry',
        action: () => this.retryError(errorReport.id),
        primary: true,
      });
    }

    if (errorReport.type === 'AuthenticationError') {
      actions.push({
        label: 'Login',
        action: () => window.location.href = '/login',
        primary: true,
      });
    }

    actions.push({
      label: 'Dismiss',
      action: () => this.dismissError(errorReport.id),
    });

    return actions;
  }

  private async scheduleRetry(errorId: string, error: Error): Promise<void> {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {return;}

    return new Promise((resolve, reject) => {
      this.retryQueue.set(errorId, { error, retryCount: 0, resolve, reject });
      this.processRetryQueue();
    });
  }

  private async processRetryQueue(): Promise<void> {
    for (const [errorId, retryItem] of this.retryQueue) {
      const errorReport = this.errorReports.get(errorId);
      if (!errorReport) {continue;}

      if (retryItem.retryCount >= this.config.retryConfig.maxRetries) {
        errorReport.resolved = true;
        errorReport.resolvedAt = Date.now();
        this.errorReports.set(errorId, errorReport);
        this.retryQueue.delete(errorId);
        retryItem.reject(new Error('Max retries exceeded'));
        continue;
      }

      const delay = this.calculateRetryDelay(retryItem.retryCount);
      
      setTimeout(async () => {
        try {
          // Simulate retry logic - in real implementation, this would retry the original operation
          await this.retryOperation(errorReport);
          
          errorReport.resolved = true;
          errorReport.resolvedAt = Date.now();
          this.errorReports.set(errorId, errorReport);
          this.retryQueue.delete(errorId);
          retryItem.resolve();
        } catch (retryError) {
          retryItem.retryCount++;
          errorReport.retryCount = retryItem.retryCount;
          this.errorReports.set(errorId, errorReport);
          
          if (retryItem.retryCount >= this.config.retryConfig.maxRetries) {
            this.retryQueue.delete(errorId);
            retryItem.reject(retryError);
          }
        }
      }, delay);
    }
  }

  private async retryOperation(_errorReport: ErrorReport): Promise<void> {
    // Simulate retry operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate success/failure
    if (Math.random() < 0.7) { // 70% success rate
      return;
    } else {
      throw new Error('Retry failed');
    }
  }

  retryError(errorId: string): void {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {return;}

    errorReport.resolved = false;
    errorReport.retryCount = 0;
    this.errorReports.set(errorId, errorReport);

    this.scheduleRetry(errorId, new Error(errorReport.message));
  }

  dismissError(errorId: string): void {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {return;}

    errorReport.resolved = true;
    errorReport.resolvedAt = Date.now();
    this.errorReports.set(errorId, errorReport);
  }

  getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values());
  }

  getUnresolvedErrors(): ErrorReport[] {
    return Array.from(this.errorReports.values()).filter(report => !report.resolved);
  }

  addFeedbackCallback(callback: (feedback: UserFeedback) => void): void {
    this.feedbackCallbacks.push(callback);
  }

  removeFeedbackCallback(callback: (feedback: UserFeedback) => void): void {
    const index = this.feedbackCallbacks.indexOf(callback);
    if (index > -1) {
      this.feedbackCallbacks.splice(index, 1);
    }
  }

  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  clearErrorReports(): void {
    this.errorReports.clear();
  }
}

export const createErrorHandler = (config: ErrorHandlerConfig): ErrorHandler => {
  return new ErrorHandler(config);
};
