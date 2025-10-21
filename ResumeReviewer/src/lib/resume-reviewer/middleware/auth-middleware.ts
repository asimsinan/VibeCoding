import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth/auth-service';

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  session?: any;
  securityHeaders?: Record<string, string>;
  corsHeaders?: Record<string, string>;
}

export interface AuthMiddlewareConfig {
  allowedOrigins: string[];
  enableCSRF: boolean;
  enableRateLimit: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export class AuthMiddleware {
  private authService: AuthService;
  private config: AuthMiddlewareConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }>;

  constructor(authService?: AuthService, config?: Partial<AuthMiddlewareConfig>) {
    this.authService = authService || new AuthService();
    this.config = {
      allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
      enableCSRF: true,
      enableRateLimit: true,
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
      rateLimitMaxRequests: 100,
      ...config
    };
    this.rateLimitStore = new Map();
  }

  async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          success: false,
          error: 'No authorization token provided'
        };
      }

      // Validate authorization format
      if (!authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'Invalid authorization format'
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      if (!token) {
        return {
          success: false,
          error: 'No token provided'
        };
      }

      // Validate session
      const sessionResult = await this.authService.validateSession(token);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error || 'Authentication failed'
        };
      }

      // Check CSRF protection if enabled
      if (this.config.enableCSRF) {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken) {
          return {
            success: false,
            error: 'CSRF token required'
          };
        }

        const isValidCSRF = await this.authService.validateCSRF(csrfToken, sessionResult.session!.userId);
        if (!isValidCSRF) {
          return {
            success: false,
            error: 'Invalid CSRF token'
          };
        }
      }

      // Add security headers
      const securityHeaders = this.getSecurityHeaders();

      return {
        success: true,
        userId: sessionResult.session!.userId,
        session: sessionResult.session,
        securityHeaders
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async authorize(request: NextRequest, requiredRoles: string[] = []): Promise<AuthResult> {
    try {
      // First authenticate the user
      const authResult = await this.authenticate(request);
      if (!authResult.success) {
        return authResult;
      }

      // If no specific roles required, just return success
      if (requiredRoles.length === 0) {
        return authResult;
      }

      // Get user details for role checking
      const userResult = await this.authService.getCurrentUser(authResult.userId!);
      if (!userResult.success || !userResult.user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // In a real implementation, you would check user roles/permissions
      // For now, we'll implement a simple role check
      const userRoles = this.getUserRoles(userResult.user);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return {
          success: false,
          error: 'Insufficient permissions'
        };
      }

      return authResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authorization failed'
      };
    }
  }

  async handleCORS(request: NextRequest): Promise<AuthResult> {
    try {
      const origin = request.headers.get('origin');
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        if (!origin || !this.config.allowedOrigins.includes(origin)) {
          return {
            success: false,
            error: 'CORS policy violation'
          };
        }

        const corsHeaders = {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        };

        return {
          success: true,
          corsHeaders
        };
      }

      // Handle actual requests
      if (origin && !this.config.allowedOrigins.includes(origin)) {
        return {
          success: false,
          error: 'CORS policy violation'
        };
      }

      return {
        success: true,
        corsHeaders: origin ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true'
        } : {}
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CORS handling failed'
      };
    }
  }

  async checkRateLimit(request: NextRequest): Promise<AuthResult> {
    try {
      if (!this.config.enableRateLimit) {
        return { success: true };
      }

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
        return { success: true };
      }

      if (currentData.count >= this.config.rateLimitMaxRequests) {
        return {
          success: false,
          error: 'Too many requests'
        };
      }

      // Increment counter
      currentData.count++;
      this.rateLimitStore.set(clientId, currentData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rate limit check failed'
      };
    }
  }

  async processRequest(request: NextRequest, requiredRoles: string[] = []): Promise<AuthResult> {
    try {
      // Handle CORS
      const corsResult = await this.handleCORS(request);
      if (!corsResult.success) {
        return corsResult;
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.success) {
        return rateLimitResult;
      }

      // Authenticate and authorize
      const authResult = await this.authorize(request, requiredRoles);
      if (!authResult.success) {
        return authResult;
      }

      // Combine all headers
      const allHeaders = {
        ...corsResult.corsHeaders,
        ...authResult.securityHeaders
      };

      return {
        success: true,
        userId: authResult.userId,
        session: authResult.session,
        securityHeaders: allHeaders
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request processing failed'
      };
    }
  }

  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    };
  }

  private getUserRoles(user: any): string[] {
    // In a real implementation, you would get roles from the user object or database
    // For now, we'll return a default role
    return ['user'];
  }

  private getClientId(request: NextRequest): string {
    // Try to get client IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Also include user agent for more granular rate limiting
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return `${clientIp}-${userAgent}`;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<AuthMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AuthMiddlewareConfig {
    return { ...this.config };
  }

  // Utility methods
  createResponse(data: any, status: number = 200, headers: Record<string, string> = {}): NextResponse {
    return NextResponse.json(data, { status, headers });
  }

  createErrorResponse(error: string, status: number = 400, headers: Record<string, string> = {}): NextResponse {
    return NextResponse.json(
      { success: false, error },
      { status, headers }
    );
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
