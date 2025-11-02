import { authService } from '../api/AuthService';
import { BaseController, ControllerResponse } from './BaseController';
import { Sanitizers } from '../../utils/sanitization';
import { sessionManager } from '../security/SessionManager';

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * AuthController - handles authentication requests
 * Improved request/response handling with input sanitization
 */
export class AuthController extends BaseController {
  /**
   * Handle user registration request with input sanitization
   */
  public async register(request: RegisterRequest): Promise<ControllerResponse> {
    try {
      // Sanitize input
      const sanitizedEmail = Sanitizers.email(request.email);
      const sanitizedDisplayName = Sanitizers.displayName(request.displayName);
      
      // Password validation (don't sanitize password, but validate length)
      if (!request.password || request.password.length < 6) {
        return this.formatValidationError('Password must be at least 6 characters');
      }

      const response = await authService.register(
        sanitizedEmail,
        request.password,
        sanitizedDisplayName
      );

      // Initialize session after registration
      await sessionManager.initializeSession();

      return this.formatSuccessResponse(response);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle user login request with input sanitization
   */
  public async login(request: LoginRequest): Promise<ControllerResponse> {
    try {
      // Sanitize email input
      const sanitizedEmail = Sanitizers.email(request.email);
      
      if (!request.password) {
        return this.formatValidationError('Password is required');
      }

      const response = await authService.login(sanitizedEmail, request.password);

      // Initialize session after login
      await sessionManager.initializeSession();

      return this.formatSuccessResponse(response);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle user logout request
   */
  public async logout(): Promise<ControllerResponse> {
    try {
      await authService.logout();

      // Clear session
      sessionManager.clearSession();

      return this.formatSuccessResponse(undefined, 'Logged out successfully');
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }
}

