/**
 * Interaction Model - User interaction entity with validation and business logic
 * TASK-007: Create Data Models - FR-004
 * 
 * This model represents user interactions with products in the Personal Shopping Assistant system
 * including views, likes, dislikes, and purchases for recommendation learning.
 */

export type InteractionType = 'view' | 'like' | 'dislike' | 'favorite' | 'rating' | 'purchase';

export interface InteractionEntity {
  id: number;
  userId: number;
  productId: number;
  type: InteractionType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface InteractionCreateData {
  userId: number;
  productId: number;
  type: InteractionType;
  metadata?: Record<string, any>;
}

export interface InteractionUpdateData {
  type?: InteractionType;
  metadata?: Record<string, any>;
}

export interface InteractionStats {
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueProducts: number;
  activeDays: number;
  conversionRate: number;
}

export interface InteractionAnalytics {
  userStats: InteractionStats;
  productStats: {
    totalViews: number;
    totalLikes: number;
    totalDislikes: number;
    totalPurchases: number;
    conversionRate: number;
    engagementRate: number;
  };
  categoryStats: Record<string, InteractionStats>;
  brandStats: Record<string, InteractionStats>;
}

export class Interaction {
  private _id: number;
  private _userId: number;
  private _productId: number;
  private _type: InteractionType;
  private _timestamp: Date;
  private _metadata: Record<string, any>;

