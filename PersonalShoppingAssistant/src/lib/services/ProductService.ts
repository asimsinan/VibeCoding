import { DatabaseService } from '../../backend/src/services/DatabaseService';
import { Product, ProductEntity, ProductCreateData, ProductUpdateData, ProductFilter } from '../recommendation-engine/models/Product';

export interface ProductServiceInterface {
  createProduct(productData: ProductCreateData): Promise<ProductEntity>;
  getProduct(productId: number): Promise<ProductEntity | null>;
  updateProduct(productId: number, updateData: ProductUpdateData): Promise<ProductEntity>;
  deleteProduct(productId: number): Promise<boolean>;
  searchProducts(query: string, limit?: number, offset?: number): Promise<ProductEntity[]>;
  getProductsByCategory(category: string, limit?: number, offset?: number): Promise<ProductEntity[]>;
  getProductsByBrand(brand: string, limit?: number, offset?: number): Promise<ProductEntity[]>;
  getProductsByPriceRange(minPrice: number, maxPrice: number, limit?: number, offset?: number): Promise<ProductEntity[]>;
  getAvailableProducts(limit?: number, offset?: number): Promise<ProductEntity[]>;
  filterProducts(filter: ProductFilter, limit?: number, offset?: number): Promise<ProductEntity[]>;
  getProductStats(productId: number): Promise<{ views: number; likes: number; purchases: number; averageRating: number }>;
  getPopularProducts(limit?: number): Promise<ProductEntity[]>;
  getRecommendedProducts(userId: number, limit?: number): Promise<ProductEntity[]>;
  getProductsByIds(productIds: number[]): Promise<ProductEntity[]>;
  updateProductRating(productId: number): Promise<number>;
  getCategories(): Promise<string[]>;
  getBrands(): Promise<string[]>;
}

