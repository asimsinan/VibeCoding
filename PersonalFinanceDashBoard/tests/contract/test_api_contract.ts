import request from 'supertest';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import express from 'express';

// Import the test app from global setup
declare global {
  var testApp: express.Application;
  var testUserId: string;
  var testCategoryId: string;
}

const swaggerDocument = load(readFileSync('contracts/openapi.yaml', 'utf8'));

describe('API Contract Tests', () => {
  // Test for GET /transactions
  it('should retrieve transactions according to contract', async () => {
    const res = await request(global.testApp).get(`/api/transactions?userId=${global.testUserId}&startDate=2023-01-01&endDate=2023-01-31`);
    expect(res.statusCode).toBe(200);
    // Further assertions can be added here to validate response schema
  });

  // Test for POST /transactions
  it('should create a transaction according to contract', async () => {
    const newTransaction = {
      amount: 50.00,
      type: 'expense',
      date: '2023-01-15',
      description: 'Groceries',
      categoryId: global.testCategoryId, // Use the test category ID from Jest setup
      userId: global.testUserId, // Use the test user ID from Jest setup
    };
    const res = await request(global.testApp).post('/api/transactions').send(newTransaction);
    expect(res.statusCode).toBe(201);
    // Further assertions can be added here to validate response schema
  });

  // Test for GET /categories
  it('should retrieve categories according to contract', async () => {
    const res = await request(global.testApp).get('/api/categories');
    expect(res.statusCode).toBe(200);
  });

  // Test for POST /categories
  it('should create a category according to contract', async () => {
    const newCategory = {
      name: 'Food', 
      type: 'expense',
    };
    const res = await request(global.testApp).post('/api/categories').send(newCategory);
    expect(res.statusCode).toBe(201);
  });

  // Test for GET /dashboard/summary
  it('should retrieve dashboard summary according to contract', async () => {
    const res = await request(global.testApp).get('/api/dashboard/summary?startDate=2023-01-01&endDate=2023-01-31&groupBy=category');
    expect(res.statusCode).toBe(200);
  });
});
