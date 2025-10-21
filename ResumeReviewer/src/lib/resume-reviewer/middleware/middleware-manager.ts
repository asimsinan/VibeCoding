import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, createError, CustomError } from '../utils/error-handler';
import { InputValidator, SecurityValidator } from '../utils/input-validator';
import { logger, requestLogger, timeOperation } from '../utils/logger';

export interface MiddlewareConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableSecurityHeaders: boolean;
  enableRequestLogging: boolean;
  enableErrorHandling: boolean;
  allowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export class MiddlewareManager {
  private config: MiddlewareConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }>;

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = {
      enableCORS: true,
      enableRateLimit: true,
      enableSecurityHeaders: true,
      enableRequestLogging: true,
      enableErrorHandling: true,
      allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
      rateLimitMaxRequests: 100,
      ...config
    };

    this.rateLimitStore = new Map();
  }

  // CORS middleware
  handleCORS(request: NextRequest): NextResponse | null {
    if (!this.config.enableCORS) return null;

    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      if (!origin || !this.config.allowedOrigins.includes(origin)) {
        return NextResponse.json(
          { success: false, error: 'CORS policy violation' },
          { status: 403 }
        );
      }

      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Request-ID',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Handle actual requests
    if (origin && !this.config.allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { success: false, error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    return null;
  }

  // Rate limiting middleware
  checkRateLimit(request: NextRequest): NextResponse | null {
    if (!this.config.enableRateLimit) return null;

    const clientId = this.getClientId(request);
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;

    // Clean up old entries
    for (const [id, data] of this.rateLimitStore.entries()) {
      if (data.resetTime < windowStart) {
        this.rateLimitStore.delete(id);
      }
    }

    // Check current rate limit
    const currentData = this.rateLimitStore.get(clientId);
    if (!currentData || currentData.resetTime < windowStart) {
      // First request in window or window expired
      this.rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now
      });
      return null;
    }

    if (currentData.count >= this.config.rateLimitMaxRequests) {
      logger.warn('Rate limit exceeded', {
        clientId,
        count: currentData.count,
        limit: this.config.rateLimitMaxRequests
      });

      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Increment counter
    currentData.count++;
    this.rateLimitStore.set(clientId, currentData);

    return null;
  }

  // Security headers middleware
  addSecurityHeaders(response: NextResponse): NextResponse {
    if (!this.config.enableSecurityHeaders) return response;

    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Request-ID': response.headers.get('X-Request-ID') || 'unknown'
    };

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Request logging middleware
  logRequest(request: NextRequest): void {
    if (!this.config.enableRequestLogging) return;

    const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.logRequest(
      request.method,
      request.url,
      requestId,
      undefined,
      {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        referer: request.headers.get('referer')
      }
    );
  }

  // Error handling middleware
  handleError(error: Error, request: NextRequest): NextResponse {
    if (!this.config.enableErrorHandling) {
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    const requestId = request.headers.get('x-request-id') || 'unknown';
    const appError = ErrorHandler.handle(error, requestId);
    
    ErrorHandler.logError(appError, {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent')
    });

    return ErrorHandler.createResponse(appError) as NextResponse;
  }

  // Input validation middleware
  validateInput<T>(data: unknown, validator: (data: unknown, requestId?: string) => T, request: NextRequest): T {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    
    try {
      return validator(data, requestId);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw createError.validation('Input validation failed', undefined, requestId);
    }
  }

  // Security validation middleware
  validateSecurity(request: NextRequest): NextResponse | null {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Check for SQL injection attempts in query parameters
    for (const [key, value] of searchParams.entries()) {
      if (!SecurityValidator.validateSQLInjection(value)) {
        logger.logSecurityEvent('SQL injection attempt', 'high', {
          parameter: key,
          value: value,
          path: pathname
        });

        return NextResponse.json(
          { success: false, error: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    }

    // Check for XSS attempts in query parameters
    for (const [key, value] of searchParams.entries()) {
      if (!SecurityValidator.validateXSS(value)) {
        logger.logSecurityEvent('XSS attempt', 'high', {
          parameter: key,
          value: value,
          path: pathname
        });

        return NextResponse.json(
          { success: false, error: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    }

    return null;
  }

  // Main middleware processor
  async processRequest(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Add request ID to headers
      request.headers.set('x-request-id', requestId);

      // Log request
      this.logRequest(request);

      // Handle CORS
      const corsResponse = this.handleCORS(request);
      if (corsResponse) return corsResponse;

      // Check rate limit
      const rateLimitResponse = this.checkRateLimit(request);
      if (rateLimitResponse) return rateLimitResponse;

      // Validate security
      const securityResponse = this.validateSecurity(request);
      if (securityResponse) return securityResponse;

      // Execute the main handler
      const response = await timeOperation(
        () => handler(request),
        `Request: ${request.method} ${request.url}`,
        requestId
      );

      // Add security headers
      const securedResponse = this.addSecurityHeaders(response);

      // Log response
      const duration = Date.now() - startTime;
      logger.logResponse(
        request.method,
        request.url,
        securedResponse.status,
        duration,
        requestId
      );

      return securedResponse;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        `Request failed: ${request.method} ${request.url}`,
        { duration },
        error as Error,
        requestId
      );

      return this.handleError(error as Error, request);
    }
  }

  // Utility methods
  private getClientId(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return `${clientIp}-${userAgent}`;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<MiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MiddlewareConfig {
    return { ...this.config };
  }

  // Cleanup methods
  cleanupRateLimitStore(): void {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;

    for (const [id, data] of this.rateLimitStore.entries()) {
      if (data.resetTime < windowStart) {
        this.rateLimitStore.delete(id);
      }
    }
  }

  getRateLimitStats(): { totalClients: number; activeClients: number } {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;
    
    let activeClients = 0;
    for (const data of this.rateLimitStore.values()) {
      if (data.resetTime >= windowStart) {
        activeClients++;
      }
    }

    return {
      totalClients: this.rateLimitStore.size,
      activeClients
    };
  }
}

// Global middleware instance
export const middleware = new MiddlewareManager({
  enableCORS: process.env.NODE_ENV !== 'production' || process.env.ENABLE_CORS === 'true',
  enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
  enableRequestLogging: process.env.NODE_ENV !== 'test',
  enableErrorHandling: true,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});

// Utility function for wrapping API handlers
export const withMiddleware = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => {
  return (request: NextRequest) => middleware.processRequest(request, handler);
};

// Utility function for validating request body
export const validateRequestBody = <T>(
  validator: (data: unknown, requestId?: string) => T
) => {
  return (request: NextRequest): T => {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    return middleware.validateInput(request.body, validator, request);
  };
};

// Utility function for validating query parameters
export const validateQueryParams = <T>(
  validator: (data: unknown, requestId?: string) => T
) => {
  return (request: NextRequest): T => {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    return middleware.validateInput(queryParams, validator, request);
  };
};

// Utility function for validating URL parameters
export const validateUrlParams = <T>(
  validator: (data: unknown, requestId?: string) => T
) => {
  return (request: NextRequest): T => {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const params = { pathSegments };
    return middleware.validateInput(params, validator, request);
  };
};
