/**
 * Security and Vulnerability Tests
 * TASK-019: API Integration Tests - FR-001 through FR-007
 * 
 * This file contains security tests to ensure the API is protected
 * against common vulnerabilities and security threats.
 */

import request from 'supertest';
import { App } from '@/backend/src/app';
import { setupTestDatabase, teardownTestDatabase } from './test-database-setup';

describe('Security and Vulnerability Tests', () => {
  let app: App;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Initialize app
    app = new App();
    
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Setup test user
    await setupTestUser();
  });

  afterAll(async () => {
    // Cleanup test database
    await teardownTestDatabase();
  });

  async function setupTestUser() {
    const userData = {
      email: 'security@example.com',
      password: 'password123',
      preferences: {
        categories: ['electronics'],
        priceRange: { min: 0, max: 500 },
        brands: ['Apple'],
        stylePreferences: ['modern']
      }
    };

    const response = await request(app.getApp())
      .post('/api/v1/users/register')
      .send(userData);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  }

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with malformed token', async () => {
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      // This would require creating an expired token
      // For now, we'll test with a clearly invalid token
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1NjAwMCwiZXhwIjoxNjA5NDU2MDAwfQ.invalid')
        .expect(401);
    });

    it('should reject requests with wrong token format', async () => {
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Basic dGVzdDp0ZXN0')
        .expect(401);
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app.getApp())
        .get(`/api/v1/products/search?q=${encodeURIComponent(maliciousInput)}`)
        .expect(200);

      // Should not crash and should return empty results or sanitized results
      expect(response.body.success).toBe(true);
    });

    it('should sanitize XSS attempts in search queries', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app.getApp())
        .get(`/api/v1/products/search?q=${encodeURIComponent(xssPayload)}`)
        .expect(200);

      // Should not execute script and should return sanitized results
      expect(response.body.success).toBe(true);
      expect(response.body.data.query).not.toContain('<script>');
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example..com'
      ];

      for (const email of invalidEmails) {
        await request(app.getApp())
          .post('/api/v1/users/register')
          .send({
            email,
            password: 'password123',
            preferences: {
              categories: ['electronics'],
              priceRange: { min: 0, max: 500 },
              brands: ['Apple'],
              stylePreferences: ['modern']
            }
          })
          .expect(400);
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abcdefgh'
      ];

      for (const password of weakPasswords) {
        await request(app.getApp())
          .post('/api/v1/users/register')
          .send({
            email: `test${Math.random()}@example.com`,
            password,
            preferences: {
              categories: ['electronics'],
              priceRange: { min: 0, max: 500 },
              brands: ['Apple'],
              stylePreferences: ['modern']
            }
          })
          .expect(400);
      }
    });

    it('should validate numeric inputs', async () => {
      const invalidNumbers = [
        'not-a-number',
        'NaN',
        'Infinity',
        '-Infinity'
      ];

      for (const number of invalidNumbers) {
        await request(app.getApp())
          .get(`/api/v1/products?minPrice=${number}`)
          .expect(400);
      }
    });

    it('should validate array inputs', async () => {
      await request(app.getApp())
        .post('/api/v1/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          preferences: {
            categories: 'not-an-array', // Should be array
            priceRange: { min: 0, max: 500 },
            brands: ['Apple'],
            stylePreferences: ['modern']
          }
        })
        .expect(400);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent access to other users profiles', async () => {
      // Create another user
      const anotherUser = {
        email: 'another@example.com',
        password: 'password123',
        preferences: {
          categories: ['electronics'],
          priceRange: { min: 0, max: 500 },
          brands: ['Apple'],
          stylePreferences: ['modern']
        }
      };

      const response = await request(app.getApp())
        .post('/api/v1/users/register')
        .send(anotherUser);

      const anotherToken = response.body.data.token;

      // Try to access first user's profile with second user's token
      await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200); // This should work as it returns the authenticated user's profile

      // The profile should belong to the authenticated user, not the first user
      expect(response.body.data.user.email).toBe(anotherUser.email);
    });

    it('should prevent unauthorized product creation', async () => {
      await request(app.getApp())
        .post('/api/v1/products')
        .send({
          name: 'Unauthorized Product',
          price: 99.99,
          category: 'test',
          brand: 'TestBrand'
        })
        .expect(401);
    });

    it('should prevent unauthorized interaction recording', async () => {
      await request(app.getApp())
        .post('/api/v1/interactions')
        .send({
          productId: 1,
          type: 'view'
        })
        .expect(401);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent brute force attacks on login', async () => {
      const loginAttempts = Array.from({ length: 20 }, () =>
        request(app.getApp())
          .post('/api/v1/users/login')
          .send({
            email: 'security@example.com',
            password: 'wrong-password'
          })
      );

      const responses = await Promise.all(loginAttempts);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429).length;
      expect(rateLimited).toBeGreaterThan(0);
    });

    it('should prevent spam registration attempts', async () => {
      const registrationAttempts = Array.from({ length: 15 }, (_, i) =>
        request(app.getApp())
          .post('/api/v1/users/register')
          .send({
            email: `spam${i}@example.com`,
            password: 'password123',
            preferences: {
              categories: ['electronics'],
              priceRange: { min: 0, max: 500 },
              brands: ['Apple'],
              stylePreferences: ['modern']
            }
          })
      );

      const responses = await Promise.all(registrationAttempts);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429).length;
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe('Data Exposure Security', () => {
    it('should not expose sensitive user data in error messages', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong-password'
        })
        .expect(401);

      // Error message should not reveal whether email exists
      expect(response.body.error.message).not.toContain('email');
      expect(response.body.error.message).not.toContain('password');
    });

    it('should not expose database errors to clients', async () => {
      // This would require triggering a database error
      // For now, we'll test that error responses don't contain stack traces
      const response = await request(app.getApp())
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      expect(response.body.error.stack).toBeUndefined();
    });

    it('should not expose internal system information', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response should not contain internal fields
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.password).toBeUndefined();
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getApp())
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getApp())
        .options('/api/v1/products')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('File Upload Security', () => {
    it('should reject malicious file uploads', async () => {
      // This would require implementing file upload functionality
      // For now, we'll test that the API rejects unexpected content types
      await request(app.getApp())
        .post('/api/v1/users/profile')
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send('malicious content')
        .expect(400);
    });
  });

  describe('JSON Security', () => {
    it('should handle malformed JSON gracefully', async () => {
      await request(app.getApp())
        .post('/api/v1/users/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "password123"') // Missing closing brace
        .expect(400);
    });

    it('should reject oversized JSON payloads', async () => {
      const largePayload = JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        preferences: {
          categories: Array(1000).fill('electronics'), // Very large array
          priceRange: { min: 0, max: 500 },
          brands: ['Apple'],
          stylePreferences: ['modern']
        }
      });

      await request(app.getApp())
        .post('/api/v1/users/register')
        .send(largePayload)
        .expect(400);
    });
  });

  describe('Parameter Pollution', () => {
    it('should handle duplicate parameters safely', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/products?category=electronics&category=clothing')
        .expect(200);

      // Should handle duplicate parameters gracefully
      expect(response.body.success).toBe(true);
    });

    it('should handle array parameters safely', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/products?category[]=electronics&category[]=clothing')
        .expect(200);

      // Should handle array parameters gracefully
      expect(response.body.success).toBe(true);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should prevent path traversal attacks', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const path of maliciousPaths) {
        await request(app.getApp())
          .get(`/api/v1/products/${path}`)
          .expect(400);
      }
    });
  });

  describe('HTTP Method Security', () => {
    it('should reject unsupported HTTP methods', async () => {
      await request(app.getApp())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await request(app.getApp())
        .head('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
