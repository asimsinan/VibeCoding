import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { DatabaseService } from '../video-conferencing/services/database.service';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateUser {
  email: string;
  name: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private databaseService: DatabaseService;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly SALT_ROUNDS = 12;
  private blacklistedTokens: Set<string>;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    this.blacklistedTokens = new Set<string>();
  }

  private validateEmail(email: string): boolean {
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Additional checks
    if (email.length > 254) return false; // RFC 5321 limit
    if (email.includes('..')) return false; // No consecutive dots
    if (email.startsWith('.') || email.endsWith('.')) return false; // No leading/trailing dots
    if (email.includes('@.') || email.includes('.@')) return false; // No dots around @
    
    return true;
  }

  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Check for malicious patterns first - if found, reject entirely
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /alert\s*\(/i,
      /document\./i,
      /window\./i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link/i,
      /<meta/i,
      /<style/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /'\s*;\s*drop/i,
      /'\s*;\s*delete/i,
      /'\s*;\s*insert/i,
      /'\s*;\s*update/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially malicious input detected');
      }
    }

    // If no malicious patterns, return sanitized version
    return input
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .trim();
  }

  private validateAndSanitizeUserInput(userData: CreateUser): { isValid: boolean; errors: string[]; sanitizedData: CreateUser } {
    const errors: string[] = [];
    
    // Validate email
    if (!this.validateEmail(userData.email)) {
      errors.push('Invalid email format');
    }
    
    // Validate password
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    // Validate name length
    if (userData.name.length < 2 || userData.name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
    
    // Sanitize inputs
    const sanitizedData: CreateUser = {
      email: userData.email.toLowerCase().trim(),
      name: this.sanitizeInput(userData.name),
      password: userData.password // Don't sanitize password as it needs to remain exact
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Initialize the auth service
   */
  async initialize(): Promise<void> {
    if (!this.databaseService.isConnected()) {
      await this.databaseService.initialize();
    }

    // Create users table if it doesn't exist
    await this.createUsersTable();
  }

  /**
   * Create users table
   */
  private async createUsersTable(): Promise<void> {
    // Table creation is handled by Supabase migrations
    // No need for manual table creation
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUser): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Validate and sanitize input
      const validation = this.validateAndSanitizeUserInput(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedData = validation.sanitizedData;

      // Check if user already exists
      const existingUser = await this.getUserByEmail(sanitizedData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hash(sanitizedData.password, this.SALT_ROUNDS);

      // Create user using direct Supabase client
      const userId = crypto.randomUUID();
      const supabase = this.databaseService.getSupabaseClient();
      
      const { data, error } = await (supabase as any)
        .from('user')
        .insert({
          id: userId,
          email: sanitizedData.email.toLowerCase(),
          name: sanitizedData.name,
          password_hash: passwordHash
        })
        .select('id, email, name, created_at, updated_at')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`);
      }

      const user = this.mapDbUserToUser(data);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Validate input
      this.validateLoginCredentials(credentials);

      // Get user by email (case-insensitive)
      const user = await this.getUserByEmail(credentials.email.toLowerCase());
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await compare(credentials.password, user.passwordHash);
      
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await this.getUserById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = verify(token, this.JWT_SECRET) as JwtPayload;
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Alias for verifyToken for backward compatibility
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    // Check if token is blacklisted first
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }
    
    return this.verifyToken(token);
  }

  /**
   * Get user by ID (using direct Supabase client)
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const supabase = this.databaseService.getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from('user')
        .select('id, email, name, created_at, updated_at')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return null;
      }

      return this.mapDbUserToUser(data);
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by email (using direct Supabase client)
   */
  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      const supabase = this.databaseService.getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from('user')
        .select('id, email, name, password_hash, created_at, updated_at')
        .eq('email', email.toLowerCase());
      
      if (error) {
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }

      return this.mapDbUserToUserWithPassword(data[0]);
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Pick<User, 'name'>>): Promise<User> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) {
        updateData.name = updates.name;
      }

      if (Object.keys(updateData).length === 1) { // Only updated_at
        throw new Error('No updates provided');
      }

      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, name, is_active, created_at, updated_at, last_login')
        .single();
      
      if (error || !data) {
        throw new Error('User not found');
      }

      return this.mapDbUserToUser(data);
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user with password
      const user = await this.getUserByEmail(await this.getUserEmailById(userId));
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await hash(newPassword, this.SALT_ROUNDS);

      // Update password using direct Supabase client
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .update({ 
          password_hash: newPasswordHash, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return 'If the email exists, a reset link has been sent';
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token using direct Supabase client
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .update({ 
          reset_token: resetToken, 
          reset_token_expires: resetTokenExpires.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return 'If the email exists, a reset link has been sent';
    } catch (error) {
      throw new Error(`Failed to request password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Find user by reset token
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .select('id')
        .eq('reset_token', resetToken)
        .gt('reset_token_expires', new Date().toISOString())
        .single();
      
      if (error || !data) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = data.id;

      // Hash new password
      const passwordHash = await hash(newPassword, this.SALT_ROUNDS);

      // Update password and clear reset token
      const { error: updateError } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .update({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      throw new Error(`Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(verificationToken: string): Promise<void> {
    try {
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .update({
          is_verified: true,
          verification_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('verification_token', verificationToken);
      
      if (error) {
        throw new Error('Invalid verification token');
      }
    } catch (error) {
      throw new Error(`Failed to verify email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string, password: string): Promise<void> {
    try {
      // Verify password
      const user = await this.getUserByEmail(await this.getUserEmailById(userId));
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Delete user
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('user')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    // Add current timestamp and random component to ensure unique tokens
    const now = Math.floor(Date.now() / 1000);
    const randomId = Math.random().toString(36).substr(2, 9);
    
    const accessTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      type: 'access',
      jti: `${user.id}-access-${now}-${randomId}` // Unique token ID
    };

    const refreshTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
      jti: `${user.id}-refresh-${now}-${randomId}` // Unique refresh token ID
    };

    const accessToken = sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = sign(refreshTokenPayload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token (with blacklist check)
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify refresh token
      const payload = verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await this.getUserById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Blacklist the old refresh token BEFORE generating new ones
      await this.blacklistToken(refreshToken);

      // Generate completely new tokens with fresh timestamps
      const newTokens = await this.generateTokens(user);
      
      // Verify the new tokens are different
      if (newTokens.accessToken === refreshToken) {
        throw new Error('Token refresh failed - same token generated');
      }

      return newTokens;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // In a real implementation, check Redis for blacklisted tokens
      // For testing, we'll use a simple in-memory set
      return this.blacklistedTokens.has(token);
    } catch (error) {
      console.error('Token blacklist check failed:', error);
      return false;
    }
  }

  /**
   * Add token to blacklist
   */
  private async blacklistToken(token: string): Promise<void> {
    try {
      // In a real implementation, add token to Redis with expiration
      // For testing, we'll use a simple in-memory set
      this.blacklistedTokens.add(token);
    } catch (error) {
      console.error('Token blacklisting failed:', error);
    }
  }

  /**
   * Get user profile by ID (with authorization check)
   */
  async getUserProfile(userId: string, requestingUserId?: string): Promise<User> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }

      // Authorization check - users can only access their own profile
      if (requestingUserId && requestingUserId !== userId) {
        throw new Error('Unauthorized access to user profile');
      } else if (!requestingUserId) {
        // For security tests, require requestingUserId for profile access
        throw new Error('User profile access requires authentication');
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile (with authorization check)
   */
  async updateUserProfile(userId: string, updates: Partial<Pick<User, 'name'>>, requestingUserId?: string): Promise<User> {
    try {
      // Authorization check - users can only update their own profile
      if (requestingUserId && requestingUserId !== userId) {
        throw new Error('Unauthorized profile update');
      } else if (!requestingUserId) {
        // For security tests, require requestingUserId for profile updates
        throw new Error('User profile update requires authentication');
      }

      // Validate and sanitize updates
      if (updates.name) {
        updates.name = this.sanitizeInput(updates.name);
        if (updates.name.length < 2 || updates.name.length > 100) {
          throw new Error('Name must be between 2 and 100 characters');
        }
      }

      return await this.updateUser(userId, updates);
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    try {
      // Verify refresh token to get user ID
      const payload = verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Blacklist the refresh token
      await this.blacklistToken(refreshToken);

      // Also blacklist the access token if provided
      if (accessToken) {
        await this.blacklistToken(accessToken);
      }

      // In a real implementation, you would also:
      // 1. Blacklist all access tokens for this user
      // 2. Remove the token from the user's active sessions
      // 3. Log the logout event
      
    } catch (error) {
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await (this.databaseService.getSupabaseClient() as any)
      .from('user')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Get user email by ID
   */
  private async getUserEmailById(userId: string): Promise<string> {
    const { data, error } = await (this.databaseService.getSupabaseClient() as any)
      .from('user')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      throw new Error('User not found');
    }

    return data.email;
  }

  /**
   * Map database user to User object
   */
  private mapDbUserToUser(dbUser: any): User {
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
    
    if (dbUser.last_login) {
      user.lastLogin = new Date(dbUser.last_login);
    }
    
    return user;
  }

  /**
   * Map database user to User object with password
   */
  private mapDbUserToUserWithPassword(dbUser: any): User & { passwordHash: string } {
    const user: User & { passwordHash: string } = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      passwordHash: dbUser.password_hash
    };
    
    if (dbUser.last_login) {
      user.lastLogin = new Date(dbUser.last_login);
    }
    
    return user;
  }


  /**
   * Validate login credentials
   */
  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!credentials.password) {
      throw new Error('Password is required');
    }
  }
}
