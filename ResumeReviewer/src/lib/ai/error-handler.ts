export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'timeout',
    'network',
    'rate_limit',
    'server_error',
    'service_unavailable'
  ]
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === finalConfig.maxRetries || !isRetryableError(error, finalConfig)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryableError(error: any, config: RetryConfig): boolean {
  if (error instanceof RetryableError) {
    return error.retryable;
  }

  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  return config.retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError) || 
    errorCode.includes(retryableError)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class GeminiErrorHandler {
  static handleError(error: any): RetryableError {
    if (error instanceof RetryableError) {
      return error;
    }

    // Network/timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return new RetryableError('Request timeout', true, 408);
    }

    // Rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return new RetryableError('Yavaş. Çok abandınız!', true, 429);
    }

    // Server errors (5xx)
    if (error.message?.includes('500') || error.message?.includes('502') || 
        error.message?.includes('503') || error.message?.includes('504')) {
      return new RetryableError('Server error', true, 500);
    }

    // Authentication errors (non-retryable)
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return new RetryableError('Authentication failed', false, 401);
    }

    // Bad request errors (non-retryable)
    if (error.message?.includes('400') || error.message?.includes('bad request')) {
      return new RetryableError('Invalid request', false, 400);
    }

    // Schema validation errors (non-retryable)
    if (error.message?.includes('schema') || error.message?.includes('validation')) {
      return new RetryableError('Response validation failed', false, 422);
    }

    // Default to retryable for unknown errors
    return new RetryableError(error.message || 'Unknown error', true);
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000, // 1 minute
    private readonly monitoringPeriod = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new RetryableError('Circuit breaker is OPEN', false, 503);
      }
    }

    try {
      const result = await operation();
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
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}
