/**
 * Performance and Load Tests
 * TASK-019: API Integration Tests - FR-001 through FR-007
 * 
 * This file contains performance and load tests to ensure the API
 * can handle expected traffic and meets performance requirements.
 */

import request from 'supertest';
import { App } from '@/backend/src/app';
import { setupTestDatabase, teardownTestDatabase } from './test-database-setup';

describe('Performance and Load Tests', () => {
  let app: App;
  let authToken: string;
  let userId: number;
  let productIds: number[] = [];

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Initialize app
    app = new App();
    
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test database
    await teardownTestDatabase();
  });

  async function setupTestData() {
    // Register a test user
    const userData = {
      email: 'perf@example.com',
      password: 'password123',
      preferences: {
        categories: ['electronics', 'clothing'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Nike'],
        stylePreferences: ['modern', 'casual']
      }
    };

    const response = await request(app.getApp())
      .post('/api/v1/users/register')
      .send(userData);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;

    // Create test products
    const products = Array.from({ length: 50 }, (_, i) => ({
      name: `Test Product ${i + 1}`,
      description: `Description for test product ${i + 1}`,
      price: Math.random() * 1000 + 10,
      category: ['electronics', 'clothing', 'books', 'home'][i % 4],
      brand: ['Apple', 'Nike', 'Samsung', 'Adidas'][i % 4],
      availability: true,
      style: ['modern', 'casual', 'professional', 'vintage'][i % 4]
    }));

    for (const product of products) {
      const productResponse = await request(app.getApp())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(product);
      
      if (productResponse.status === 201) {
        productIds.push(productResponse.body.data.id);
      }
    }
  }

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      
      await request(app.getApp())
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should respond to product listing within 500ms', async () => {
      const start = Date.now();
      
      await request(app.getApp())
        .get('/api/v1/products?limit=20')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should respond to product search within 1s', async () => {
      const start = Date.now();
      
      await request(app.getApp())
        .get('/api/v1/products/search?q=test&limit=20')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should respond to recommendations within 2s', async () => {
      const start = Date.now();
      
      await request(app.getApp())
        .get('/api/v1/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent health checks', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app.getApp()).get('/health')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 20 concurrent product requests', async () => {
      const promises = Array.from({ length: 20 }, () =>
        request(app.getApp()).get('/api/v1/products?limit=10')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 5 concurrent authenticated requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app.getApp())
          .get('/api/v1/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle bulk product creation efficiently', async () => {
      const products = Array.from({ length: 10 }, (_, i) => ({
        name: `Bulk Product ${i + 1}`,
        description: `Bulk description ${i + 1}`,
        price: Math.random() * 500 + 50,
        category: 'test',
        brand: 'TestBrand',
        availability: true
      }));

      const start = Date.now();
      
      const promises = products.map(product =>
        request(app.getApp())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle bulk interaction recording efficiently', async () => {
      const interactions = Array.from({ length: 20 }, (_, i) => ({
        productId: productIds[i % productIds.length],
        type: ['view', 'like', 'dislike'][i % 3],
        metadata: { test: true, index: i }
      }));

      const start = Date.now();
      
      const promises = interactions.map(interaction =>
        request(app.getApp())
          .post('/api/v1/interactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(interaction)
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app.getApp())
          .get('/api/v1/products?limit=10')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Rate Tests', () => {
    it('should maintain low error rate under load', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => {
        if (i % 10 === 0) {
          // Every 10th request is invalid to test error handling
          return request(app.getApp())
            .get('/api/v1/products/invalid-id')
            .expect(400);
        } else {
          return request(app.getApp())
            .get('/api/v1/products?limit=10')
            .expect(200);
        }
      });

      const responses = await Promise.allSettled(requests);
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const errorRate = (responses.length - successful) / responses.length;
      
      // Error rate should be less than 5%
      expect(errorRate).toBeLessThan(0.05);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should respect rate limits', async () => {
      // Make rapid requests to test rate limiting
      const requests = Array.from({ length: 150 }, () =>
        request(app.getApp()).get('/api/v1/products')
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length;
      
      // Should have some rate limited requests
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Performance Tests', () => {
    it('should generate recommendations within acceptable time', async () => {
      const algorithms = ['collaborative', 'content-based', 'hybrid', 'popularity'];
      
      for (const algorithm of algorithms) {
        const start = Date.now();
        
        await request(app.getApp())
          .get(`/api/v1/recommendations/${algorithm}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        const duration = Date.now() - start;
        
        // Each algorithm should complete within 3 seconds
        expect(duration).toBeLessThan(3000);
      }
    });

    it('should handle recommendation refresh efficiently', async () => {
      const start = Date.now();
      
      await request(app.getApp())
        .post('/api/v1/recommendations/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      
      // Refresh should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Search Performance Tests', () => {
    it('should handle complex search queries efficiently', async () => {
      const searchQueries = [
        'test product',
        'electronics',
        'Apple',
        'modern style',
        'price under 500'
      ];

      for (const query of searchQueries) {
        const start = Date.now();
        
        await request(app.getApp())
          .get(`/api/v1/products/search?q=${encodeURIComponent(query)}`)
          .expect(200);
        
        const duration = Date.now() - start;
        
        // Each search should complete within 1 second
        expect(duration).toBeLessThan(1000);
      }
    });

    it('should handle filtering efficiently', async () => {
      const filters = [
        '?category=electronics',
        '?brand=Apple',
        '?minPrice=100&maxPrice=500',
        '?availability=true',
        '?category=electronics&brand=Apple&minPrice=100'
      ];

      for (const filter of filters) {
        const start = Date.now();
        
        await request(app.getApp())
          .get(`/api/v1/products${filter}`)
          .expect(200);
        
        const duration = Date.now() - start;
        
        // Each filter should complete within 500ms
        expect(duration).toBeLessThan(500);
      }
    });
  });
});
