/**
 * Recommendation Model - Recommendation entity with validation and business logic
 * TASK-007: Create Data Models - FR-002
 * 
 * This model represents product recommendations in the Personal Shopping Assistant system
 * with scoring, algorithms, and expiration management.
 */

export type RecommendationAlgorithm = 'collaborative' | 'content-based' | 'hybrid' | 'popularity';

export interface RecommendationEntity {
  id: number;
  userId: number;
  productId: number;
  score: number;
  algorithm: RecommendationAlgorithm;
  createdAt: Date;
  expiresAt: Date;
}

export interface RecommendationCreateData {
  userId: number;
  productId: number;
  score: number;
  algorithm: RecommendationAlgorithm;
  expiresAt: Date;
}

export interface RecommendationUpdateData {
  score?: number;
  expiresAt?: Date;
}

export interface RecommendationResult {
  productId: number;
  score: number;
  algorithm: RecommendationAlgorithm;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  expiresAt: Date;
}

export interface RecommendationBatch {
  userId: number;
  recommendations: RecommendationResult[];
  totalCount: number;
  generatedAt: Date;
  expiresAt: Date;
}

export interface RecommendationStats {
  totalRecommendations: number;
  averageScore: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  algorithmDistribution: Record<RecommendationAlgorithm, number>;
  expirationStats: {
    expired: number;
    expiringSoon: number; // Within 24 hours
    active: number;
  };
}

export class Recommendation {
  private _id: number;
  private _userId: number;
  private _productId: number;
  private _score: number;
  private _algorithm: RecommendationAlgorithm;
  private _createdAt: Date;
  private _expiresAt: Date;

