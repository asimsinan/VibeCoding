/**
 * User Model - Core user entity with validation and business logic
 * TASK-007: Create Data Models - FR-007
 * 
 * This model represents a user in the Personal Shopping Assistant system
 * with authentication data, preferences, and business logic methods.
 */

import { UserPreferences } from './UserPreferences';
import { InteractionEntity } from './Interaction';

export interface UserEntity {
  id: number;
  email: string;
  passwordHash: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateData {
  email: string;
  password: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
    stylePreferences: string[];
  };
}

export interface UserUpdateData {
  email?: string;
  password?: string;
  preferences?: Partial<{
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
    stylePreferences: string[];
  }>;
}

export interface UserProfile {
  id: number;
  email: string;
  preferences: UserPreferences;
  interactionStats: {
    totalInteractions: number;
    purchases: number;
    likes: number;
    views: number;
    dislikes: number;
  };
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private _id: number;
  private _email: string;
  private _passwordHash: string;
  private _preferences: UserPreferences;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: UserEntity) {
    this._id = data.id;
    this._email = data.email;
    this._passwordHash = data.passwordHash;
    this._preferences = data.preferences;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get preferences(): UserPreferences {
    return this._preferences;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods

  /**
   * Check if user has specific category preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasCategoryPreference(category: string): boolean {
    return this._preferences.categories.includes(category);
  }

  /**
   * Check if user has specific brand preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasBrandPreference(brand: string): boolean {
    return this._preferences.brands.includes(brand);
  }

  /**
   * Check if price is within user's preferred range
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  isPriceInRange(price: number): boolean {
    return price >= this._preferences.priceRange.min && 
           price <= this._preferences.priceRange.max;
  }

  /**
   * Check if user has specific style preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasStylePreference(style: string): boolean {
    return this._preferences.stylePreferences.includes(style);
  }

  /**
   * Get user's preference score for a product
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences
   */
  getPreferenceScore(product: {
    category: string;
    brand: string;
    price: number;
    style?: string;
  }): number {
    let score = 0;
    let factors = 0;

    // Category preference (40% weight)
    if (this.hasCategoryPreference(product.category)) {
      score += 0.4;
    }
    factors += 0.4;

    // Brand preference (30% weight)
    if (this.hasBrandPreference(product.brand)) {
      score += 0.3;
    }
    factors += 0.3;

    // Price range (20% weight)
    if (this.isPriceInRange(product.price)) {
      score += 0.2;
    }
    factors += 0.2;

    // Style preference (10% weight)
    if (product.style && this.hasStylePreference(product.style)) {
      score += 0.1;
    }
    if (product.style) {
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Update user preferences
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  updatePreferences(newPreferences: Partial<{
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
    stylePreferences: string[];
  }>): void {
    if (newPreferences.categories !== undefined) {
      this._preferences.categories = newPreferences.categories;
    }
    if (newPreferences.priceRange !== undefined) {
      this._preferences.priceRange = newPreferences.priceRange;
    }
    if (newPreferences.brands !== undefined) {
      this._preferences.brands = newPreferences.brands;
    }
    if (newPreferences.stylePreferences !== undefined) {
      this._preferences.stylePreferences = newPreferences.stylePreferences;
    }
    this._updatedAt = new Date();
  }

  /**
   * Get user profile with interaction statistics
   * FR-007: System MUST support user authentication and profile management
   */
  async getProfile(interactions: InteractionEntity[]): Promise<UserProfile> {
    const stats = this.calculateInteractionStats(interactions);
    
    return {
      id: this._id,
      email: this._email,
      preferences: this._preferences,
      interactionStats: stats,
      lastActiveAt: this.getLastActiveAt(interactions),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * Calculate interaction statistics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  private calculateInteractionStats(interactions: InteractionEntity[]): {
    totalInteractions: number;
    purchases: number;
    likes: number;
    views: number;
    dislikes: number;
  } {
    const userInteractions = interactions.filter(i => i.userId === this._id);
    
    const totalViews = userInteractions.filter(i => i.type === 'view').length;
    const totalLikes = userInteractions.filter(i => i.type === 'like').length;
    const totalDislikes = userInteractions.filter(i => i.type === 'dislike').length;
    const totalPurchases = userInteractions.filter(i => i.type === 'purchase').length;

    // Calculate favorite categories and brands from interactions
    const categoryCounts = new Map<string, number>();
    const brandCounts = new Map<string, number>();

    userInteractions.forEach(interaction => {
      if (interaction.metadata?.category) {
        const count = categoryCounts.get(interaction.metadata.category) || 0;
        categoryCounts.set(interaction.metadata.category, count + 1);
      }
      if (interaction.metadata?.brand) {
        const count = brandCounts.get(interaction.metadata.brand) || 0;
        brandCounts.set(interaction.metadata.brand, count + 1);
      }
    });

    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    const favoriteBrands = Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);

    return {
      totalInteractions: userInteractions.length,
      purchases: totalPurchases,
      likes: totalLikes,
      views: totalViews,
      dislikes: totalDislikes
    };
  }

  /**
   * Get last active timestamp from interactions
   */
  private getLastActiveAt(interactions: InteractionEntity[]): Date {
    const userInteractions = interactions.filter(i => i.userId === this._id);
    if (userInteractions.length === 0) {
      return this._createdAt;
    }
    
    const latestInteraction = userInteractions.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    return latestInteraction.timestamp;
  }

  /**
   * Convert to plain object
   */
  toJSON(): UserEntity {
    return {
      id: this._id,
      email: this._email,
      passwordHash: this._passwordHash,
      preferences: this._preferences,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * Create user from create data
   */
  static fromCreateData(data: UserCreateData, id: number): User {
    const now = new Date();
    return new User({
      id,
      email: data.email,
      passwordHash: '', // Will be set by service layer
      preferences: {
        id: 0, // Will be set by database
        userId: id,
        categories: data.preferences.categories,
        priceRange: data.preferences.priceRange,
        brands: data.preferences.brands,
        stylePreferences: data.preferences.stylePreferences,
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Validate user data
   */
  static validate(data: Partial<UserEntity>): string[] {
    const errors: string[] = [];

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.preferences) {
      if (data.preferences.priceRange) {
        if (data.preferences.priceRange.min < 0) {
          errors.push('Minimum price cannot be negative');
        }
        if (data.preferences.priceRange.max < data.preferences.priceRange.min) {
          errors.push('Maximum price must be greater than minimum price');
        }
      }

      if (data.preferences.categories && data.preferences.categories.length > 20) {
        errors.push('Too many categories (maximum 20)');
      }

      if (data.preferences.brands && data.preferences.brands.length > 20) {
        errors.push('Too many brands (maximum 20)');
      }

      if (data.preferences.stylePreferences && data.preferences.stylePreferences.length > 10) {
        errors.push('Too many style preferences (maximum 10)');
      }
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }
}

// Additional type definitions for service layer
export type UserLoginData = {
  email: string;
  password: string;
};

export type UserRegisterData = UserCreateData & {
  password: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
    stylePreferences: string[];
  };
};
