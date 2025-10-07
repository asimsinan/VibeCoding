/**
 * API Middleware - Next.js API middleware for authentication, validation, and error handling
 * FR-001: API-First Design - API middleware implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiClient } from '../client/apiClient';
import { getErrorHandler } from '../error/apiErrorHandler';
import {
  validateLoginRequest,
  validateRegisterRequest,
  validateCreateWorkspaceRequest,
  validateUpdateWorkspaceRequest,
  validateCreateBoardRequest,
  validateUpdateBoardRequest,
  validateCreateTaskRequest,
  validateUpdateTaskRequest,
  validateMoveTaskRequest,
  validatePaginationParams,
  validateTaskFilterParams,
  validateUserSearchParams,
  sanitizeRequest,
} from '../validation/apiValidation';

export interface ApiMiddlewareConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableValidation: boolean;
  enableAuth: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export class ApiMiddleware {
  private config: ApiMiddlewareConfig;
  private errorHandler = getErrorHandler();

  constructor(config: Partial<ApiMiddlewareConfig> = {}) {
    this.config = {
      enableCORS: true,
      enableRateLimit: true,
      enableValidation: true,
      enableAuth: true,
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100, // 100 requests per window
      ...config,
    };
  }

  public async handleRequest(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // CORS handling
      if (this.config.enableCORS) {
        const corsResponse = this.handleCORS(request);
        if (corsResponse) {
          return corsResponse;
        }
      }

      // Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResponse = await this.handleRateLimit(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Authentication
      if (this.config.enableAuth) {
        const authResponse = await this.handleAuthentication(request);
        if (authResponse) {
          return authResponse;
        }
      }

      // Execute the actual handler
      return await handler(request);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleCORS(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    return null;
  }

  private async handleRateLimit(request: NextRequest): Promise<NextResponse | null> {
    // Simple in-memory rate limiting (in production, use Redis or similar)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;

    // This is a simplified implementation
    // In production, you'd use a proper rate limiting service
    const rateLimitKey = `rate_limit:${clientIP}`;
    
    // For now, we'll just return null (no rate limiting)
    // In a real implementation, you'd check and update the rate limit counter
    return null;
  }

  private async handleAuthentication(request: NextRequest): Promise<NextResponse | null> {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }

    const token = authHeader.substring(7);
    
    // In a real implementation, you'd validate the JWT token here
    // For now, we'll just check if it's not empty
    if (!token) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }

    return null;
  }

  private handleError(error: unknown): NextResponse {
    const handledError = this.errorHandler.handleError(error);
    const userMessage = this.errorHandler.formatErrorForUser(handledError);

    if (handledError instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: {
              fields: handledError.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                value: undefined,
              })),
            },
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (handledError instanceof Error) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: userMessage,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Validation middleware factory
export function createValidationMiddleware<T>(validator: (data: unknown) => T) {
  return async (request: NextRequest): Promise<T> => {
    const body = await request.json();
    const sanitizedBody = sanitizeRequest(body);
    return validator(sanitizedBody);
  };
}

// Authentication middleware
export function createAuthMiddleware() {
  return async (request: NextRequest): Promise<string> => {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    
    // In a real implementation, you'd validate the JWT token here
    // and return the user ID or user object
    if (!token) {
      throw new Error('Invalid token');
    }

    return token;
  };
}

// Rate limiting middleware
export function createRateLimitMiddleware(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (request: NextRequest): Promise<void> => {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    const clientData = requests.get(clientIP);
    
    if (!clientData || clientData.resetTime < now) {
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (clientData.count >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }

    clientData.count++;
  };
}

// CORS middleware
export function createCORSMiddleware(allowedOrigins: string[] = ['*']) {
  return (request: NextRequest): NextResponse | null => {
    const origin = request.headers.get('origin');
    const method = request.method;

    if (method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : (origin || ''),
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    return null;
  };
}

// Global middleware instance
let globalMiddleware: ApiMiddleware | null = null;

export function getApiMiddleware(): ApiMiddleware {
  if (!globalMiddleware) {
    globalMiddleware = new ApiMiddleware();
  }
  return globalMiddleware;
}

export function setApiMiddleware(middleware: ApiMiddleware): void {
  globalMiddleware = middleware;
}
