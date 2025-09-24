/**
 * Recipe API Integration Tests
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Integration Tests (RED phase - should fail)
 */

import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { SQLiteDatabase } from '../../../src/lib/database/SQLiteDatabase';

describe('Recipe API Integration Tests', () => {
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
    
    // Insert sample data
    await database.insertRecipe({
      id: 'recipe-1',
      title: 'Chicken Stir Fry',
      description: 'Quick and easy chicken stir fry',
      image: 'https://example.com/chicken-stir-fry.jpg',
      cookingTime: 20,
      difficulty: 'easy',
      ingredients: ['chicken breast', 'bell peppers', 'onion', 'garlic', 'soy sauce'],
      instructions: ['Cut chicken into strips', 'Heat oil in pan', 'Cook chicken until done', 'Add vegetables', 'Season with soy sauce']
    });

    await database.insertRecipe({
      id: 'recipe-2',
      title: 'Tomato Pasta',
      description: 'Simple tomato pasta dish',
      image: 'https://example.com/tomato-pasta.jpg',
      cookingTime: 15,
      difficulty: 'easy',
      ingredients: ['pasta', 'tomatoes', 'garlic', 'olive oil', 'basil'],
      instructions: ['Boil pasta', 'Heat oil in pan', 'Add garlic and tomatoes', 'Mix with pasta', 'Garnish with basil']
    });

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
  });

  describe('POST /api/v1/recipes/search', () => {
    test('should search recipes by ingredients', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/search')
        .send({ ingredients: ['chicken', 'tomato'] })
        .expect(200);

      expect(response.body).toHaveProperty('recipes');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.recipes)).toBe(true);
    });

    test('should handle empty ingredients array', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/search')
        .send({ ingredients: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/search')
        .send({ 
          ingredients: ['chicken'], 
          limit: 1, 
          offset: 0 
        })
        .expect(200);

      expect(response.body).toHaveProperty('recipes');
      expect(response.body.recipes.length).toBeLessThanOrEqual(1);
    });

    test('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/search')
        .send({ 
          ingredients: ['chicken'], 
          limit: 101 
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('GET /api/v1/recipes/:id', () => {
    test('should get recipe by ID', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/recipe-1')
        .expect(200);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('recipe');
      expect(response.body.recipe).toHaveProperty('id', 'recipe-1');
      expect(response.body.recipe).toHaveProperty('title', 'Chicken Stir Fry');
    });

    test('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/non-existent')
        .expect(404);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('NotFoundError');
    });

    test('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/invalid-id-!')
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('GET /api/v1/recipes/popular', () => {
    test('should get popular recipes', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/popular')
        .expect(200);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('recipes');
      expect(Array.isArray(response.body.recipes)).toBe(true);
    });

    test('should handle limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/popular')
        .query({ limit: 1 })
        .expect(200);

      // This will fail - RED phase
      expect(response.body.recipes.length).toBeLessThanOrEqual(1);
    });

    test('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/popular')
        .query({ limit: 'not-a-number' })
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
        .post('/api/v1/recipes/search')
        .send({ ingredients: ['chicken'] })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('InternalServerError');

      // Re-initialize database for subsequent tests
      database = new SQLiteDatabase(':memory:');
      await database.initialize();
      
      // Re-create the app with the new database
      app = createApp(database);
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/search')
        .set('Content-Type', 'application/json')
        .send('{"ingredients": "chicken"') // Malformed JSON
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('BadRequestError');
    });
  });
});
