import { DatabaseService } from '../../backend/src/services/DatabaseService';
import { Interaction, InteractionEntity, InteractionCreateData, InteractionType, InteractionStats, ProductAnalytics, UserAnalytics } from '../recommendation-engine/models/Interaction';

export interface InteractionServiceInterface {
  recordInteraction(interactionData: InteractionCreateData): Promise<InteractionEntity>;
  getUserInteractions(userId: number, limit?: number, offset?: number): Promise<InteractionEntity[]>;
  getProductInteractions(productId: number, limit?: number, offset?: number): Promise<InteractionEntity[]>;
  getUserInteractionStats(userId: number): Promise<InteractionStats>;
  getProductAnalytics(productId: number): Promise<ProductAnalytics>;
  getUserAnalytics(userId: number): Promise<UserAnalytics>;
  getRecentInteractions(userId: number, hours?: number): Promise<InteractionEntity[]>;
  getInteractionHistory(userId: number, productId: number): Promise<InteractionEntity[]>;
  deleteInteraction(interactionId: number): Promise<boolean>;
  deleteInteractionByUserProductType(userId: number, productId: number, type: InteractionType): Promise<boolean>;
  updateInteraction(interactionId: number, type: InteractionType, metadata?: Record<string, any>): Promise<InteractionEntity>;
  getTopProducts(limit?: number, timeRange?: 'day' | 'week' | 'month'): Promise<{ productId: number; score: number; interactions: number }[]>;
  getUserRecommendationHistory(userId: number): Promise<{ productId: number; interactions: InteractionEntity[] }[]>;
}

export class InteractionService implements InteractionServiceInterface {
  private db: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  /**
   * Record a new user interaction
   * FR-004: System MUST track user interactions with products
   */
  async recordInteraction(interactionData: InteractionCreateData): Promise<InteractionEntity> {
    // Validate input data
    const errors = Interaction.validate(interactionData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if user exists
    const userExists = await this.checkUserExists(interactionData.userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if product exists
    const productExists = await this.checkProductExists(interactionData.productId);
    if (!productExists) {
      throw new Error('Product not found');
    }

    // Create interaction
    const interaction = new Interaction({
      id: 0, // Will be set by database
      userId: interactionData.userId,
      productId: interactionData.productId,
      type: interactionData.type,
      metadata: interactionData.metadata || {},
      timestamp: new Date()
    });

    // Insert into database
    const result = await this.db.query(
      `INSERT INTO interactions (user_id, product_id, type, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, product_id, type, metadata, timestamp`,
      [
        interaction.userId,
        interaction.productId,
        interaction.type,
        JSON.stringify(interaction.metadata),
        interaction.timestamp
      ]
    );

    const row = result.rows[0];
    return new Interaction({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      type: row.type,
      metadata: row.metadata,
      timestamp: row.timestamp
    });
  }

  /**
   * Get user interactions
   * FR-004: System MUST provide user interaction history
   */
  async getUserInteractions(userId: number, limit: number = 50, offset: number = 0): Promise<InteractionEntity[]> {
    const result = await this.db.query(
      `SELECT id, user_id, product_id, type, metadata, timestamp
       FROM interactions 
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => this.mapRowToInteraction(row));
  }

  /**
   * Get product interactions
   * FR-004: System MUST provide product interaction analytics
   */
  async getProductInteractions(productId: number, limit: number = 50, offset: number = 0): Promise<InteractionEntity[]> {
    const result = await this.db.query(
      `SELECT id, user_id, product_id, type, metadata, timestamp
       FROM interactions 
       WHERE product_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    return result.rows.map(row => this.mapRowToInteraction(row));
  }

  /**
   * Get user interaction statistics
   * FR-004: System MUST provide user analytics
   */
  async getUserInteractionStats(userId: number): Promise<InteractionStats> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as total_interactions,
         COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
         COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN type = 'dislike' THEN 1 END) as dislikes,
         COUNT(CASE WHEN type = 'view' THEN 1 END) as views,
         COUNT(DISTINCT product_id) as unique_products,
         COUNT(DISTINCT DATE(timestamp)) as active_days,
         AVG(CASE WHEN type = 'purchase' THEN 1.0 ELSE 0.0 END) as conversion_rate
       FROM interactions 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      totalInteractions: parseInt(stats.total_interactions),
      purchases: parseInt(stats.purchases),
      likes: parseInt(stats.likes),
      dislikes: parseInt(stats.dislikes),
      views: parseInt(stats.views),
      uniqueProducts: parseInt(stats.unique_products),
      activeDays: parseInt(stats.active_days),
      conversionRate: parseFloat(stats.conversion_rate) || 0
    };
  }

