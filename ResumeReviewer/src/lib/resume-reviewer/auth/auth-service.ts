import { UserModel, User, CreateUserData } from '../models/user-model';
import { SessionModel, Session, CreateSessionData } from '../models/session-model';
import { PasswordValidator } from './password-validator';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthConfig {
  sessionExpirationHours: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
}

export class AuthService {
  private userModel: UserModel;
  private sessionModel: SessionModel;
  private passwordValidator: PasswordValidator;
  private config: AuthConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }>;

  constructor(
    userModel?: UserModel,
    sessionModel?: SessionModel,
    passwordValidator?: PasswordValidator
  ) {
    this.userModel = userModel || new UserModel();
    this.sessionModel = sessionModel || new SessionModel();
    this.passwordValidator = passwordValidator || new PasswordValidator();
    this.config = {
      sessionExpirationHours: 24,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      passwordMinLength: 8,
      requireStrongPassword: true
    };
    this.loginAttempts = new Map();
  }

  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password strength
      if (this.config.requireStrongPassword) {
        const validation = this.passwordValidator.validate(userData.password);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.errors[0] || 'Password does not meet requirements'
          };
        }
      } else if (userData.password.length < this.config.passwordMinLength) {
        return {
          success: false,
          error: `Password must be at least ${this.config.passwordMinLength} characters long`
        };
      }

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Hash password
      const passwordHash = await this.passwordValidator.hash(userData.password);

      // Create user
      const createUserData: CreateUserData = {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName
      };

      const user = await this.userModel.create(createUserData);

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  async login(loginData: LoginData): Promise<AuthResult> {
    try {
      // Validate input
      if (!loginData.email || !loginData.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(loginData.email);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.'
        };
      }

      // Find user
      const user = await this.userModel.findByEmail(loginData.email);
      if (!user) {
        this.recordFailedAttempt(loginData.email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify password
      const isPasswordValid = await this.passwordValidator.verify(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        this.recordFailedAttempt(loginData.email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(loginData.email);

      // Create session
      const session = await this.createSession(user.id);

      return {
        success: true,
        session
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  async validateSession(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token is required'
        };
      }

      const session = await this.sessionModel.findByToken(token);
      if (!session) {
        return {
          success: false,
          error: 'Invalid session'
        };
      }

      // Check if session is expired
      if (session.expiresAt <= new Date()) {
        // Clean up expired session
        await this.sessionModel.deleteByToken(token);
        return {
          success: false,
          error: 'Session expired'
        };
      }

      return {
        success: true,
        session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session validation failed'
      };
    }
  }

  async logout(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token is required'
        };
      }

      await this.sessionModel.deleteByToken(token);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  async changePassword(userId: string, passwordData: PasswordChangeData): Promise<AuthResult> {
    try {
      if (!userId || !passwordData.currentPassword || !passwordData.newPassword) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      // Validate new password strength
      if (this.config.requireStrongPassword) {
        const validation = this.passwordValidator.validate(passwordData.newPassword);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'New password must be at least 8 characters long'
          };
        }
      } else if (passwordData.newPassword.length < this.config.passwordMinLength) {
        return {
          success: false,
          error: `New password must be at least ${this.config.passwordMinLength} characters long`
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await this.userModel.verifyPassword(userId, passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Hash new password
      const newPasswordHash = await this.passwordValidator.hash(passwordData.newPassword);

      // Update password
      await this.userModel.updatePassword(userId, newPasswordHash);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      };
    }
  }

  async getCurrentUser(userId: string): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  async refreshSession(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token is required'
        };
      }

      const session = await this.sessionModel.findByToken(token);
      if (!session) {
        return {
          success: false,
          error: 'Invalid session'
        };
      }

      // Check if session is expired
      if (session.expiresAt <= new Date()) {
        await this.sessionModel.deleteByToken(token);
        return {
          success: false,
          error: 'Session expired'
        };
      }

      // Extend session
      const newExpirationDate = new Date(Date.now() + this.config.sessionExpirationHours * 60 * 60 * 1000);
      const refreshedSession = await this.sessionModel.refreshSession(token, newExpirationDate);

      return {
        success: true,
        session: refreshedSession
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const deletedCount = await this.sessionModel.invalidateAllUserSessions(userId);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session invalidation failed'
      };
    }
  }

  async validateCSRF(csrfToken: string, userId: string): Promise<boolean> {
    // In a real implementation, you would validate the CSRF token
    // For now, we'll return true as a placeholder
    return true;
  }

  private async createSession(userId: string): Promise<Session> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.config.sessionExpirationHours * 60 * 60 * 1000);

    const sessionData: CreateSessionData = {
      userId,
      token,
      expiresAt
    };

    return this.sessionModel.create(sessionData);
  }

  private generateSecureToken(): string {
    // Generate a JWT-like token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.config.sessionExpirationHours * 3600)
    })).toString('base64url');
    const signature = Buffer.from(this.generateRandomString(32)).toString('base64url');

    return `${header}.${payload}.${signature}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number } {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) {
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
    const lockoutDurationMs = this.config.lockoutDurationMinutes * 60 * 1000;

    // Reset attempts if lockout period has passed
    if (timeSinceLastAttempt > lockoutDurationMs) {
      this.loginAttempts.delete(email);
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }

    const remainingAttempts = Math.max(0, this.config.maxLoginAttempts - attempts.count);
    return {
      allowed: attempts.count < this.config.maxLoginAttempts,
      remainingAttempts
    };
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email);
    if (attempts) {
      attempts.count++;
      attempts.lastAttempt = new Date();
    } else {
      this.loginAttempts.set(email, {
        count: 1,
        lastAttempt: new Date()
      });
    }
  }

  private clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  // Configuration methods
  updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AuthConfig {
    return { ...this.config };
  }

  // Cleanup methods
  async cleanupExpiredSessions(): Promise<number> {
    return this.sessionModel.cleanupExpired();
  }

  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.sessionModel.cleanupOlderThan(cutoffDate);
  }
}