  constructor(data: RecommendationEntity) {
    this._id = data.id;
    this._userId = data.userId;
    this._productId = data.productId;
    this._score = data.score;
    this._algorithm = data.algorithm;
    this._createdAt = data.createdAt;
    this._expiresAt = data.expiresAt;
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

  get score(): number {
    return this._score;
  }

  get algorithm(): RecommendationAlgorithm {
    return this._algorithm;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  // Business logic methods

  /**
   * Check if recommendation is expired
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * Check if recommendation is expiring soon
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  isExpiringSoon(hours: number = 24): boolean {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() + hours);
    return this._expiresAt <= cutoffTime && !this.isExpired();
  }

  /**
   * Get time until expiration in hours
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getHoursUntilExpiration(): number {
    if (this.isExpired()) {
      return 0;
    }
    
    const now = new Date();
    const diffTime = this._expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  /**
   * Get confidence level based on score
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getConfidenceLevel(): 'low' | 'medium' | 'high' {
    if (this._score >= 0.8) {
      return 'high';
    } else if (this._score >= 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recommendation reason based on algorithm and score
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getReason(): string {
    const confidence = this.getConfidenceLevel();
    
    switch (this._algorithm) {
      case 'collaborative':
        return `Users with similar preferences ${confidence === 'high' ? 'strongly' : 'moderately'} liked this product`;
      case 'content-based':
        return `This product ${confidence === 'high' ? 'strongly' : 'moderately'} matches your preferences`;
      case 'hybrid':
        return `Based on your preferences and similar users, this product ${confidence === 'high' ? 'strongly' : 'moderately'} matches your interests`;
      default:
        return 'This product was recommended for you';
    }
  }

  /**
   * Check if recommendation is high quality
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  isHighQuality(): boolean {
    return this._score >= 0.7 && !this.isExpired();
  }

  /**
   * Check if recommendation is low quality
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  isLowQuality(): boolean {
    return this._score < 0.3 || this.isExpired();
  }

  /**
   * Get recommendation result for API response
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getResult(): RecommendationResult {
    return {
      productId: this._productId,
      score: this._score,
      algorithm: this._algorithm,
      confidence: this.getConfidenceLevel(),
      reason: this.getReason(),
      expiresAt: this._expiresAt
    };
  }

  /**
   * Update recommendation data
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  updateFromData(data: RecommendationUpdateData): boolean {
    let updated = false;

    if (data.score !== undefined && data.score !== this._score) {
      this._score = data.score;
      updated = true;
    }

    if (data.expiresAt !== undefined && data.expiresAt.getTime() !== this._expiresAt.getTime()) {
      this._expiresAt = data.expiresAt;
      updated = true;
    }

    return updated;
  }

  /**
   * Extend expiration time
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  extendExpiration(hours: number): void {
    const newExpiration = new Date(this._expiresAt);
    newExpiration.setHours(newExpiration.getHours() + hours);
    this._expiresAt = newExpiration;
  }

  /**
   * Get age in hours
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  getAgeInHours(): number {
    const now = new Date();
    const diffTime = now.getTime() - this._createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60));
  }

  /**
   * Check if recommendation is fresh (less than specified hours old)
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  isFresh(maxAgeHours: number = 24): boolean {
    return this.getAgeInHours() < maxAgeHours;
  }

  /**
   * Convert to plain object
   */
  toJSON(): RecommendationEntity {
    return {
      id: this._id,
      userId: this._userId,
      productId: this._productId,
      score: this._score,
      algorithm: this._algorithm,
      createdAt: this._createdAt,
      expiresAt: this._expiresAt
    };
  }

  /**
   * Create recommendation from create data
   */
  static fromCreateData(data: RecommendationCreateData, id: number): Recommendation {
    return new Recommendation({
      id,
      userId: data.userId,
      productId: data.productId,
      score: data.score,
      algorithm: data.algorithm,
      createdAt: new Date(),
      expiresAt: data.expiresAt
    });
  }

  /**
   * Calculate recommendation statistics
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  static calculateStats(recommendations: RecommendationEntity[]): RecommendationStats {
    const stats: RecommendationStats = {
      totalRecommendations: recommendations.length,
      averageScore: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      algorithmDistribution: {
        'collaborative': 0,
        'content-based': 0,
        'hybrid': 0,
        'popularity': 0
      },
      expirationStats: {
        expired: 0,
        expiringSoon: 0,
        active: 0
      }
    };

    if (recommendations.length === 0) {
      return stats;
    }

    let totalScore = 0;
    const now = new Date();
    const expiringSoonTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    for (const rec of recommendations) {
      totalScore += rec.score;

      // Count confidence levels
      if (rec.score >= 0.8) {
        stats.highConfidenceCount++;
      } else if (rec.score >= 0.5) {
        stats.mediumConfidenceCount++;
      } else {
        stats.lowConfidenceCount++;
      }

      // Count algorithms
      stats.algorithmDistribution[rec.algorithm]++;

      // Count expiration status
      if (rec.expiresAt <= now) {
        stats.expirationStats.expired++;
      } else if (rec.expiresAt <= expiringSoonTime) {
        stats.expirationStats.expiringSoon++;
      } else {
        stats.expirationStats.active++;
      }
    }

    stats.averageScore = totalScore / recommendations.length;

    return stats;
  }

  /**
   * Filter recommendations by quality
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  static filterByQuality(
    recommendations: RecommendationEntity[],
    minScore: number = 0.3,
    excludeExpired: boolean = true
  ): RecommendationEntity[] {
    return recommendations.filter(rec => {
      if (excludeExpired && new Date() > rec.expiresAt) {
        return false;
      }
      return rec.score >= minScore;
    });
  }

  /**
   * Sort recommendations by score
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  static sortByScore(
    recommendations: RecommendationEntity[],
    descending: boolean = true
  ): RecommendationEntity[] {
    return [...recommendations].sort((a, b) => {
      return descending ? b.score - a.score : a.score - b.score;
    });
  }

  /**
   * Validate recommendation data
   */
  static validate(data: Partial<RecommendationEntity>): string[] {
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

    if (data.score !== undefined) {
      if (typeof data.score !== 'number' || isNaN(data.score)) {
        errors.push('Score must be a valid number');
      } else if (data.score < 0 || data.score > 1) {
        errors.push('Score must be between 0 and 1');
      }
    }

    if (data.algorithm !== undefined) {
      if (!['collaborative', 'content-based', 'hybrid'].includes(data.algorithm)) {
        errors.push('Algorithm must be one of: collaborative, content-based, hybrid');
      }
    }

    if (data.createdAt !== undefined) {
      if (!(data.createdAt instanceof Date) || isNaN(data.createdAt.getTime())) {
        errors.push('Created at must be a valid date');
      }
    }

    if (data.expiresAt !== undefined) {
      if (!(data.expiresAt instanceof Date) || isNaN(data.expiresAt.getTime())) {
        errors.push('Expires at must be a valid date');
      } else if (data.createdAt && data.expiresAt <= data.createdAt) {
        errors.push('Expires at must be after created at');
      }
    }

    return errors;
  }

  /**
   * Get default expiration time (24 hours from now)
   */
  static getDefaultExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24);
    return expiration;
  }

  /**
   * Get algorithm weights for scoring
   */
  static getAlgorithmWeights(): Record<RecommendationAlgorithm, number> {
    return {
      'collaborative': 0.4,
      'content-based': 0.3,
      'hybrid': 0.2,
      'popularity': 0.1
    };
  }
}