  constructor(data: InteractionEntity) {
    this._id = data.id;
    this._userId = data.userId;
    this._productId = data.productId;
    this._type = data.type;
    this._timestamp = data.timestamp;
    this._metadata = data.metadata || {};
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get productId(): number {
    return this._productId;
  }

  get type(): InteractionType {
    return this._type;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  // Business logic methods

  /**
   * Check if interaction is positive (like or purchase)
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  isPositive(): boolean {
    return this._type === 'like' || this._type === 'purchase';
  }

  /**
   * Check if interaction is negative (dislike)
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  isNegative(): boolean {
    return this._type === 'dislike';
  }

  /**
   * Check if interaction is neutral (view)
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  isNeutral(): boolean {
    return this._type === 'view';
  }

  /**
   * Check if interaction is a conversion (purchase)
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  isConversion(): boolean {
    return this._type === 'purchase';
  }

  /**
   * Get interaction weight for recommendation scoring
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getWeight(): number {
    switch (this._type) {
      case 'purchase':
        return 1.0; // Highest weight
      case 'like':
        return 0.7; // High weight
      case 'dislike':
        return -0.5; // Negative weight
      case 'view':
        return 0.1; // Low weight
      default:
        return 0;
    }
  }

  /**
   * Get interaction score for analytics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  getScore(): number {
    switch (this._type) {
      case 'purchase':
        return 10; // Highest score
      case 'like':
        return 5; // High score
      case 'dislike':
        return -2; // Negative score
      case 'view':
        return 1; // Low score
      default:
        return 0;
    }
  }

  /**
   * Check if interaction is recent (within specified days)
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  isRecent(days: number = 30): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this._timestamp >= cutoffDate;
  }

  /**
   * Get time since interaction in days
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  getDaysSince(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._timestamp.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get interaction source from metadata
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  getSource(): string {
    return this._metadata.source || 'unknown';
  }

  /**
   * Check if interaction has specific metadata key
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  hasMetadata(key: string): boolean {
    return key in this._metadata;
  }

  /**
   * Get metadata value
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  getMetadataValue(key: string): any {
    return this._metadata[key];
  }

  /**
   * Update interaction data
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  updateFromData(data: InteractionUpdateData): boolean {
    let updated = false;

    if (data.type !== undefined && data.type !== this._type) {
      this._type = data.type;
      updated = true;
    }

    if (data.metadata !== undefined) {
      this._metadata = { ...data.metadata };
      updated = true;
    }

    return updated;
  }

  /**
   * Add metadata
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  addMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }

  /**
   * Remove metadata
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  removeMetadata(key: string): boolean {
    if (key in this._metadata) {
      delete this._metadata[key];
      return true;
    }
    return false;
  }

  /**
   * Convert to plain object
   */
  toJSON(): InteractionEntity {
    return {
      id: this._id,
      userId: this._userId,
      productId: this._productId,
      type: this._type,
      timestamp: this._timestamp,
      metadata: { ...this._metadata }
    };
  }

  /**
   * Create interaction from create data
   */
  static fromCreateData(data: InteractionCreateData, id: number): Interaction {
    return new Interaction({
      id,
      userId: data.userId,
      productId: data.productId,
      type: data.type,
      timestamp: new Date(),
      metadata: data.metadata || {}
    });
  }

  /**
   * Calculate interaction statistics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  static calculateStats(interactions: InteractionEntity[]): InteractionStats {
    const stats: InteractionStats = {
      totalInteractions: interactions.length,
      purchases: 0,
      likes: 0,
      dislikes: 0,
      views: 0,
      uniqueProducts: 0,
      activeDays: 0,
      conversionRate: 0
    };

    const uniqueProducts = new Set<number>();
    const activeDays = new Set<string>();

    for (const interaction of interactions) {
      switch (interaction.type) {
        case 'view':
          stats.views++;
          break;
        case 'like':
          stats.likes++;
          break;
        case 'dislike':
          stats.dislikes++;
          break;
        case 'purchase':
          stats.purchases++;
          break;
      }

      uniqueProducts.add(interaction.productId);
      activeDays.add(interaction.timestamp.toISOString().split('T')[0]);
    }

    stats.uniqueProducts = uniqueProducts.size;
    stats.activeDays = activeDays.size;
    stats.conversionRate = stats.totalInteractions > 0 ? stats.purchases / stats.totalInteractions : 0;

    return stats;
  }

  /**
   * Calculate product analytics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  static calculateProductAnalytics(
    interactions: InteractionEntity[],
    productId: number
  ): {
    totalViews: number;
    totalLikes: number;
    totalDislikes: number;
    totalPurchases: number;
    conversionRate: number;
    engagementRate: number;
  } {
    const productInteractions = interactions.filter(i => i.productId === productId);
    const stats = this.calculateStats(productInteractions);

    const conversionRate = stats.views > 0 ? stats.purchases / stats.views : 0;
    const engagementRate = stats.views > 0 ? 
      (stats.likes + stats.dislikes + stats.purchases) / stats.views : 0;

    return {
      totalViews: stats.views,
      totalLikes: stats.likes,
      totalDislikes: stats.dislikes,
      totalPurchases: stats.purchases,
      conversionRate,
      engagementRate
    };
  }

  /**
   * Calculate user analytics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  static calculateUserAnalytics(
    interactions: InteractionEntity[],
    userId: number
  ): InteractionStats {
    const userInteractions = interactions.filter(i => i.userId === userId);
    return this.calculateStats(userInteractions);
  }

  /**
   * Validate interaction data
   */
  static validate(data: Partial<InteractionEntity>): string[] {
    const errors: string[] = [];

    if (data.userId !== undefined) {
      if (typeof data.userId !== 'number' || data.userId <= 0) {
        errors.push('User ID must be a positive number');
      }
    }

    if (data.productId !== undefined) {
      if (typeof data.productId !== 'number' || data.productId <= 0) {
        errors.push('Product ID must be a positive number');
      }
    }

    if (data.type !== undefined) {
      if (!['view', 'like', 'dislike', 'favorite', 'rating', 'purchase'].includes(data.type)) {
        errors.push('Interaction type must be one of: view, like, dislike, favorite, rating, purchase');
      }
    }

    if (data.timestamp !== undefined) {
      if (!(data.timestamp instanceof Date) || isNaN(data.timestamp.getTime())) {
        errors.push('Timestamp must be a valid date');
      }
    }

    if (data.metadata !== undefined) {
      if (typeof data.metadata !== 'object' || data.metadata === null) {
        errors.push('Metadata must be an object');
      }
    }

    return errors;
  }

  /**
   * Get interaction type weights for scoring
   */
  static getTypeWeights(): Record<InteractionType, number> {
    return {
      'purchase': 1.0,
      'like': 0.7,
      'favorite': 0.9,
      'rating': 0.8,
      'dislike': -0.5,
      'view': 0.1
    };
  }

  /**
   * Get interaction type scores for analytics
   */
  static getTypeScores(): Record<InteractionType, number> {
    return {
      'purchase': 10,
      'like': 5,
      'favorite': 8,
      'rating': 6,
      'dislike': -2,
      'view': 1
    };
  }
}

// Additional type definitions for service layer
export interface ProductAnalytics {
  productId: number;
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueUsers: number;
  conversionRate: number;
  recentInteractions: number;
}

export interface UserAnalytics {
  userId: number;
  totalInteractions: number;
  purchases: number;
  likes: number;
  dislikes: number;
  views: number;
  uniqueProducts: number;
  categoriesExplored: number;
  conversionRate: number;
  weeklyInteractions: number;
  monthlyInteractions: number;
}
