/**
 * Database Integration Tests - Real PostgreSQL database testing
 * TASK-003: Create Integration Test Scenarios - FR-001 through FR-007
 * 
 * These tests validate database operations with real PostgreSQL database
 * and will fail initially (RED phase) until the database is set up.
 */

import { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../src/backend/src/services/DatabaseService';
import { UserEntity, ProductEntity, InteractionEntity } from '../../src/contracts/types/domain.types';

describe('Database Integration Tests', () => {
  let pool: Pool;
  let client: PoolClient;
  let dbService: DatabaseService;

  beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'test_shopping_assistant',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    client = await pool.connect();
    dbService = new DatabaseService(pool);
  });

  afterAll(async () => {
    if (client) {
      await client.release();
    }
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await client.query('DELETE FROM interactions');
    await client.query('DELETE FROM user_preferences');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM products');
  });

  describe('User Database Operations', () => {
    it('should create user with preferences', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 500 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern']
        }
      };

      const user = await dbService.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.preferences).toEqual(userData.preferences);
    });

    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      await dbService.createUser(userData);
      const foundUser = await dbService.findUserByEmail(userData.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should update user preferences', async () => {
      const userData = {
        email: 'update@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      const user = await dbService.createUser(userData);
      
      const newPreferences = {
        categories: ['Books', 'Clothing'],
        priceRange: { min: 50, max: 200 },
        brands: ['Nike', 'Adidas'],
        stylePreferences: ['Casual', 'Sporty']
      };

      const updatedUser = await dbService.updateUserPreferences(user.id, newPreferences);
      
      expect(updatedUser.preferences).toEqual(newPreferences);
    });

    it('should validate unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      await dbService.createUser(userData);
      
      // Attempt to create another user with same email should fail
      await expect(dbService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('Product Database Operations', () => {
    it('should create product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for integration testing',
        price: 99.99,
        category: 'Electronics',
        brand: 'TestBrand',
        imageUrl: 'https://example.com/image.jpg',
        availability: true
      };

      const product = await dbService.createProduct(productData);
      
      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.category).toBe(productData.category);
      expect(product.brand).toBe(productData.brand);
    });

    it('should find product by ID', async () => {
      const productData = {
        name: 'Findable Product',
        description: 'A product to find',
        price: 149.99,
        category: 'Books',
        brand: 'BookBrand',
        availability: true
      };

      const createdProduct = await dbService.createProduct(productData);
      const foundProduct = await dbService.findProductById(createdProduct.id);
      
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.id).toBe(createdProduct.id);
      expect(foundProduct?.name).toBe(productData.name);
    });

    it('should search products by category', async () => {
      const products = [
        {
          name: 'Electronics Product 1',
          description: 'First electronics product',
          price: 99.99,
          category: 'Electronics',
          brand: 'TechBrand',
          availability: true
        },
        {
          name: 'Electronics Product 2',
          description: 'Second electronics product',
          price: 199.99,
          category: 'Electronics',
          brand: 'TechBrand',
          availability: true
        },
        {
          name: 'Book Product',
          description: 'A book product',
          price: 29.99,
          category: 'Books',
          brand: 'BookBrand',
          availability: true
        }
      ];

      for (const productData of products) {
        await dbService.createProduct(productData);
      }

      const electronicsProducts = await dbService.findProductsByCategory('Electronics');
      
      expect(electronicsProducts).toHaveLength(2);
      expect(electronicsProducts.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should search products by price range', async () => {
      const products = [
        {
          name: 'Cheap Product',
          description: 'A cheap product',
          price: 9.99,
          category: 'Electronics',
          brand: 'BudgetBrand',
          availability: true
        },
        {
          name: 'Expensive Product',
          description: 'An expensive product',
          price: 999.99,
          category: 'Electronics',
          brand: 'LuxuryBrand',
          availability: true
        },
        {
          name: 'Mid-range Product',
          description: 'A mid-range product',
          price: 99.99,
          category: 'Electronics',
          brand: 'MidBrand',
          availability: true
        }
      ];

      for (const productData of products) {
        await dbService.createProduct(productData);
      }

      const midRangeProducts = await dbService.findProductsByPriceRange(50, 150);
      
      expect(midRangeProducts).toHaveLength(1);
      expect(midRangeProducts[0].name).toBe('Mid-range Product');
    });

    it('should search products by text', async () => {
      const products = [
        {
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 199.99,
          category: 'Electronics',
          brand: 'AudioBrand',
          availability: true
        },
        {
          name: 'Wired Headphones',
          description: 'Traditional wired headphones',
          price: 49.99,
          category: 'Electronics',
          brand: 'AudioBrand',
          availability: true
        },
        {
          name: 'Bluetooth Speaker',
          description: 'Portable wireless speaker',
          price: 79.99,
          category: 'Electronics',
          brand: 'AudioBrand',
          availability: true
        }
      ];

      for (const productData of products) {
        await dbService.createProduct(productData);
      }

      const headphoneResults = await dbService.searchProducts('headphones');
      
      expect(headphoneResults).toHaveLength(2);
      expect(headphoneResults.every(p => 
        p.name.toLowerCase().includes('headphones') || 
        p.description.toLowerCase().includes('headphones')
      )).toBe(true);
    });
  });

  describe('Interaction Database Operations', () => {
    let testUser: UserEntity;
    let testProduct: ProductEntity;

    beforeEach(async () => {
      // Create test user and product for interaction tests
      const userData = {
        email: 'interaction@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      const productData = {
        name: 'Interaction Test Product',
        description: 'A product for testing interactions',
        price: 99.99,
        category: 'Electronics',
        brand: 'TestBrand',
        availability: true
      };

      testUser = await dbService.createUser(userData);
      testProduct = await dbService.createProduct(productData);
    });

    it('should record user interaction', async () => {
      const interactionData = {
        userId: testUser.id,
        productId: testProduct.id,
        type: 'like' as const,
        metadata: { source: 'recommendation' }
      };

      const interaction = await dbService.recordInteraction(interactionData);
      
      expect(interaction).toBeDefined();
      expect(interaction.id).toBeDefined();
      expect(interaction.userId).toBe(testUser.id);
      expect(interaction.productId).toBe(testProduct.id);
      expect(interaction.type).toBe('like');
    });

    it('should get user interactions', async () => {
      // Record multiple interactions
      const interactions = [
        { userId: testUser.id, productId: testProduct.id, type: 'view' as const },
        { userId: testUser.id, productId: testProduct.id, type: 'like' as const },
        { userId: testUser.id, productId: testProduct.id, type: 'purchase' as const }
      ];

      for (const interactionData of interactions) {
        await dbService.recordInteraction(interactionData);
      }

      const userInteractions = await dbService.getUserInteractions(testUser.id);
      
      expect(userInteractions).toHaveLength(3);
      expect(userInteractions.every(i => i.userId === testUser.id)).toBe(true);
    });

    it('should get product interactions', async () => {
      // Create another user
      const anotherUserData = {
        email: 'another@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      const anotherUser = await dbService.createUser(anotherUserData);

      // Record interactions from both users
      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProduct.id,
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: anotherUser.id,
        productId: testProduct.id,
        type: 'view'
      });

      const productInteractions = await dbService.getProductInteractions(testProduct.id);
      
      expect(productInteractions).toHaveLength(2);
      expect(productInteractions.every(i => i.productId === testProduct.id)).toBe(true);
    });

    it('should get interaction statistics', async () => {
      // Record various interactions
      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProduct.id,
        type: 'view'
      });

      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProduct.id,
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProduct.id,
        type: 'purchase'
      });

      const stats = await dbService.getUserInteractionStats(testUser.id);
      
      expect(stats.totalViews).toBe(1);
      expect(stats.totalLikes).toBe(1);
      expect(stats.totalPurchases).toBe(1);
    });
  });

  describe('Recommendation Database Operations', () => {
    let testUser: UserEntity;
    let testProducts: ProductEntity[];

    beforeEach(async () => {
      // Create test user
      const userData = {
        email: 'recommendation@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 50, max: 200 },
          brands: ['TechBrand'],
          stylePreferences: ['Modern']
        }
      };

      testUser = await dbService.createUser(userData);

      // Create test products
      const productData = [
        {
          name: 'Product 1',
          description: 'First product',
          price: 99.99,
          category: 'Electronics',
          brand: 'TechBrand',
          availability: true
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: 149.99,
          category: 'Electronics',
          brand: 'TechBrand',
          availability: true
        },
        {
          name: 'Product 3',
          description: 'Third product',
          price: 199.99,
          category: 'Electronics',
          brand: 'TechBrand',
          availability: true
        }
      ];

      testProducts = [];
      for (const data of productData) {
        const product = await dbService.createProduct(data);
        testProducts.push(product);
      }
    });

    it('should store and retrieve recommendations', async () => {
      const recommendations = [
        {
          userId: testUser.id,
          productId: testProducts[0].id,
          score: 0.95,
          algorithm: 'hybrid' as const,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        {
          userId: testUser.id,
          productId: testProducts[1].id,
          score: 0.87,
          algorithm: 'hybrid' as const,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];

      for (const rec of recommendations) {
        await dbService.storeRecommendation(rec);
      }

      const userRecommendations = await dbService.getUserRecommendations(testUser.id);
      
      expect(userRecommendations).toHaveLength(2);
      expect(userRecommendations.every(r => r.userId === testUser.id)).toBe(true);
    });

    it('should get popular products', async () => {
      // Record some interactions to make products popular
      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProducts[0].id,
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: testUser.id,
        productId: testProducts[0].id,
        type: 'purchase'
      });

      const popularProducts = await dbService.getPopularProducts('Electronics', 2);
      
      expect(popularProducts).toHaveLength(2);
      expect(popularProducts[0].id).toBe(testProducts[0].id); // Most popular
    });

    it('should get similar products', async () => {
      // This would require implementing similarity logic
      // For now, we'll test the basic structure
      const similarProducts = await dbService.getSimilarProducts(testProducts[0].id, 2);
      
      expect(Array.isArray(similarProducts)).toBe(true);
      expect(similarProducts.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Database Transaction Tests', () => {
    it('should handle transaction rollback on error', async () => {
      const userData = {
        email: 'transaction@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      // This should fail and rollback
      await expect(async () => {
        await dbService.transaction(async (client) => {
          const user = await dbService.createUser(userData, client);
          // Simulate an error
          throw new Error('Simulated error');
        });
      }).rejects.toThrow('Simulated error');

      // User should not exist due to rollback
      const user = await dbService.findUserByEmail(userData.email);
      expect(user).toBeNull();
    });

    it('should commit transaction on success', async () => {
      const userData = {
        email: 'success@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      const productData = {
        name: 'Transaction Product',
        description: 'A product created in transaction',
        price: 99.99,
        category: 'Electronics',
        brand: 'TestBrand',
        availability: true
      };

      await dbService.transaction(async (client) => {
        const user = await dbService.createUser(userData, client);
        const product = await dbService.createProduct(productData, client);
        
        await dbService.recordInteraction({
          userId: user.id,
          productId: product.id,
          type: 'view'
        }, client);
      });

      // All operations should be committed
      const user = await dbService.findUserByEmail(userData.email);
      const product = await dbService.findProductById(1); // Assuming it gets ID 1
      
      expect(user).toBeDefined();
      expect(product).toBeDefined();
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle bulk product creation efficiently', async () => {
      const startTime = Date.now();
      
      const products = Array.from({ length: 100 }, (_, i) => ({
        name: `Bulk Product ${i}`,
        description: `Description for product ${i}`,
        price: Math.random() * 1000,
        category: 'Electronics',
        brand: 'BulkBrand',
        availability: true
      }));

      for (const productData of products) {
        await dbService.createProduct(productData);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should handle complex queries efficiently', async () => {
      // Create test data
      const userData = {
        email: 'performance@example.com',
        passwordHash: 'hashedPassword123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      };

      const user = await dbService.createUser(userData);

      const products = Array.from({ length: 50 }, (_, i) => ({
        name: `Performance Product ${i}`,
        description: `Description for product ${i}`,
        price: Math.random() * 1000,
        category: 'Electronics',
        brand: 'PerfBrand',
        availability: true
      }));

      for (const productData of products) {
        const product = await dbService.createProduct(productData);
        
        // Record some interactions
        if (Math.random() > 0.5) {
          await dbService.recordInteraction({
            userId: user.id,
            productId: product.id,
            type: 'view'
          });
        }
      }

      const startTime = Date.now();
      
      // Perform complex query
      const results = await dbService.searchProducts('Performance');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});
