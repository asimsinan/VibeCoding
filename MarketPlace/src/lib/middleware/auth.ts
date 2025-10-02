// Authentication Middleware
// Middleware for handling authentication in API routes

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
}

class AuthMiddleware {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async authenticate(
    request: NextRequest,
    options: AuthMiddlewareOptions = { required: true }
  ): Promise<NextResponse | AuthenticatedRequest> {
    try {
      // Extract token from Authorization header or cookies
      const token = this.extractToken(request);
      
      if (!token) {
        if (options.required) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        return request as AuthenticatedRequest;
      }

      // Validate JWT token
      let decodedToken: any;
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        decodedToken = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        if (options.required) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
        return request as AuthenticatedRequest;
      }

      const userResult = await this.prisma.user.findUnique({
        where: { id: decodedToken.userId },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true
        }
      });

      if (!userResult || !userResult.isActive) {
        if (options.required) {
          return NextResponse.json(
            { success: false, error: 'User not found or inactive' },
            { status: 401 }
          );
        }
        return request as AuthenticatedRequest;
      }

      // Add user to request
      (request as AuthenticatedRequest).user = {
        id: userResult.id,
        username: userResult.username,
        email: userResult.email
      };

      return request as AuthenticatedRequest;
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  private extractToken(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  async requireAuth(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
  ): Promise<NextResponse | AuthenticatedRequest> {
    return this.authenticate(request, { ...options, required: true });
  }

  async optionalAuth(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
  ): Promise<NextResponse | AuthenticatedRequest> {
    return this.authenticate(request, { ...options, required: false });
  }
}

// Singleton instance
const authMiddleware = new AuthMiddleware();

// Helper functions for API routes
export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse> {
  const authResult = await authMiddleware.requireAuth(request, options);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Error response
  }
  
  return handler(authResult);
}

export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse> {
  const authResult = await authMiddleware.optionalAuth(request, options);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Error response
  }
  
  return handler(authResult);
}

export type { AuthenticatedRequest, AuthMiddlewareOptions };
export default authMiddleware;
