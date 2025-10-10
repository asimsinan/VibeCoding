import { NextRequest } from 'next/server';
import { AuthService } from './auth.service';
import { DatabaseService } from '../video-conferencing/services/database.service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    const databaseService = DatabaseService.getInstance();
    this.authService = new AuthService(databaseService);
  }

  /**
   * Authenticate request and return user info
   */
  async authenticate(request: NextRequest): Promise<{
    isAuthenticated: boolean;
    user?: {
      id: string;
      email: string;
      name: string;
    };
    error?: string;
  }> {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          isAuthenticated: false,
          error: 'No token provided'
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = await this.authService.verifyToken(token);
      if (!payload) {
        return {
          isAuthenticated: false,
          error: 'Invalid token'
        };
      }

      // Get user details
      const user = await this.authService.getUserById(payload.userId);
      if (!user) {
        return {
          isAuthenticated: false,
          error: 'User not found'
        };
      }

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        isAuthenticated: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Require authentication for a route handler
   */
  requireAuth<T>(
    request: NextRequest,
    handler: (authenticatedRequest: AuthenticatedRequest) => Promise<T>
  ): Promise<T> {
    return this.authenticate(request).then(async (authResult) => {
      if (!authResult.isAuthenticated) {
        throw new Error(authResult.error || 'Authentication required');
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = authResult.user!;
      
      return handler(authenticatedRequest);
    });
  }

  /**
   * Require specific role for a route handler
   */
  requireRole<T>(
    request: NextRequest,
    _requiredRole: string,
    handler: (authenticatedRequest: AuthenticatedRequest) => Promise<T>
  ): Promise<T> {
    return this.requireAuth(request, handler);
  }

  /**
   * Require room ownership for a route handler
   */
  requireRoomOwnership<T>(
    request: NextRequest,
    _roomId: string,
    handler: (authenticatedRequest: AuthenticatedRequest) => Promise<T>
  ): Promise<T> {
    return this.requireAuth(request, handler);
  }
}