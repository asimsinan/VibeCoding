import { InteractionService } from '@/lib/services/InteractionService';
import { DatabaseService } from '@/backend/src/services/DatabaseService';
import { UserService } from '@/lib/services/UserService';
import { ProductService } from '@/lib/services/ProductService';
import { InteractionCreateData, InteractionType } from '@/lib/recommendation-engine/models/Interaction';

describe('InteractionService Integration Tests', () => {
  let interactionService: InteractionService;
  let userService: UserService;
  let productService: ProductService;
  let db: DatabaseService;
  let testUserId: number;
  let testProductId: number;
  let testInteractionId: number;

  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
    
    userService = new UserService(db);
    productService = new ProductService(db);
    interactionService = new InteractionService(db);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (testProductId) {
      await db.query('DELETE FROM products WHERE id = $1', [testProductId]);
    }
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test%']);
    await db.query('DELETE FROM products WHERE name LIKE $1', ['Test%']);
    await db.query('DELETE FROM interactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test%']);
  });

  describe('Test Data Setup', () => {
    it('should create test user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 10, max: 1000 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        }
      };

      const { user } = await userService.register(userData);
      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    });

    it('should create test product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for interactions',
        price: 99.99,
        category: 'Electronics',
        brand: 'TestBrand',
        availability: true
      };

      const product = await productService.createProduct(productData);
      testProductId = product.id;

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
    });
  });

  describe('Interaction Recording', () => {
    it('should record a new interaction', async () => {
      const interactionData: InteractionCreateData = {
        userId: testUserId,
        productId: testProductId,
        type: 'view',
        metadata: { source: 'homepage', duration: 30 }
      };

      const interaction = await interactionService.recordInteraction(interactionData);

      expect(interaction).toBeDefined();
      expect(interaction.userId).toBe(testUserId);
      expect(interaction.productId).toBe(testProductId);
      expect(interaction.type).toBe('view');
      expect(interaction.metadata).toEqual(interactionData.metadata);
      expect(interaction.id).toBeDefined();

      testInteractionId = interaction.id;
    });

    it('should fail to record interaction with non-existent user', async () => {
      const interactionData: InteractionCreateData = {
        userId: 99999,
        productId: testProductId,
        type: 'view',
        metadata: { source: 'homepage' }
      };

      await expect(interactionService.recordInteraction(interactionData)).rejects.toThrow('User not found');
    });

    it('should fail to record interaction with non-existent product', async () => {
      const interactionData: InteractionCreateData = {
        userId: testUserId,
        productId: 99999,
        type: 'view',
        metadata: { source: 'homepage' }
      };

      await expect(interactionService.recordInteraction(interactionData)).rejects.toThrow('Product not found');
    });

    it('should fail to record interaction with invalid data', async () => {
      const interactionData: InteractionCreateData = {
        userId: testUserId,
        productId: testProductId,
        type: 'invalid_type' as InteractionType,
        metadata: { source: 'homepage' }
      };

      await expect(interactionService.recordInteraction(interactionData)).rejects.toThrow('Validation failed');
    });
  });

  describe('Interaction Retrieval', () => {
    beforeEach(async () => {
      // Create additional test interactions
      const interactions: InteractionCreateData[] = [
        {
          userId: testUserId,
          productId: testProductId,
          type: 'like',
          metadata: { source: 'product_page' }
        },
        {
          userId: testUserId,
          productId: testProductId,
          type: 'purchase',
          metadata: { source: 'checkout' }
        }
      ];

      for (const interactionData of interactions) {
        await interactionService.recordInteraction(interactionData);
      }
    });

    it('should get user interactions', async () => {
      const interactions = await interactionService.getUserInteractions(testUserId, 10, 0);

      expect(Array.isArray(interactions)).toBe(true);
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions.every(i => i.userId === testUserId)).toBe(true);
    });

    it('should get product interactions', async () => {
      const interactions = await interactionService.getProductInteractions(testProductId, 10, 0);

      expect(Array.isArray(interactions)).toBe(true);
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions.every(i => i.productId === testProductId)).toBe(true);
    });

    it('should get recent interactions', async () => {
      const recentInteractions = await interactionService.getRecentInteractions(testUserId, 24);

      expect(Array.isArray(recentInteractions)).toBe(true);
      expect(recentInteractions.every(i => i.userId === testUserId)).toBe(true);
    });

    it('should get interaction history for user-product pair', async () => {
      const history = await interactionService.getInteractionHistory(testUserId, testProductId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.every(i => i.userId === testUserId && i.productId === testProductId)).toBe(true);
    });
  });

  describe('Analytics and Statistics', () => {
    it('should get user interaction statistics', async () => {
      const stats = await interactionService.getUserInteractionStats(testUserId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalInteractions).toBe('number');
      expect(typeof stats.purchases).toBe('number');
      expect(typeof stats.likes).toBe('number');
      expect(typeof stats.dislikes).toBe('number');
      expect(typeof stats.views).toBe('number');
      expect(typeof stats.uniqueProducts).toBe('number');
      expect(typeof stats.activeDays).toBe('number');
      expect(typeof stats.conversionRate).toBe('number');
    });

    it('should get product analytics', async () => {
      const analytics = await interactionService.getProductAnalytics(testProductId);

      expect(analytics).toBeDefined();
      expect(analytics.productId).toBe(testProductId);
      expect(typeof analytics.totalInteractions).toBe('number');
      expect(typeof analytics.purchases).toBe('number');
      expect(typeof analytics.likes).toBe('number');
      expect(typeof analytics.dislikes).toBe('number');
      expect(typeof analytics.views).toBe('number');
      expect(typeof analytics.uniqueUsers).toBe('number');
      expect(typeof analytics.conversionRate).toBe('number');
      expect(typeof analytics.recentInteractions).toBe('number');
    });

    it('should get user analytics', async () => {
      const analytics = await interactionService.getUserAnalytics(testUserId);

      expect(analytics).toBeDefined();
      expect(analytics.userId).toBe(testUserId);
      expect(typeof analytics.totalInteractions).toBe('number');
      expect(typeof analytics.purchases).toBe('number');
      expect(typeof analytics.likes).toBe('number');
      expect(typeof analytics.dislikes).toBe('number');
      expect(typeof analytics.views).toBe('number');
      expect(typeof analytics.uniqueProducts).toBe('number');
      expect(typeof analytics.categoriesExplored).toBe('number');
      expect(typeof analytics.conversionRate).toBe('number');
      expect(typeof analytics.weeklyInteractions).toBe('number');
      expect(typeof analytics.monthlyInteractions).toBe('number');
    });

    it('should get top products', async () => {
      const topProducts = await interactionService.getTopProducts(5, 'week');

      expect(Array.isArray(topProducts)).toBe(true);
      expect(topProducts.length).toBeLessThanOrEqual(5);
      
      topProducts.forEach(product => {
        expect(typeof product.productId).toBe('number');
        expect(typeof product.score).toBe('number');
        expect(typeof product.interactions).toBe('number');
      });
    });

    it('should get user recommendation history', async () => {
      const history = await interactionService.getUserRecommendationHistory(testUserId);

      expect(Array.isArray(history)).toBe(true);
      
      history.forEach(item => {
        expect(typeof item.productId).toBe('number');
        expect(Array.isArray(item.interactions)).toBe(true);
      });
    });
  });

  describe('Interaction Management', () => {
    it('should update interaction', async () => {
      const updatedInteraction = await interactionService.updateInteraction(
        testInteractionId,
        'like',
        { source: 'updated', reason: 'changed_mind' }
      );

      expect(updatedInteraction).toBeDefined();
      expect(updatedInteraction.id).toBe(testInteractionId);
      expect(updatedInteraction.type).toBe('like');
      expect(updatedInteraction.metadata).toEqual({ source: 'updated', reason: 'changed_mind' });
    });

    it('should fail to update non-existent interaction', async () => {
      await expect(interactionService.updateInteraction(99999, 'like')).rejects.toThrow('Interaction not found');
    });

    it('should delete interaction', async () => {
      const deleteResult = await interactionService.deleteInteraction(testInteractionId);

      expect(deleteResult).toBe(true);

      // Verify interaction is deleted
      const interactions = await interactionService.getUserInteractions(testUserId);
      expect(interactions.find(i => i.id === testInteractionId)).toBeUndefined();
    });

    it('should fail to delete non-existent interaction', async () => {
      const deleteResult = await interactionService.deleteInteraction(99999);

      expect(deleteResult).toBe(false);
    });
  });
});
