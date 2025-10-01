import { DatabaseService } from '../../backend/src/services/DatabaseService';
import { User, UserEntity, UserCreateData, UserUpdateData, UserProfile, UserLoginData, UserRegisterData } from '../recommendation-engine/models/User';
import { UserPreferencesModel, UserPreferencesCreateData, UserPreferencesUpdateData } from '../recommendation-engine/models/UserPreferences';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface UserServiceInterface {
  register(userData: UserRegisterData): Promise<{ user: UserEntity; token: string }>;
  login(loginData: UserLoginData): Promise<{ user: UserEntity; token: string }>;
  getProfile(userId: number): Promise<UserProfile>;
  updateProfile(userId: number, updateData: UserUpdateData): Promise<UserEntity>;
  getUserPreferences(userId: number): Promise<UserPreferencesModel>;
  updatePreferences(userId: number, preferencesData: UserPreferencesUpdateData): Promise<UserPreferencesModel>;
  deleteUser(userId: number): Promise<boolean>;
  validateToken(token: string): Promise<{ userId: number; email: string }>;
  refreshToken(userId: number): Promise<string>;
}

export class UserService implements UserServiceInterface {
  private db: DatabaseService;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Register a new user
   * FR-001: System MUST allow users to create accounts with email and password
   */
  async register(userData: UserRegisterData): Promise<{ user: UserEntity; token: string }> {
    // Validate input data
    const errors = this.validateUserData({ email: userData.email, password: userData.password });
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      const { conflictError } = require('../../backend/src/middleware/errorHandler');
      throw conflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user preferences
    const defaultPreferences = UserPreferencesModel.getDefaultPreferences(0); // Will be updated after user creation
    const preferencesData: UserPreferencesCreateData = {
      ...defaultPreferences,
      ...userData.preferences
    };

    // Start transaction
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW()) 
         RETURNING id, email, password_hash, created_at, updated_at`,
        [userData.email, passwordHash]
      );

      const userId = userResult.rows[0].id;

      // Insert user preferences
      const preferencesResult = await client.query(
        `INSERT INTO user_preferences (user_id, categories, price_range_min, price_range_max, brands, style_preferences, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, user_id, categories, price_range_min, price_range_max, brands, style_preferences, created_at, updated_at`,
        [
          userId,
          preferencesData.categories,
          preferencesData.priceRange.min,
          preferencesData.priceRange.max,
          preferencesData.brands,
          preferencesData.stylePreferences
        ]
      );

      await client.query('COMMIT');

      // Create user entity
      const user = new User({
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        passwordHash: userResult.rows[0].password_hash,
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at,
        preferences: new UserPreferencesModel({
          id: preferencesResult.rows[0].id,
          userId: preferencesResult.rows[0].user_id,
          categories: preferencesResult.rows[0].categories,
          priceRange: {
            min: preferencesResult.rows[0].price_range_min,
            max: preferencesResult.rows[0].price_range_max
          },
          brands: preferencesResult.rows[0].brands,
          stylePreferences: preferencesResult.rows[0].style_preferences,
          createdAt: preferencesResult.rows[0].created_at,
          updatedAt: preferencesResult.rows[0].updated_at
        })
      });

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      return { user, token };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Login user
   * FR-001: System MUST allow users to authenticate with email and password
   */
  async login(loginData: UserLoginData): Promise<{ user: UserEntity; token: string }> {
    // Validate input data
    const errors = this.validateUserData({ email: loginData.email, password: loginData.password });
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Find user by email
    const user = await this.findUserByEmail(loginData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  /**
   * Get user profile with interaction statistics
   * FR-001: System MUST allow users to view their profile and preferences
   */
  async getProfile(userId: number): Promise<UserProfile> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get interaction statistics
    const statsResult = await this.db.query(
      `SELECT 
         COUNT(*) as total_interactions,
         COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
         COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN type = 'view' THEN 1 END) as views,
         COUNT(CASE WHEN type = 'dislike' THEN 1 END) as dislikes
       FROM interactions 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0];

    return {
      id: user.id,
      email: user.email,
      preferences: user.preferences,
      interactionStats: {
        totalInteractions: parseInt(stats.total_interactions),
        purchases: parseInt(stats.purchases),
        likes: parseInt(stats.likes),
        views: parseInt(stats.views),
        dislikes: parseInt(stats.dislikes)
      },
      lastActiveAt: new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Update user profile
   * FR-001: System MUST allow users to update their profile information
   */
  async updateProfile(userId: number, updateData: UserUpdateData): Promise<UserEntity> {
    // Validate input data
    const errors = this.validateUserData({ email: updateData.email || '', password: updateData.password || '' });
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if user exists
    const existingUser = await this.findUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.findUserByEmail(updateData.email);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updateData.email);
    }

    if (updateData.password) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(updateData.password, saltRounds);
      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return existingUser; // No changes to make
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash, created_at, updated_at
    `;

    const result = await this.db.query(query, values);
    const updatedUserData = result.rows[0];

    // Get updated preferences
    const preferences = await this.getUserPreferences(userId);

    return new User({
      id: updatedUserData.id,
      email: updatedUserData.email,
      passwordHash: updatedUserData.password_hash,
      createdAt: updatedUserData.created_at,
      updatedAt: updatedUserData.updated_at,
      preferences
    });
  }

  /**
   * Update user preferences
   * FR-001: System MUST allow users to update their preferences
   */
  async updatePreferences(userId: number, preferencesData: UserPreferencesUpdateData): Promise<UserPreferencesModel> {
    // Validate input data
    const errors = UserPreferencesModel.validate(preferencesData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if user exists
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get current preferences
    const currentPreferences = await this.getUserPreferences(userId);
    
    // Update preferences
    const updated = currentPreferences.updateFromData(preferencesData);
    
    if (!updated) {
      return currentPreferences; // No changes made
    }

    // Update database
    const result = await this.db.query(
      `UPDATE user_preferences 
       SET categories = $1, price_range_min = $2, price_range_max = $3, brands = $4, style_preferences = $5, updated_at = NOW()
       WHERE user_id = $6
       RETURNING id, user_id, categories, price_range_min, price_range_max, brands, style_preferences, created_at, updated_at`,
      [
        currentPreferences.categories,
        currentPreferences.priceRange.min,
        currentPreferences.priceRange.max,
        currentPreferences.brands,
        currentPreferences.stylePreferences,
        userId
      ]
    );

    const updatedData = result.rows[0];
    console.log('🔍 UserService: Updated data from database:', updatedData);
    const preferences = new UserPreferencesModel({
      id: updatedData.id,
      userId: updatedData.user_id,
      categories: updatedData.categories,
      priceRange: {
        min: updatedData.price_range_min,
        max: updatedData.price_range_max
      },
      brands: updatedData.brands,
      stylePreferences: updatedData.style_preferences,
      createdAt: updatedData.created_at,
      updatedAt: updatedData.updated_at
    });
    console.log('🔍 UserService: Returning preferences:', preferences);
    return preferences;
  }

  /**
   * Delete user account
   * FR-001: System MUST allow users to delete their accounts
   */
  async deleteUser(userId: number): Promise<boolean> {
    // Check if user exists
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Start transaction
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Delete user data in correct order (respecting foreign key constraints)
      await client.query('DELETE FROM interactions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM recommendations WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Validate JWT token
   * FR-001: System MUST provide secure authentication
   */
  async validateToken(token: string): Promise<{ userId: number; email: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: number; email: string };
      
      // Verify user still exists
      const user = await this.findUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh JWT token
   * FR-001: System MUST provide secure authentication
   */
  async refreshToken(userId: number): Promise<string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.generateToken(userId, user.email);
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.query(
      `SELECT u.id, u.email, u.password_hash, u.created_at, u.updated_at,
              up.id as pref_id, up.user_id, up.categories, up.price_range_min, up.price_range_max, up.brands, up.style_preferences, up.created_at as pref_created_at, up.updated_at as pref_updated_at
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToUser(row);
  }

  /**
   * Find user by ID
   */
  private async findUserById(userId: number): Promise<UserEntity | null> {
    const result = await this.db.query(
      `SELECT u.id, u.email, u.password_hash, u.created_at, u.updated_at,
              up.id as pref_id, up.user_id, up.categories, up.price_range_min, up.price_range_max, up.brands, up.style_preferences, up.created_at as pref_created_at, up.updated_at as pref_updated_at
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToUser(row);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: number): Promise<UserPreferencesModel> {
    const result = await this.db.query(
      `SELECT id, user_id, categories, price_range_min, price_range_max, brands, style_preferences, created_at, updated_at
       FROM user_preferences 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User preferences not found');
    }

    const row = result.rows[0];
    return new UserPreferencesModel({
      id: row.id,
      userId: row.user_id,
      categories: row.categories,
      priceRange: {
        min: row.price_range_min,
        max: row.price_range_max
      },
      brands: row.brands,
      stylePreferences: row.style_preferences,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Map database row to UserEntity
   */
  private mapRowToUser(row: any): UserEntity {
    const preferences = row.pref_id ? new UserPreferencesModel({
      id: row.pref_id,
      userId: row.pref_user_id,
      categories: row.categories,
      priceRange: {
        min: row.price_range_min,
        max: row.price_range_max
      },
      brands: row.brands,
      stylePreferences: row.style_preferences,
      createdAt: row.pref_created_at,
      updatedAt: row.pref_updated_at
    }) : new UserPreferencesModel({
      id: 0,
      userId: row.id,
      categories: [],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      preferences
    });
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: number, email: string): string {
    return jwt.sign(
      { userId, email },
      this.jwtSecret
    ) as string;
  }

  /**
   * Validate user data
   */
  private validateUserData(data: { email: string; password: string }): string[] {
    const errors: string[] = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }
}
