/**
 * Retry Utilities
 * Advanced retry logic with exponential backoff and circuit breaker
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }

  getFailures() {
    return this.failures;
  }
}

// Global circuit breaker instances
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(key: string, options?: CircuitBreakerOptions) {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new CircuitBreaker(options));
  }
  return circuitBreakers.get(key)!;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    jitter = true,
    retryCondition = (error) => {
      // Retry on network errors and 5xx server errors
      return error?.statusCode === 0 || (error?.statusCode >= 500 && error?.statusCode < 600);
    },
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted all attempts
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry if the error doesn't meet the retry condition
      if (!retryCondition(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = jitter 
        ? delay + Math.random() * delay * 0.1 
        : delay;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${jitteredDelay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
}

export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(key, options);
  return circuitBreaker.execute(fn);
}

export async function withRetryAndCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  retryOptions?: RetryOptions,
  circuitBreakerOptions?: CircuitBreakerOptions
): Promise<T> {
  return withCircuitBreaker(key, () => withRetry(fn, retryOptions), circuitBreakerOptions);
}

// Utility for handling offline scenarios
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}

// Utility for handling network errors
export function isNetworkError(error: any): boolean {
  return error?.statusCode === 0 || 
         error?.message?.includes('Network error') ||
         error?.message?.includes('fetch');
}

// Utility for handling authentication errors
export function isAuthError(error: any): boolean {
  return error?.statusCode === 401 || error?.statusCode === 403;
}

// Utility for handling server errors
export function isServerError(error: any): boolean {
  return error?.statusCode >= 500 && error?.statusCode < 600;
}

// Utility for handling client errors
export function isClientError(error: any): boolean {
  return error?.statusCode >= 400 && error?.statusCode < 500;
}

// Retry configuration presets
export const retryPresets = {
  // For critical operations that must succeed
  critical: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
  
  // For normal operations
  normal: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  
  // For non-critical operations
  lenient: {
    maxRetries: 1,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5,
    jitter: true,
  },
  
  // For real-time operations (quick retry)
  realtime: {
    maxRetries: 2,
    baseDelay: 200,
    maxDelay: 1000,
    backoffMultiplier: 2,
    jitter: false,
  },
};