  /**
   * Get product analytics
   * FR-004: System MUST provide product analytics
   */
  async getProductAnalytics(productId: number): Promise<ProductAnalytics> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as total_interactions,
         COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
         COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN type = 'dislike' THEN 1 END) as dislikes,
         COUNT(CASE WHEN type = 'view' THEN 1 END) as views,
         COUNT(DISTINCT user_id) as unique_users,
         AVG(CASE WHEN type = 'purchase' THEN 1.0 ELSE 0.0 END) as conversion_rate,
         COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_interactions
       FROM interactions 
       WHERE product_id = $1`,
      [productId]
    );

    const stats = result.rows[0];
    return {
      productId,
      totalInteractions: parseInt(stats.total_interactions),
      purchases: parseInt(stats.purchases),
      likes: parseInt(stats.likes),
      dislikes: parseInt(stats.dislikes),
      views: parseInt(stats.views),
      uniqueUsers: parseInt(stats.unique_users),
      conversionRate: parseFloat(stats.conversion_rate) || 0,
      recentInteractions: parseInt(stats.recent_interactions)
    };
  }

  /**
   * Get user analytics
   * FR-004: System MUST provide user analytics
   */
  async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    const result = await this.db.query(
      `SELECT 
         COUNT(*) as total_interactions,
         COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
         COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN type = 'dislike' THEN 1 END) as dislikes,
         COUNT(CASE WHEN type = 'view' THEN 1 END) as views,
         COUNT(DISTINCT product_id) as unique_products,
         COUNT(DISTINCT category) as categories_explored,
         AVG(CASE WHEN type = 'purchase' THEN 1.0 ELSE 0.0 END) as conversion_rate,
         COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_interactions,
         COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_interactions
       FROM interactions i
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      userId,
      totalInteractions: parseInt(stats.total_interactions),
      purchases: parseInt(stats.purchases),
      likes: parseInt(stats.likes),
      dislikes: parseInt(stats.dislikes),
      views: parseInt(stats.views),
      uniqueProducts: parseInt(stats.unique_products),
      categoriesExplored: parseInt(stats.categories_explored),
      conversionRate: parseFloat(stats.conversion_rate) || 0,
      weeklyInteractions: parseInt(stats.weekly_interactions),
      monthlyInteractions: parseInt(stats.monthly_interactions)
    };
  }

  /**
   * Get recent interactions for a user
   * FR-004: System MUST provide recent activity tracking
   */
  async getRecentInteractions(userId: number, hours: number = 24): Promise<InteractionEntity[]> {
    const result = await this.db.query(
      `SELECT id, user_id, product_id, type, metadata, timestamp
       FROM interactions 
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToInteraction(row));
  }

  /**
   * Get interaction history for a specific user-product pair
   * FR-004: System MUST provide detailed interaction history
   */
  async getInteractionHistory(userId: number, productId: number): Promise<InteractionEntity[]> {
    const result = await this.db.query(
      `SELECT id, user_id, product_id, type, metadata, timestamp
       FROM interactions 
       WHERE user_id = $1 AND product_id = $2
       ORDER BY timestamp DESC`,
      [userId, productId]
    );

    return result.rows.map(row => this.mapRowToInteraction(row));
  }

  /**
   * Delete an interaction
   * FR-004: System MUST allow interaction deletion
   */
  async deleteInteraction(interactionId: number): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM interactions WHERE id = $1',
      [interactionId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Delete an interaction by user, product, and type
   * FR-004: System MUST allow interaction deletion by specific criteria
   */
  async deleteInteractionByUserProductType(userId: number, productId: number, type: InteractionType): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM interactions WHERE user_id = $1 AND product_id = $2 AND type = $3',
      [userId, productId, type]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Update an interaction
   * FR-004: System MUST allow interaction updates
   */
  async updateInteraction(interactionId: number, type: InteractionType, metadata?: Record<string, any>): Promise<InteractionEntity> {
    const result = await this.db.query(
      `UPDATE interactions 
       SET type = $1, metadata = $2
       WHERE id = $3
       RETURNING id, user_id, product_id, type, metadata, timestamp`,
      [type, JSON.stringify(metadata || {}), interactionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Interaction not found');
    }

    return this.mapRowToInteraction(result.rows[0]);
  }

  /**
   * Get top products by interaction score
   * FR-004: System MUST provide product popularity metrics
   */
  async getTopProducts(limit: number = 10, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{ productId: number; score: number; interactions: number }[]> {
    const intervalMap = {
      'day': '1 day',
      'week': '7 days',
      'month': '30 days'
    };

    const result = await this.db.query(
      `SELECT 
         product_id,
         COUNT(*) as interactions,
         SUM(CASE 
           WHEN type = 'purchase' THEN 1.0
           WHEN type = 'like' THEN 0.8
           WHEN type = 'view' THEN 0.3
           WHEN type = 'dislike' THEN -0.5
           ELSE 0
         END) as score
       FROM interactions 
       WHERE timestamp >= NOW() - INTERVAL '${intervalMap[timeRange]}'
       GROUP BY product_id
       ORDER BY score DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      productId: row.product_id,
      score: parseFloat(row.score),
      interactions: parseInt(row.interactions)
    }));
  }

  /**
   * Get user recommendation history with interactions
   * FR-004: System MUST track recommendation effectiveness
   */
  async getUserRecommendationHistory(userId: number): Promise<{ productId: number; interactions: InteractionEntity[] }[]> {
    const result = await this.db.query(
      `SELECT DISTINCT r.product_id, 
              i.id, i.user_id, i.product_id, i.type, i.metadata, i.timestamp
       FROM recommendations r
       LEFT JOIN interactions i ON r.product_id = i.product_id AND i.user_id = $1
       WHERE r.user_id = $1
       ORDER BY r.product_id, i.timestamp DESC`,
      [userId]
    );

    const productInteractions = new Map<number, InteractionEntity[]>();

    for (const row of result.rows) {
      if (!productInteractions.has(row.product_id)) {
        productInteractions.set(row.product_id, []);
      }

      if (row.id) { // Only add if interaction exists
        productInteractions.get(row.product_id)!.push(this.mapRowToInteraction(row));
      }
    }

    return Array.from(productInteractions.entries()).map(([productId, interactions]) => ({
      productId,
      interactions
    }));
  }

  /**
   * Check if user exists
   */
  private async checkUserExists(userId: number): Promise<boolean> {
    const result = await this.db.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
  }

  /**
   * Check if product exists
   */
  private async checkProductExists(productId: number): Promise<boolean> {
    const result = await this.db.query('SELECT 1 FROM products WHERE id = $1', [productId]);
    return result.rows.length > 0;
  }

  /**
   * Map database row to InteractionEntity
   */
  private mapRowToInteraction(row: any): InteractionEntity {
    return new Interaction({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      type: row.type,
      metadata: row.metadata,
      timestamp: row.timestamp
    });
  }
}
