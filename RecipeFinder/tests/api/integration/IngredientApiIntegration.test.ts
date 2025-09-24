/**
 * Ingredient API Integration Tests
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Integration Tests (RED phase - should fail)
 */

import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { SQLiteDatabase } from '../../../src/lib/database/SQLiteDatabase';

describe('Ingredient API Integration Tests', () => {
  let app: any;
  let database: SQLiteDatabase;

  beforeAll(async () => {
    // Initialize database
    database = new SQLiteDatabase(':memory:');
    await database.initialize();
    
    // Create Express app with actual implementation
    app = createApp(database);
  });

  afterAll(async () => {
    if (database) {
      await database.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await database.clearAllData();
    
    // Insert sample ingredients
    await database.insertIngredient({
      name: 'chicken breast',
      normalizedName: 'chicken breast',
      category: 'protein',
      variations: ['chicken', 'chicken breast meat'],
      synonyms: ['chicken fillet']
    });

    await database.insertIngredient({
      name: 'tomatoes',
      normalizedName: 'tomato',
      category: 'vegetable',
      variations: ['tomato', 'cherry tomatoes'],
      synonyms: ['tomato fruit']
    });

    await database.insertIngredient({
      name: 'garlic',
      normalizedName: 'garlic',
      category: 'vegetable',
      variations: ['garlic cloves', 'garlic bulb'],
      synonyms: ['garlic clove']
    });

    await database.insertIngredient({
      name: 'onion',
      normalizedName: 'onion',
      category: 'vegetable',
      variations: ['onions', 'yellow onion'],
      synonyms: ['onion bulb']
    });
  });

  describe('GET /api/v1/ingredients/suggestions', () => {
    test('should get ingredient suggestions by query', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chicken' })
        .expect(200);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('ingredients');
      expect(Array.isArray(response.body.ingredients)).toBe(true);
      expect(response.body.ingredients.length).toBeGreaterThan(0);
    });

    test('should handle empty query string', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: '' })
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    test('should handle partial matches', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chick' })
        .expect(200);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body.ingredients.length).toBeGreaterThan(0);
      expect(response.body.ingredients[0].name).toContain('chicken');
    });

    test('should handle limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'vegetable', limit: 2 })
        .expect(200);

      // This will fail - RED phase
      expect(response.body.ingredients.length).toBeLessThanOrEqual(2);
    });

    test('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'nonexistent' })
        .expect(200);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body.ingredients).toHaveLength(0);
    });

    test('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chicken', limit: 'not-a-number' })
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    test('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('Error handling', () => {
    test('should handle database connection errors', async () => {
      // Close database to simulate connection error
      await database.close();
      
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chicken' })
        .expect(500);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('InternalServerError');

      // Re-initialize database for subsequent tests
      database = new SQLiteDatabase(':memory:');
      await database.initialize();
      
      // Re-create the app with the new database
      app = createApp(database);
    });

    test('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 123 }) // Invalid type
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });
  });
});
