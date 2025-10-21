import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../auth/auth-service';
import { AuthMiddleware } from '../middleware/auth-middleware';

export interface AuthControllerConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  sessionCookieName: string;
  sessionCookieSecure: boolean;
  sessionCookieHttpOnly: boolean;
  sessionCookieSameSite: 'strict' | 'lax' | 'none';
}

export class AuthController {
  private authService: AuthService;
  private authMiddleware: AuthMiddleware;
  private config: AuthControllerConfig;

  constructor(authService?: AuthService, authMiddleware?: AuthMiddleware, config?: Partial<AuthControllerConfig>) {
    this.authService = authService || new AuthService();
    this.authMiddleware = authMiddleware || new AuthMiddleware(this.authService);
    this.config = {
      enableCSRF: true,
      enableRateLimit: true,
      sessionCookieName: 'session_token',
      sessionCookieSecure: true,
      sessionCookieHttpOnly: true,
      sessionCookieSameSite: 'strict',
      ...config
    };
  }

  async register(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { email, password, firstName, lastName } = body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json(
          { success: false, error: 'All fields are required' },
          { status: 400 }
        );
      }

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName
      });

      if (!result.success) {
        const status = result.error === 'User already exists' ? 409 : 400;
        return NextResponse.json(
          { success: false, error: result.error },
          { status }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: result.user!.id,
            email: result.user!.email,
            firstName: result.user!.firstName,
            lastName: result.user!.lastName
          }
        },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 500 }
      );
    }
  }

  async login(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const { email, password } = body;

      // Validate required fields
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const result = await this.authService.login({ email, password });

      if (!result.success) {
        const status = result.error?.includes('Too many') ? 429 : 
                      result.error?.includes('Invalid credentials') ? 401 : 400;
        return NextResponse.json(
          { success: false, error: result.error },
          { status }
        );
      }

      // Set secure session cookie
      const cookieHeader = this.createSessionCookie(result.session!.token, result.session!.expiresAt);

      return NextResponse.json(
        {
          success: true,
          session: {
            id: result.session!.id,
            token: result.session!.token,
            expiresAt: result.session!.expiresAt.toISOString()
          }
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': cookieHeader,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 500 }
      );
    }
  }

  async logout(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No authorization token provided' },
          { status: 400 }
        );
      }

      const token = authHeader.substring(7);
      const result = await this.authService.logout(token);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      // Clear session cookie
      const clearCookieHeader = this.createClearCookieHeader();

      return NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        {
          status: 200,
          headers: {
            'Set-Cookie': clearCookieHeader
          }
        }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Logout failed' },
        { status: 500 }
      );
    }
  }

  async getCurrentUser(request: NextRequest): Promise<NextResponse> {
    try {
      // Check CSRF token if enabled
      if (this.config.enableCSRF) {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken) {
          return NextResponse.json(
            { success: false, error: 'CSRF token required' },
            { status: 403 }
          );
        }
      }

      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No authorization token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      // Validate session
      const sessionResult = await this.authService.validateSession(token);
      if (!sessionResult.success) {
        return NextResponse.json(
          { success: false, error: sessionResult.error },
          { status: 401 }
        );
      }

      // Get user details
      const userResult = await this.authService.getCurrentUser(sessionResult.session!.userId);
      if (!userResult.success) {
        return NextResponse.json(
          { success: false, error: userResult.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: userResult.user!.id,
            email: userResult.user!.email,
            firstName: userResult.user!.firstName,
            lastName: userResult.user!.lastName
          }
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user information' },
        { status: 500 }
      );
    }
  }

  async changePassword(request: NextRequest): Promise<NextResponse> {
    try {
      // Check CSRF token if enabled
      if (this.config.enableCSRF) {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken) {
          return NextResponse.json(
            { success: false, error: 'CSRF token required' },
            { status: 403 }
          );
        }
      }

      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No authorization token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      // Validate session
      const sessionResult = await this.authService.validateSession(token);
      if (!sessionResult.success) {
        return NextResponse.json(
          { success: false, error: sessionResult.error },
          { status: 401 }
        );
      }

      const body = await request.json();
      const { currentPassword, newPassword } = body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password and new password are required' },
          { status: 400 }
        );
      }

      const result = await this.authService.changePassword(sessionResult.session!.userId, {
        currentPassword,
        newPassword
      });

      if (!result.success) {
        const status = result.error?.includes('incorrect') ? 400 : 500;
        return NextResponse.json(
          { success: false, error: result.error },
          { status }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Password changed successfully' },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Password change failed' },
        { status: 500 }
      );
    }
  }

  async refreshSession(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No authorization token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const result = await this.authService.refreshSession(token);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }

      // Update session cookie
      const cookieHeader = this.createSessionCookie(result.session!.token, result.session!.expiresAt);

      return NextResponse.json(
        {
          success: true,
          session: {
            id: result.session!.id,
            token: result.session!.token,
            expiresAt: result.session!.expiresAt.toISOString()
          }
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': cookieHeader
          }
        }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Session refresh failed' },
        { status: 500 }
      );
    }
  }

  async invalidateAllSessions(request: NextRequest): Promise<NextResponse> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No authorization token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      // Validate session
      const sessionResult = await this.authService.validateSession(token);
      if (!sessionResult.success) {
        return NextResponse.json(
          { success: false, error: sessionResult.error },
          { status: 401 }
        );
      }

      const result = await this.authService.invalidateAllUserSessions(sessionResult.session!.userId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      // Clear session cookie
      const clearCookieHeader = this.createClearCookieHeader();

      return NextResponse.json(
        { success: true, message: 'All sessions invalidated' },
        {
          status: 200,
          headers: {
            'Set-Cookie': clearCookieHeader
          }
        }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Session invalidation failed' },
        { status: 500 }
      );
    }
  }

  private createSessionCookie(token: string, expiresAt: Date): string {
    const cookieOptions = [
      `${this.config.sessionCookieName}=${token}`,
      `Expires=${expiresAt.toUTCString()}`,
      `Path=/`,
      this.config.sessionCookieSecure ? 'Secure' : '',
      this.config.sessionCookieHttpOnly ? 'HttpOnly' : '',
      `SameSite=${this.config.sessionCookieSameSite}`
    ].filter(Boolean).join('; ');

    return cookieOptions;
  }

  private createClearCookieHeader(): string {
    const cookieOptions = [
      `${this.config.sessionCookieName}=`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'Path=/',
      this.config.sessionCookieSecure ? 'Secure' : '',
      this.config.sessionCookieHttpOnly ? 'HttpOnly' : '',
      `SameSite=${this.config.sessionCookieSameSite}`
    ].filter(Boolean).join('; ');

    return cookieOptions;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<AuthControllerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AuthControllerConfig {
    return { ...this.config };
  }

  // Health check method
  async healthCheck(): Promise<NextResponse> {
    try {
      // Check if auth service is responsive
      const testResult = await this.authService.validateSession('test-token');
      
      return NextResponse.json(
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            authService: 'healthy',
            sessionManagement: 'healthy'
          }
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 }
      );
    }
  }
}
