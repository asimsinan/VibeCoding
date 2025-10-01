/**
 * Database Service - PostgreSQL database operations
 * TASK-004: Database Setup - FR-001 through FR-007
 * 
 * This service handles all database operations with real PostgreSQL database
 * including connection pooling, transaction management, and CRUD operations.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { UserEntity, ProductEntity, InteractionEntity, UserPreferences } from '../../../contracts/types/domain.types';

export class DatabaseService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new user with preferences
   * FR-007: System MUST support user authentication and profile management
   */
  async createUser(
    userData: {
      email: string;
      passwordHash: string;
      preferences: {
        categories: string[];
        priceRange: { min: number; max: number };
        brands: string[];
        stylePreferences: string[];
      };
    },
    client?: PoolClient
  ): Promise<UserEntity> {
    const dbClient = client || await this.pool.connect();
    
    try {
      await dbClient.query('BEGIN');
      
      // Insert user
      const userResult = await dbClient.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
        [userData.email, userData.passwordHash]
      );
      
      const user = userResult.rows[0];
      
      // Insert user preferences
      const preferencesResult = await dbClient.query(
        `INSERT INTO user_preferences 
         (user_id, categories, price_range_min, price_range_max, brands, style_preferences) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          user.id,
          userData.preferences.categories,
          userData.preferences.priceRange.min,
          userData.preferences.priceRange.max,
          userData.preferences.brands,
          userData.preferences.stylePreferences
        ]
      );
      
      const preferences = preferencesResult.rows[0];
      
      await dbClient.query('COMMIT');
      
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.password_hash,
        preferences: {
          id: preferences.id,
          userId: preferences.user_id,
          categories: preferences.categories || [],
          priceRange: {
            min: preferences.price_range_min,
            max: preferences.price_range_max
          },
          brands: preferences.brands || [],
          stylePreferences: preferences.style_preferences || [],
          createdAt: preferences.created_at,
          updatedAt: preferences.updated_at
        },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Find user by email
   * FR-007: System MUST support user authentication and profile management
   */
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT u.*, up.* 
         FROM users u 
         LEFT JOIN user_preferences up ON u.id = up.user_id 
         WHERE u.email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        preferences: {
          id: row.id,
          userId: row.user_id,
          categories: row.categories || [],
          priceRange: {
            min: row.price_range_min,
            max: row.price_range_max
          },
          brands: row.brands || [],
          stylePreferences: row.style_preferences || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update user preferences
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  async updateUserPreferences(
    userId: number, 
    preferences: Partial<{
      categories: string[];
      priceRange: { min: number; max: number };
      brands: string[];
      stylePreferences: string[];
    }>
  ): Promise<UserEntity> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update preferences
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (preferences.categories !== undefined) {
        updateFields.push(`categories = $${paramCount}`);
        values.push(preferences.categories);
        paramCount++;
      }
      
      if (preferences.priceRange !== undefined) {
        updateFields.push(`price_range_min = $${paramCount}`);
        values.push(preferences.priceRange.min);
        paramCount++;
        
        updateFields.push(`price_range_max = $${paramCount}`);
        values.push(preferences.priceRange.max);
        paramCount++;
      }
      
      if (preferences.brands !== undefined) {
        updateFields.push(`brands = $${paramCount}`);
        values.push(preferences.brands);
        paramCount++;
      }
      
      if (preferences.stylePreferences !== undefined) {
        updateFields.push(`style_preferences = $${paramCount}`);
        values.push(preferences.stylePreferences);
        paramCount++;
      }
      
      if (updateFields.length === 0) {
        throw new Error('No preferences to update');
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);
      
      await client.query(
        `UPDATE user_preferences 
         SET ${updateFields.join(', ')} 
         WHERE user_id = $${paramCount}`,
        [...values, userId]
      );
      
      // Get updated user
      const userResult = await client.query(
        `SELECT u.*, up.* 
         FROM users u 
         LEFT JOIN user_preferences up ON u.id = up.user_id 
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const row = userResult.rows[0];
      
      await client.query('COMMIT');
      
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        preferences: {
          id: row.id,
          userId: row.user_id,
          categories: row.categories || [],
          priceRange: {
            min: row.price_range_min,
            max: row.price_range_max
          },
          brands: row.brands || [],
          stylePreferences: row.style_preferences || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new product
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  async createProduct(
    productData: {
      name: string;
      description?: string;
      price: number;
      category: string;
      brand: string;
      imageUrl?: string;
      availability?: boolean;
    },
    client?: PoolClient
  ): Promise<ProductEntity> {
    const dbClient = client || await this.pool.connect();
    
    try {
      const result = await dbClient.query(
        `INSERT INTO products (name, description, price, category, brand, image_url, availability) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          productData.name,
          productData.description || null,
          productData.price,
          productData.category,
          productData.brand,
          productData.imageUrl || null,
          productData.availability !== undefined ? productData.availability : true
        ]
      );
      
      const product = result.rows[0];
      
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Find product by ID
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  async findProductById(id: number): Promise<ProductEntity | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const product = result.rows[0];
      
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find products by category
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  async findProductsByCategory(category: string): Promise<ProductEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE category = $1 AND availability = true ORDER BY created_at DESC',
        [category]
      );
      
      return result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find products by price range
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  async findProductsByPriceRange(minPrice: number, maxPrice: number): Promise<ProductEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE price BETWEEN $1 AND $2 AND availability = true ORDER BY price ASC',
        [minPrice, maxPrice]
      );
      
      return result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Search products by text
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  async searchProducts(query: string): Promise<ProductEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM products 
         WHERE availability = true 
         AND to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
         ORDER BY ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) DESC`,
        [query]
      );
      
      return result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Record user interaction
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  async recordInteraction(
    interactionData: {
      userId: number;
      productId: number;
      type: 'view' | 'like' | 'dislike' | 'purchase';
      metadata?: Record<string, any>;
    },
    client?: PoolClient
  ): Promise<InteractionEntity> {
    const dbClient = client || await this.pool.connect();
    
    try {
      const result = await dbClient.query(
        `INSERT INTO interactions (user_id, product_id, type, metadata) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          interactionData.userId,
          interactionData.productId,
          interactionData.type,
          JSON.stringify(interactionData.metadata || {})
        ]
      );
      
      const interaction = result.rows[0];
      
      return {
        id: interaction.id,
        userId: interaction.user_id,
        productId: interaction.product_id,
        type: interaction.type,
        timestamp: interaction.timestamp,
        metadata: interaction.metadata
      };
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Get user interactions
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  async getUserInteractions(userId: number, limit?: number): Promise<InteractionEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const limitClause = limit ? `LIMIT ${limit}` : '';
      const result = await client.query(
        `SELECT * FROM interactions 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         ${limitClause}`,
        [userId]
      );
      
      return result.rows.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        productId: interaction.product_id,
        type: interaction.type,
        timestamp: interaction.timestamp,
        metadata: interaction.metadata
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get product interactions
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  async getProductInteractions(productId: number, limit?: number): Promise<InteractionEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const limitClause = limit ? `LIMIT ${limit}` : '';
      const result = await client.query(
        `SELECT * FROM interactions 
         WHERE product_id = $1 
         ORDER BY timestamp DESC 
         ${limitClause}`,
        [productId]
      );
      
      return result.rows.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        productId: interaction.product_id,
        type: interaction.type,
        timestamp: interaction.timestamp,
        metadata: interaction.metadata
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get user interaction statistics
   * FR-004: System MUST track user interactions (views, likes, purchases) to improve future recommendations
   */
  async getUserInteractionStats(userId: number): Promise<{
    totalViews: number;
    totalLikes: number;
    totalPurchases: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
           COUNT(CASE WHEN type = 'view' THEN 1 END) as total_views,
           COUNT(CASE WHEN type = 'like' THEN 1 END) as total_likes,
           COUNT(CASE WHEN type = 'purchase' THEN 1 END) as total_purchases
         FROM interactions 
         WHERE user_id = $1`,
        [userId]
      );
      
      const stats = result.rows[0];
      
      return {
        totalViews: parseInt(stats.total_views) || 0,
        totalLikes: parseInt(stats.total_likes) || 0,
        totalPurchases: parseInt(stats.total_purchases) || 0
      };
    } finally {
      client.release();
    }
  }

  /**
   * Store recommendation
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  async storeRecommendation(
    recommendationData: {
      userId: number;
      productId: number;
      score: number;
      algorithm: string;
      expiresAt: Date;
    },
    client?: PoolClient
  ): Promise<void> {
    const dbClient = client || await this.pool.connect();
    
    try {
      await dbClient.query(
        `INSERT INTO recommendations (user_id, product_id, score, algorithm, expires_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          recommendationData.userId,
          recommendationData.productId,
          recommendationData.score,
          recommendationData.algorithm,
          recommendationData.expiresAt
        ]
      );
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Get user recommendations
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  async getUserRecommendations(userId: number): Promise<Array<{
    id: number;
    userId: number;
    productId: number;
    score: number;
    algorithm: string;
    createdAt: Date;
    expiresAt: Date;
  }>> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM recommendations 
         WHERE user_id = $1 AND expires_at > NOW() 
         ORDER BY score DESC`,
        [userId]
      );
      
      return result.rows.map(rec => ({
        id: rec.id,
        userId: rec.user_id,
        productId: rec.product_id,
        score: parseFloat(rec.score),
        algorithm: rec.algorithm,
        createdAt: rec.created_at,
        expiresAt: rec.expires_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get popular products
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  async getPopularProducts(category?: string, limit: number = 10): Promise<ProductEntity[]> {
    const client = await this.pool.connect();
    
    try {
      const categoryFilter = category ? 'AND p.category = $2' : '';
      const params = category ? [limit, category] : [limit];
      
      const result = await client.query(
        `SELECT p.*, COUNT(i.id) as interaction_count
         FROM products p
         LEFT JOIN interactions i ON p.id = i.product_id
         WHERE p.availability = true ${categoryFilter}
         GROUP BY p.id
         ORDER BY interaction_count DESC, p.created_at DESC
         LIMIT $1`,
        params
      );
      
      return result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get similar products
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences and interaction history
   */
  async getSimilarProducts(productId: number, limit: number = 5): Promise<ProductEntity[]> {
    const client = await this.pool.connect();
    
    try {
      // Simple similarity based on category and brand
      const result = await client.query(
        `SELECT p2.*, 
                CASE 
                  WHEN p2.category = p1.category AND p2.brand = p1.brand THEN 3
                  WHEN p2.category = p1.category THEN 2
                  WHEN p2.brand = p1.brand THEN 1
                  ELSE 0
                END as similarity_score
         FROM products p1
         CROSS JOIN products p2
         WHERE p1.id = $1 
           AND p2.id != p1.id 
           AND p2.availability = true
         ORDER BY similarity_score DESC, p2.created_at DESC
         LIMIT $2`,
        [productId, limit]
      );
      
      return result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        imageUrl: product.image_url,
        availability: product.availability,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Execute transaction
   * Provides transaction support for complex operations
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generic query method for custom SQL queries
   * FR-001: System MUST provide flexible database access
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  /**
   * Get a database client for transactions
   * FR-001: System MUST provide transaction support
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Health check
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    } finally {
      client.release();
    }
  }
}
