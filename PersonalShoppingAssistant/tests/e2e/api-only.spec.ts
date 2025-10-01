/**
 * API-Only E2E Tests
 * TASK-025: User Journey Tests
 * 
 * Tests the backend API endpoints directly without frontend.
 * This ensures the API is working correctly before frontend integration.
 */

import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('status', 'healthy');
  });

  test('should list products', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/products');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data.products)).toBe(true);
    expect(data.data.products.length).toBeGreaterThan(0);
  });

  test('should register a new user', async ({ request }) => {
    const timestamp = Date.now();
    const userData = {
      email: `test${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    };

    const response = await request.post('http://localhost:3001/api/v1/users/register', {
      data: userData
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('user');
    expect(data.data).toHaveProperty('token');
    expect(data.data.user.email).toBe(userData.email);
  });

  test('should login with valid credentials', async ({ request }) => {
    // First register a user
    const timestamp = Date.now();
    const userData = {
      email: `test${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    };

    // Register the user first
    await request.post('http://localhost:3001/api/v1/users/register', {
      data: userData
    });

    const loginData = {
      email: userData.email,
      password: 'testpassword123'
    };

    const response = await request.post('http://localhost:3001/api/v1/users/login', {
      data: loginData
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('user');
    expect(data.data).toHaveProperty('token');
  });

  test('should search products', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/products/search?q=laptop');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data.products)).toBe(true);
  });

  test('should get product by ID', async ({ request }) => {
    // First get a product ID from the list
    const listResponse = await request.get('http://localhost:3001/api/v1/products');
    const listData = await listResponse.json();
    const productId = listData.data.products[0].id;

    const response = await request.get(`http://localhost:3001/api/v1/products/${productId}`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data.id).toBe(productId);
  });

  test('should handle invalid product ID', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/products/99999');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should require authentication for protected endpoints', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/users/profile');
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should validate user registration data', async ({ request }) => {
    const invalidUserData = {
      email: 'invalid-email',
      password: '123', // Too short
      name: ''
    };

    const response = await request.post('http://localhost:3001/api/v1/users/register', {
      data: invalidUserData
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should handle database errors gracefully', async ({ request }) => {
    // First register a user
    const timestamp = Date.now();
    const userData = {
      email: `test${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    };

    // Register the user first
    await request.post('http://localhost:3001/api/v1/users/register', {
      data: userData
    });

    // Now try to register the same user again
    const duplicateUserData = {
      email: userData.email, // Same email as above
      password: 'testpassword123',
      name: 'Test User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    };

    const response = await request.post('http://localhost:3001/api/v1/users/register', {
      data: duplicateUserData
    });
    
    expect(response.status()).toBe(409); // Conflict
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });
});