export class ProductService implements ProductServiceInterface {
  private db: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  /**
   * Create a new product
   * FR-003: System MUST allow administrators to manage product catalog
   */
  async createProduct(productData: ProductCreateData): Promise<ProductEntity> {
    // Validate input data
    const errors = Product.validate(productData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if product with same name already exists
    const existingProduct = await this.findProductByName(productData.name);
    if (existingProduct) {
      throw new Error('Product with this name already exists');
    }

    const result = await this.db.query(
      `INSERT INTO products (name, description, price, category, brand, image_url, availability, style, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, description, price, category, brand, image_url, availability, style, created_at, updated_at`,
      [
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.brand,
        productData.imageUrl || null,
        productData.availability !== undefined ? productData.availability : true,
        productData.style || null
      ]
    );

    const row = result.rows[0];
    return this.mapRowToProduct(row);
  }

  /**
   * Get product by ID
   * FR-003: System MUST allow users to view product details
   */
  async getProduct(productId: number): Promise<ProductEntity | null> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Update product
   * FR-003: System MUST allow administrators to manage product catalog
   */
  async updateProduct(productId: number, updateData: ProductUpdateData): Promise<ProductEntity> {
    // Validate input data
    const errors = Product.validate(updateData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Check if product exists
    const existingProduct = await this.getProduct(productId);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Check if name is being changed and if it's already taken
    if (updateData.name && updateData.name !== existingProduct.name) {
      const nameExists = await this.findProductByName(updateData.name);
      if (nameExists) {
        throw new Error('Product with this name already exists');
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updateData.description);
    }
    if (updateData.price !== undefined) {
      updateFields.push(`price = $${paramCount++}`);
      values.push(updateData.price);
    }
    if (updateData.category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(updateData.category);
    }
    if (updateData.brand !== undefined) {
      updateFields.push(`brand = $${paramCount++}`);
      values.push(updateData.brand);
    }
    if (updateData.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramCount++}`);
      values.push(updateData.imageUrl);
    }
    if (updateData.availability !== undefined) {
      updateFields.push(`availability = $${paramCount++}`);
      values.push(updateData.availability);
    }
    if (updateData.style !== undefined) {
      updateFields.push(`style = $${paramCount++}`);
      values.push(updateData.style);
    }

    if (updateFields.length === 0) {
      return existingProduct; // No changes to make
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(productId);

    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, description, price, category, brand, image_url, availability, style, created_at, updated_at
    `;

    const result = await this.db.query(query, values);
    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Delete product
   * FR-003: System MUST allow administrators to manage product catalog
   */
  async deleteProduct(productId: number): Promise<boolean> {
    // Check if product exists
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Start transaction
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Delete related data first
      await client.query('DELETE FROM interactions WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM recommendations WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM products WHERE id = $1', [productId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Search products by query
   * FR-003: System MUST allow users to search products
   */
  async searchProducts(query: string, limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE LOWER(name) LIKE $1 
          OR LOWER(description) LIKE $1 
          OR LOWER(category) LIKE $1 
          OR LOWER(brand) LIKE $1
       ORDER BY name
       LIMIT $2 OFFSET $3`,
      [searchQuery, limit, offset]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get products by category
   * FR-003: System MUST allow users to browse products by category
   */
  async getProductsByCategory(category: string, limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE LOWER(category) = LOWER($1)
       ORDER BY name
       LIMIT $2 OFFSET $3`,
      [category, limit, offset]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get products by brand
   * FR-003: System MUST allow users to browse products by brand
   */
  async getProductsByBrand(brand: string, limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE LOWER(brand) = LOWER($1)
       ORDER BY name
       LIMIT $2 OFFSET $3`,
      [brand, limit, offset]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get products by price range
   * FR-003: System MUST allow users to filter products by price
   */
  async getProductsByPriceRange(minPrice: number, maxPrice: number, limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE price >= $1 AND price <= $2
       ORDER BY price
       LIMIT $3 OFFSET $4`,
      [minPrice, maxPrice, limit, offset]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get available products
   * FR-003: System MUST show only available products by default
   */
  async getAvailableProducts(limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE availability = true
       ORDER BY name
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Filter products with complex criteria
   * FR-003: System MUST allow users to filter products by multiple criteria
   */
  async filterProducts(filter: ProductFilter, limit: number = 20, offset: number = 0): Promise<ProductEntity[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filter.category) {
      conditions.push(`LOWER(category) = LOWER($${paramCount++})`);
      values.push(filter.category);
    }

    if (filter.brand) {
      conditions.push(`LOWER(brand) = LOWER($${paramCount++})`);
      values.push(filter.brand);
    }

    if (filter.minPrice !== undefined) {
      conditions.push(`price >= $${paramCount++}`);
      values.push(filter.minPrice);
    }

    if (filter.maxPrice !== undefined) {
      conditions.push(`price <= $${paramCount++}`);
      values.push(filter.maxPrice);
    }

    if (filter.availability !== undefined) {
      conditions.push(`availability = $${paramCount++}`);
      values.push(filter.availability);
    }

    if (filter.minRating !== undefined) {
      conditions.push(`rating >= $${paramCount++}`);
      values.push(filter.minRating);
    }

    if (filter.searchQuery) {
      const searchQuery = `%${filter.searchQuery.toLowerCase()}%`;
      conditions.push(`(LOWER(name) LIKE $${paramCount++} OR LOWER(description) LIKE $${paramCount++} OR LOWER(category) LIKE $${paramCount++} OR LOWER(brand) LIKE $${paramCount++})`);
      values.push(searchQuery, searchQuery, searchQuery, searchQuery);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Map frontend sortBy to database column names
    const sortByMapping: { [key: string]: string } = {
      'name': 'name',
      'price': 'price',
      'rating': 'rating',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };
    
    const orderBy = sortByMapping[filter.sortBy || 'name'] || 'name';
    const sortOrder = filter.sortOrder || 'ASC';

    const query = `
      SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
      FROM products 
      ${whereClause}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const result = await this.db.query(query, values);
    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get product statistics
   * FR-003: System MUST provide product analytics
   */
  async getProductStats(productId: number): Promise<{ views: number; likes: number; purchases: number; averageRating: number }> {
    const result = await this.db.query(
      `SELECT 
         COUNT(CASE WHEN type = 'view' THEN 1 END) as views,
         COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchases,
         COALESCE(AVG(CASE WHEN type = 'purchase' THEN 1.0 ELSE 0.0 END), 0) as average_rating
       FROM interactions 
       WHERE product_id = $1`,
      [productId]
    );

    const stats = result.rows[0];
    return {
      views: parseInt(stats.views),
      likes: parseInt(stats.likes),
      purchases: parseInt(stats.purchases),
      averageRating: parseFloat(stats.average_rating)
    };
  }

  /**
   * Get popular products based on interactions
   * FR-003: System MUST show popular products
   */
  async getPopularProducts(limit: number = 10): Promise<ProductEntity[]> {
    const result = await this.db.query(
      `SELECT p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url, p.availability, p.style, p.rating, p.created_at, p.updated_at,
              COUNT(i.id) as interaction_count
       FROM products p
       LEFT JOIN interactions i ON p.id = i.product_id
       WHERE p.availability = true
       GROUP BY p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url, p.availability, p.style, p.rating, p.created_at, p.updated_at
       ORDER BY interaction_count DESC, p.name
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get recommended products for user
   * FR-002: System MUST implement a recommendation algorithm
   */
  async getRecommendedProducts(userId: number, limit: number = 10): Promise<ProductEntity[]> {
    // This is a simplified recommendation - in a real system, this would use the recommendation engine
    const result = await this.db.query(
      `SELECT DISTINCT p.id, p.name, p.description, p.price, p.category, p.brand, p.image_url, p.availability, p.style, p.rating, p.created_at, p.updated_at
       FROM products p
       LEFT JOIN recommendations r ON p.id = r.product_id AND r.user_id = $1
       WHERE p.availability = true
       ORDER BY r.score DESC NULLS LAST, p.name
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Find product by name
   */
  private async findProductByName(name: string): Promise<ProductEntity | null> {
    const result = await this.db.query(
      `SELECT id, name, description, price, category, brand, image_url, availability, style, rating, created_at, updated_at
       FROM products 
       WHERE LOWER(name) = LOWER($1)`,
      [name]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Map database row to ProductEntity
   */
  /**
   * Update product's average rating based on all user ratings
   */
  async updateProductRating(productId: number): Promise<number> {
    try {
      // Get all user rating interactions
      const interactionsResult = await this.db.query(
        `SELECT CAST(metadata->>'rating' AS DECIMAL) as rating
         FROM interactions 
         WHERE product_id = $1 AND type = 'rating' AND metadata->>'rating' IS NOT NULL`,
        [productId]
      );

      const userRatings = interactionsResult.rows.map(row => parseFloat(row.rating));
      
      // Calculate average from user ratings only
      let avgRating = 0;
      
      if (userRatings.length > 0) {
        const sumOfUserRatings = userRatings.reduce((sum, rating) => sum + rating, 0);
        avgRating = sumOfUserRatings / userRatings.length;
      } else {
        // If no user ratings, keep the original product rating
        const productResult = await this.db.query(
          `SELECT rating FROM products WHERE id = $1`,
          [productId]
        );
        avgRating = productResult.rows[0]?.rating || 0;
      }

      // Update the product's rating
      await this.db.query(
        `UPDATE products SET rating = $1 WHERE id = $2`,
        [avgRating, productId]
      );

      return avgRating;
    } catch (error) {
      console.error('Error updating product rating:', error);
      throw error;
    }
  }

  private mapRowToProduct(row: any): ProductEntity {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      brand: row.brand,
      imageUrl: row.image_url,
      availability: row.availability,
      style: row.style,
      rating: row.rating ? parseFloat(row.rating) : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Get products by their IDs
   * Used for enriching recommendations with product data
   */
  async getProductsByIds(productIds: number[]): Promise<ProductEntity[]> {
    if (productIds.length === 0) return [];

    const placeholders = productIds.map((_, index) => `$${index + 1}`).join(', ');
    const result = await this.db.query(
      `SELECT * FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get all unique product categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.db.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\' ORDER BY category'
    );
    return result.rows.map(row => row.category);
  }

  /**
   * Get all unique product brands
   */
  async getBrands(): Promise<string[]> {
    const result = await this.db.query(
      'SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != \'\' ORDER BY brand'
    );
    return result.rows.map(row => row.brand);
  }
}
