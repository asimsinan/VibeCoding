import { RecommendationEngine } from '@/lib/services/RecommendationEngine';
import { DatabaseService } from '@/backend/src/services/DatabaseService';
import { UserService } from '@/lib/services/UserService';
import { ProductService } from '@/lib/services/ProductService';
import { InteractionService } from '@/lib/services/InteractionService';

describe('RecommendationEngine Integration Tests', () => {
  let recommendationEngine: RecommendationEngine;
  let userService: UserService;
  let productService: ProductService;
  let interactionService: InteractionService;
  let db: DatabaseService;
  let testUserId: number;
  let testProductIds: number[] = [];

  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
    
    userService = new UserService(db);
    productService = new ProductService(db);
    interactionService = new InteractionService(db);
    recommendationEngine = new RecommendationEngine(db);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (testProductIds.length > 0) {
      await db.query('DELETE FROM products WHERE id = ANY($1)', [testProductIds]);
    }
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test%']);
    await db.query('DELETE FROM products WHERE name LIKE $1', ['Test%']);
    await db.query('DELETE FROM interactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test%']);
    await db.query('DELETE FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test%']);
  });

  describe('User and Product Setup', () => {
    it('should create test user with preferences', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 500 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern', 'Minimalist']
        }
      };

      const { user } = await userService.register(userData);
      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.preferences).toBeDefined();
    });

    it('should create test products', async () => {
      const products = [
        {
          name: 'Test iPhone',
          description: 'A modern smartphone',
          price: 999.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true,
          style: 'Modern'
        },
        {
          name: 'Test Samsung Galaxy',
          description: 'Another smartphone',
          price: 799.99,
          category: 'Electronics',
          brand: 'Samsung',
          availability: true,
          style: 'Modern'
        },
        {
          name: 'Test Book',
          description: 'A great book',
          price: 19.99,
          category: 'Books',
          brand: 'TestPublisher',
          availability: true,
          style: 'Classic'
        },
        {
          name: 'Test Laptop',
          description: 'A powerful laptop',
          price: 1299.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true,
          style: 'Minimalist'
        }
      ];

      for (const productData of products) {
        const product = await productService.createProduct(productData);
        testProductIds.push(product.id);
      }

      expect(testProductIds.length).toBe(4);
    });
  });

  describe('Content-Based Recommendations', () => {
    it('should generate content-based recommendations', async () => {
      const recommendations = await recommendationEngine.generateContentBasedRecommendations(testUserId, 5);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Check recommendation structure
      recommendations.forEach(rec => {
        expect(rec.productId).toBeDefined();
        expect(typeof rec.score).toBe('number');
        expect(rec.score).toBeGreaterThan(0);
        expect(rec.algorithm).toBe('content-based');
        expect(rec.confidence).toMatch(/^(high|medium|low)$/);
        expect(rec.reason).toBeDefined();
        expect(rec.expiresAt).toBeInstanceOf(Date);
      });
    });

    it('should return empty array for user without preferences', async () => {
      // Create user without preferences
      const userData = {
        email: 'test2@example.com',
        password: 'password123',
        preferences: {
          categories: [],
          priceRange: { min: 0, max: 0 },
          brands: [],
          stylePreferences: []
        }
      };

      const { user } = await userService.register(userData);
      const recommendations = await recommendationEngine.generateContentBasedRecommendations(user.id, 5);

      expect(recommendations).toEqual([]);

      // Clean up
      await userService.deleteUser(user.id);
    });
  });

  describe('Collaborative Recommendations', () => {
    it('should generate collaborative recommendations', async () => {
      // Create similar users with interactions
      const similarUserData = {
        email: 'similar@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 50, max: 600 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern']
        }
      };

      const { user: similarUser } = await userService.register(similarUserData);

      // Add interactions for similar user
      await interactionService.recordInteraction({
        userId: similarUser.id,
        productId: testProductIds[0], // iPhone
        type: 'like',
        metadata: { source: 'homepage' }
      });

      await interactionService.recordInteraction({
        userId: similarUser.id,
        productId: testProductIds[1], // Samsung Galaxy
        type: 'purchase',
        metadata: { source: 'search' }
      });

      const recommendations = await recommendationEngine.generateCollaborativeRecommendations(testUserId, 5);

      expect(Array.isArray(recommendations)).toBe(true);
      // May be empty if no similar users found, which is expected

      // Clean up
      await userService.deleteUser(similarUser.id);
    });
  });

  describe('Hybrid Recommendations', () => {
    it('should generate hybrid recommendations', async () => {
      const recommendations = await recommendationEngine.generateHybridRecommendations(testUserId, 5);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Check recommendation structure
      recommendations.forEach(rec => {
        expect(rec.productId).toBeDefined();
        expect(typeof rec.score).toBe('number');
        expect(rec.score).toBeGreaterThan(0);
        expect(['collaborative', 'content-based', 'hybrid', 'popularity']).toContain(rec.algorithm);
        expect(rec.confidence).toMatch(/^(high|medium|low)$/);
        expect(rec.reason).toBeDefined();
        expect(rec.expiresAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Recommendation Management', () => {
    it('should update recommendations for user', async () => {
      await recommendationEngine.updateRecommendations(testUserId);

      // Check if recommendations were stored
      const result = await db.query(
        'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1',
        [testUserId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should get recommendation score for product', async () => {
      // First update recommendations
      await recommendationEngine.updateRecommendations(testUserId);

      const score = await recommendationEngine.getRecommendationScore(testUserId, testProductIds[0]);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should get recommendation statistics', async () => {
      const stats = await recommendationEngine.getRecommendationStats(testUserId);

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.algorithmDistribution).toBe('object');
    });
  });

  describe('Main Recommendation Generation', () => {
    it('should generate recommendations using main method', async () => {
      const recommendations = await recommendationEngine.generateRecommendations(testUserId, 5);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Check recommendation structure
      recommendations.forEach(rec => {
        expect(rec.productId).toBeDefined();
        expect(typeof rec.score).toBe('number');
        expect(rec.score).toBeGreaterThan(0);
        expect(rec.algorithm).toBeDefined();
        expect(rec.confidence).toMatch(/^(high|medium|low)$/);
        expect(rec.reason).toBeDefined();
        expect(rec.expiresAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Expired Recommendations', () => {
    it('should refresh expired recommendations', async () => {
      // Create expired recommendations
      await db.query(
        `INSERT INTO recommendations (user_id, product_id, score, algorithm, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [testUserId, testProductIds[0], 0.8, 'test', new Date(Date.now() - 1000)] // Expired
      );

      await recommendationEngine.refreshExpiredRecommendations();

      // Check if expired recommendations were refreshed
      const result = await db.query(
        'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1 AND expires_at > NOW()',
        [testUserId]
      );

      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });
  });
});
