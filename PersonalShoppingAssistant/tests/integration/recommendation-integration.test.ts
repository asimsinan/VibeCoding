/**
 * Recommendation Integration Tests - Real recommendation algorithm testing
 * TASK-003: Create Integration Test Scenarios - FR-002
 * 
 * These tests validate recommendation algorithms with real data
 * and will fail initially (RED phase) until the algorithms are implemented.
 */

import { Pool } from 'pg';
import { DatabaseService } from '../../src/backend/src/services/DatabaseService';
import { RecommendationService } from '../../src/lib/recommendation-engine/services/RecommendationService';
import { UserEntity, ProductEntity, InteractionEntity } from '../../src/contracts/types/domain.types';

describe('Recommendation Integration Tests', () => {
  let pool: Pool;
  let dbService: DatabaseService;
  let recommendationService: RecommendationService;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'test_shopping_assistant',
      user: process.env.DB_USER || 'test',
      password: process.env.DB_PASSWORD || 'test',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    dbService = new DatabaseService(pool);
    recommendationService = new RecommendationService(dbService);
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM interactions');
      await client.query('DELETE FROM user_preferences');
      await client.query('DELETE FROM users');
      await client.query('DELETE FROM products');
    } finally {
      client.release();
    }
  });

  describe('Collaborative Filtering Algorithm', () => {
    it('should recommend products based on similar users', async () => {
      // Create test users with different preferences
      const user1 = await dbService.createUser({
        email: 'user1@example.com',
        passwordHash: 'hash1',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 200 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern']
        }
      });

      const user2 = await dbService.createUser({
        email: 'user2@example.com',
        passwordHash: 'hash2',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 200 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern']
        }
      });

      const user3 = await dbService.createUser({
        email: 'user3@example.com',
        passwordHash: 'hash3',
        preferences: {
          categories: ['Clothing', 'Sports'],
          priceRange: { min: 50, max: 500 },
          brands: ['Nike', 'Adidas'],
          stylePreferences: ['Sporty']
        }
      });

      // Create test products
      const products = [
        await dbService.createProduct({
          name: 'iPhone',
          description: 'Apple iPhone',
          price: 999.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Samsung Galaxy',
          description: 'Samsung Galaxy phone',
          price: 899.99,
          category: 'Electronics',
          brand: 'Samsung',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Programming Book',
          description: 'Learn TypeScript',
          price: 49.99,
          category: 'Books',
          brand: 'TechBooks',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Running Shoes',
          description: 'Nike running shoes',
          price: 129.99,
          category: 'Sports',
          brand: 'Nike',
          availability: true
        })
      ];

      // Record interactions - user1 and user2 have similar tastes
      await dbService.recordInteraction({
        userId: user1.id,
        productId: products[0].id, // iPhone
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user1.id,
        productId: products[2].id, // Programming Book
        type: 'purchase'
      });

      await dbService.recordInteraction({
        userId: user2.id,
        productId: products[0].id, // iPhone
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user2.id,
        productId: products[1].id, // Samsung Galaxy
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user3.id,
        productId: products[3].id, // Running Shoes
        type: 'purchase'
      });

      // Get recommendations for user1 (should be similar to user2's preferences)
      const recommendations = await recommendationService.getRecommendations({
        userId: user1.id,
        userPreferences: user1.preferences,
        interactionHistory: await dbService.getUserInteractions(user1.id),
        availableProducts: products,
        limit: 3
      });

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].productId).toBe(products[1].id); // Samsung Galaxy (user2 liked it)
      expect(recommendations[0].score).toBeGreaterThan(0.5);
    });

    it('should handle cold start problem for new users', async () => {
      const newUser = await dbService.createUser({
        email: 'newuser@example.com',
        passwordHash: 'hash',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      });

      const products = [
        await dbService.createProduct({
          name: 'Popular Product 1',
          description: 'Very popular product',
          price: 99.99,
          category: 'Electronics',
          brand: 'PopularBrand',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Popular Product 2',
          description: 'Another popular product',
          price: 149.99,
          category: 'Electronics',
          brand: 'PopularBrand',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Unpopular Product',
          description: 'Not popular product',
          price: 299.99,
          category: 'Electronics',
          brand: 'UnpopularBrand',
          availability: true
        })
      ];

      // Make some products popular by recording interactions
      for (let i = 0; i < 10; i++) {
        const tempUser = await dbService.createUser({
          email: `temp${i}@example.com`,
          passwordHash: 'hash',
          preferences: {
            categories: ['Electronics'],
            priceRange: { min: 0, max: 1000 },
            brands: [],
            stylePreferences: []
          }
        });

        await dbService.recordInteraction({
          userId: tempUser.id,
          productId: products[0].id,
          type: 'like'
        });

        await dbService.recordInteraction({
          userId: tempUser.id,
          productId: products[1].id,
          type: 'purchase'
        });
      }

      const recommendations = await recommendationService.getRecommendations({
        userId: newUser.id,
        userPreferences: newUser.preferences,
        interactionHistory: [],
        availableProducts: products,
        limit: 2
      });

      // Should recommend popular products for new user
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].productId).toBe(products[0].id); // Most popular
      expect(recommendations[1].productId).toBe(products[1].id); // Second most popular
    });
  });

  describe('Content-Based Filtering Algorithm', () => {
    it('should recommend products based on user preferences', async () => {
      const user = await dbService.createUser({
        email: 'contentuser@example.com',
        passwordHash: 'hash',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 50, max: 300 },
          brands: ['Apple', 'TechBooks'],
          stylePreferences: ['Modern', 'Minimalist']
        }
      });

      const products = [
        await dbService.createProduct({
          name: 'MacBook Pro',
          description: 'Apple MacBook Pro laptop',
          price: 1999.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true
        }),
        await dbService.createProduct({
          name: 'iPad',
          description: 'Apple iPad tablet',
          price: 499.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true
        }),
        await dbService.createProduct({
          name: 'JavaScript Book',
          description: 'Learn JavaScript programming',
          price: 39.99,
          category: 'Books',
          brand: 'TechBooks',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Gaming Laptop',
          description: 'High-end gaming laptop',
          price: 1499.99,
          category: 'Electronics',
          brand: 'GamingBrand',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Fashion Magazine',
          description: 'Fashion and lifestyle magazine',
          price: 9.99,
          category: 'Books',
          brand: 'FashionBooks',
          availability: true
        })
      ];

      const recommendations = await recommendationService.getRecommendations({
        userId: user.id,
        userPreferences: user.preferences,
        interactionHistory: [],
        availableProducts: products,
        limit: 3
      });

      expect(recommendations).toHaveLength(3);
      
      // Should prioritize products matching user preferences
      const recommendedProductIds = recommendations.map(r => r.productId);
      expect(recommendedProductIds).toContain(products[1].id); // iPad (Apple, Electronics, within price range)
      expect(recommendedProductIds).toContain(products[2].id); // JavaScript Book (Books, TechBooks, within price range)
      
      // Should not recommend products outside preferences
      expect(recommendedProductIds).not.toContain(products[4].id); // Fashion Magazine (wrong brand)
    });

    it('should learn from user interactions and improve recommendations', async () => {
      const user = await dbService.createUser({
        email: 'learninguser@example.com',
        passwordHash: 'hash',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      });

      const products = [
        await dbService.createProduct({
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones',
          price: 199.99,
          category: 'Electronics',
          brand: 'AudioBrand',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Bluetooth Speaker',
          description: 'Portable wireless speaker',
          price: 79.99,
          category: 'Electronics',
          brand: 'AudioBrand',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Gaming Mouse',
          description: 'High-precision gaming mouse',
          price: 59.99,
          category: 'Electronics',
          brand: 'GamingBrand',
          availability: true
        })
      ];

      // User likes audio products
      await dbService.recordInteraction({
        userId: user.id,
        productId: products[0].id, // Wireless Headphones
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user.id,
        productId: products[1].id, // Bluetooth Speaker
        type: 'purchase'
      });

      // Update user preferences based on interactions
      await recommendationService.updateUserPreferences(user.id, {
        userId: user.id,
        productId: products[0].id,
        type: 'like'
      });

      const recommendations = await recommendationService.getRecommendations({
        userId: user.id,
        userPreferences: user.preferences,
        interactionHistory: await dbService.getUserInteractions(user.id),
        availableProducts: products,
        limit: 2
      });

      expect(recommendations).toHaveLength(2);
      
      // Should recommend audio products based on user's interaction history
      const recommendedProductIds = recommendations.map(r => r.productId);
      expect(recommendedProductIds).toContain(products[0].id); // Wireless Headphones (already liked)
      expect(recommendedProductIds).toContain(products[1].id); // Bluetooth Speaker (already purchased)
    });
  });

  describe('Hybrid Recommendation Algorithm', () => {
    it('should combine collaborative and content-based filtering', async () => {
      // Create users with overlapping preferences
      const user1 = await dbService.createUser({
        email: 'hybrid1@example.com',
        passwordHash: 'hash1',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 20, max: 200 },
          brands: ['Apple', 'TechBooks'],
          stylePreferences: ['Modern']
        }
      });

      const user2 = await dbService.createUser({
        email: 'hybrid2@example.com',
        passwordHash: 'hash2',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 20, max: 200 },
          brands: ['Apple', 'TechBooks'],
          stylePreferences: ['Modern']
        }
      });

      const user3 = await dbService.createUser({
        email: 'hybrid3@example.com',
        passwordHash: 'hash3',
        preferences: {
          categories: ['Clothing', 'Sports'],
          priceRange: { min: 50, max: 500 },
          brands: ['Nike', 'Adidas'],
          stylePreferences: ['Sporty']
        }
      });

      const products = [
        await dbService.createProduct({
          name: 'iPhone',
          description: 'Apple iPhone smartphone',
          price: 999.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true
        }),
        await dbService.createProduct({
          name: 'iPad',
          description: 'Apple iPad tablet',
          price: 499.99,
          category: 'Electronics',
          brand: 'Apple',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Programming Book',
          description: 'Learn TypeScript programming',
          price: 49.99,
          category: 'Books',
          brand: 'TechBooks',
          availability: true
        }),
        await dbService.createProduct({
          name: 'Running Shoes',
          description: 'Nike running shoes',
          price: 129.99,
          category: 'Sports',
          brand: 'Nike',
          availability: true
        })
      ];

      // Record interactions
      await dbService.recordInteraction({
        userId: user1.id,
        productId: products[0].id, // iPhone
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user1.id,
        productId: products[2].id, // Programming Book
        type: 'purchase'
      });

      await dbService.recordInteraction({
        userId: user2.id,
        productId: products[0].id, // iPhone
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user2.id,
        productId: products[1].id, // iPad
        type: 'like'
      });

      await dbService.recordInteraction({
        userId: user3.id,
        productId: products[3].id, // Running Shoes
        type: 'purchase'
      });

      // Get recommendations for user1 using hybrid algorithm
      const recommendations = await recommendationService.getRecommendations({
        userId: user1.id,
        userPreferences: user1.preferences,
        interactionHistory: await dbService.getUserInteractions(user1.id),
        availableProducts: products,
        limit: 3
      });

      expect(recommendations).toHaveLength(3);
      
      // Should combine collaborative (user2's preferences) and content-based (user1's preferences)
      const recommendedProductIds = recommendations.map(r => r.productId);
      expect(recommendedProductIds).toContain(products[1].id); // iPad (collaborative: user2 liked it, content-based: Apple brand)
      expect(recommendedProductIds).toContain(products[2].id); // Programming Book (content-based: user1's category and brand preferences)
    });

    it('should handle edge cases gracefully', async () => {
      const user = await dbService.createUser({
        email: 'edgecase@example.com',
        passwordHash: 'hash',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      });

      // Test with no products
      let recommendations = await recommendationService.getRecommendations({
        userId: user.id,
        userPreferences: user.preferences,
        interactionHistory: [],
        availableProducts: [],
        limit: 5
      });

      expect(recommendations).toHaveLength(0);

      // Test with no similar users
      const products = [
        await dbService.createProduct({
          name: 'Unique Product',
          description: 'A unique product',
          price: 99.99,
          category: 'Electronics',
          brand: 'UniqueBrand',
          availability: true
        })
      ];

      recommendations = await recommendationService.getRecommendations({
        userId: user.id,
        userPreferences: user.preferences,
        interactionHistory: [],
        availableProducts: products,
        limit: 5
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].productId).toBe(products[0].id);
    });
  });

  describe('Recommendation Performance Tests', () => {
    it('should generate recommendations within acceptable time', async () => {
      const user = await dbService.createUser({
        email: 'perfuser@example.com',
        passwordHash: 'hash',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 0, max: 1000 },
          brands: [],
          stylePreferences: []
        }
      });

      // Create many products
      const products = [];
      for (let i = 0; i < 1000; i++) {
        const product = await dbService.createProduct({
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          price: Math.random() * 1000,
          category: 'Electronics',
          brand: `Brand${i % 10}`,
          availability: true
        });
        products.push(product);
      }

      const startTime = Date.now();
      
      const recommendations = await recommendationService.getRecommendations({
        userId: user.id,
        userPreferences: user.preferences,
        interactionHistory: [],
        availableProducts: products,
        limit: 10
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(recommendations).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent recommendation requests', async () => {
      const users = [];
      const products = [];

      // Create multiple users
      for (let i = 0; i < 10; i++) {
        const user = await dbService.createUser({
          email: `concurrent${i}@example.com`,
          passwordHash: 'hash',
          preferences: {
            categories: ['Electronics'],
            priceRange: { min: 0, max: 1000 },
            brands: [],
            stylePreferences: []
          }
        });
        users.push(user);
      }

      // Create products
      for (let i = 0; i < 100; i++) {
        const product = await dbService.createProduct({
          name: `Concurrent Product ${i}`,
          description: `Description for product ${i}`,
          price: Math.random() * 1000,
          category: 'Electronics',
          brand: `Brand${i % 5}`,
          availability: true
        });
        products.push(product);
      }

      // Make concurrent recommendation requests
      const promises = users.map(user => 
        recommendationService.getRecommendations({
          userId: user.id,
          userPreferences: user.preferences,
          interactionHistory: [],
          availableProducts: products,
          limit: 5
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach(recommendations => {
        expect(recommendations).toHaveLength(5);
      });
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
