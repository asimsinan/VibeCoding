/**
 * Recipe API End-to-End Tests
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: E2E Tests (RED phase - should fail)
 */

import request from 'supertest';
import express from 'express';
import { RecipeController, IngredientController } from '../../../src/api/types/ApiTypes';
import { SQLiteDatabase } from '../../../src/lib/database/SQLiteDatabase';

describe('Recipe API End-to-End Tests', () => {
  let app: express.Application;
  let database: SQLiteDatabase;

  beforeAll(async () => {
    // Initialize database
    database = new SQLiteDatabase(':memory:');
    await database.initialize();
    
    // Create Express app (this will fail - RED phase)
    app = express();
    app.use(express.json());
    
    // This will fail - RED phase
    const recipeController: RecipeController = {} as RecipeController;
    const ingredientController: IngredientController = {} as IngredientController;
    
    // Mock routes (this will fail - RED phase)
    app.get('/api/v1/recipes/search', recipeController.searchRecipes);
    app.get('/api/v1/recipes/:id', recipeController.getRecipe);
    app.get('/api/v1/recipes/popular', recipeController.getPopularRecipes);
    app.get('/api/v1/ingredients/suggestions', ingredientController.getSuggestions);
  });

  afterAll(async () => {
    if (database) {
      await database.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await database.clearAllData();
    
    // Insert comprehensive sample data
    await database.insertRecipe({
      id: 'recipe-1',
      title: 'Chicken Stir Fry',
      description: 'Quick and easy chicken stir fry with vegetables',
      image: 'https://example.com/chicken-stir-fry.jpg',
      cookingTime: 20,
      difficulty: 'easy',
      ingredients: ['chicken breast', 'bell peppers', 'onion', 'garlic', 'soy sauce', 'vegetable oil'],
      instructions: [
        'Cut chicken into strips',
        'Heat oil in large pan',
        'Cook chicken until golden brown',
        'Add vegetables and stir fry',
        'Season with soy sauce',
        'Serve hot'
      ]
    });

    await database.insertRecipe({
      id: 'recipe-2',
      title: 'Tomato Pasta',
      description: 'Simple and delicious tomato pasta dish',
      image: 'https://example.com/tomato-pasta.jpg',
      cookingTime: 15,
      difficulty: 'easy',
      ingredients: ['pasta', 'tomatoes', 'garlic', 'olive oil', 'basil', 'onion'],
      instructions: [
        'Boil pasta according to package directions',
        'Heat olive oil in pan',
        'Add garlic and onion, cook until fragrant',
        'Add tomatoes and cook until soft',
        'Mix with pasta and garnish with basil'
      ]
    });

    await database.insertRecipe({
      id: 'recipe-3',
      title: 'Beef Stew',
      description: 'Hearty beef stew with root vegetables',
      image: 'https://example.com/beef-stew.jpg',
      cookingTime: 120,
      difficulty: 'medium',
      ingredients: ['beef chuck', 'carrots', 'potatoes', 'onion', 'garlic', 'beef broth', 'red wine'],
      instructions: [
        'Cut beef into cubes',
        'Brown beef in large pot',
        'Add vegetables and cook until soft',
        'Add broth and wine',
        'Simmer for 2 hours until tender'
      ]
    });

    // Insert ingredients
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

  describe('Complete Recipe Search Workflow', () => {
    test('should perform complete search workflow from ingredients to recipe details', async () => {
      // Step 1: Search for recipes with ingredients
      const searchResponse = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: 'chicken,tomato' })
        .expect(200);

      // This will fail - RED phase
      expect(searchResponse.body).toHaveProperty('recipes');
      expect(searchResponse.body.recipes.length).toBeGreaterThan(0);
      
      const firstRecipe = searchResponse.body.recipes[0];
      expect(firstRecipe).toHaveProperty('id');
      expect(firstRecipe).toHaveProperty('title');
      expect(firstRecipe).toHaveProperty('description');

      // Step 2: Get detailed recipe information
      const detailResponse = await request(app)
        .get(`/api/v1/recipes/${firstRecipe.id}`)
        .expect(200);

      // This will fail - RED phase
      expect(detailResponse.body).toHaveProperty('recipe');
      expect(detailResponse.body.recipe.id).toBe(firstRecipe.id);
      expect(detailResponse.body.recipe).toHaveProperty('ingredients');
      expect(detailResponse.body.recipe).toHaveProperty('instructions');
    });

    test('should handle ingredient suggestions workflow', async () => {
      // Step 1: Get ingredient suggestions
      const suggestionsResponse = await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chick' })
        .expect(200);

      // This will fail - RED phase
      expect(suggestionsResponse.body).toHaveProperty('ingredients');
      expect(suggestionsResponse.body.ingredients.length).toBeGreaterThan(0);
      
      const suggestion = suggestionsResponse.body.ingredients[0];
      expect(suggestion).toHaveProperty('name');
      expect(suggestion).toHaveProperty('category');

      // Step 2: Use suggestion to search recipes
      const searchResponse = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: suggestion.name })
        .expect(200);

      // This will fail - RED phase
      expect(searchResponse.body).toHaveProperty('recipes');
    });

    test('should handle popular recipes workflow', async () => {
      // Get popular recipes
      const popularResponse = await request(app)
        .get('/api/v1/recipes/popular')
        .query({ limit: 2 })
        .expect(200);

      // This will fail - RED phase
      expect(popularResponse.body).toHaveProperty('recipes');
      expect(popularResponse.body.recipes.length).toBeLessThanOrEqual(2);
      
      // Verify each recipe has required fields
      popularResponse.body.recipes.forEach((recipe: any) => {
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('title');
        expect(recipe).toHaveProperty('description');
        expect(recipe).toHaveProperty('cookingTime');
        expect(recipe).toHaveProperty('difficulty');
      });
    });
  });

  describe('API Performance Tests', () => {
    test('should respond within 500ms for search requests', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: 'chicken,garlic' })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // This will fail - RED phase
      expect(responseTime).toBeLessThan(500);
    });

    test('should respond within 200ms for recipe detail requests', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/recipes/recipe-1')
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // This will fail - RED phase
      expect(responseTime).toBeLessThan(200);
    });

    test('should respond within 300ms for ingredient suggestions', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/ingredients/suggestions')
        .query({ query: 'chicken' })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // This will fail - RED phase
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('API Security Tests', () => {
    test('should handle malicious input in search parameters', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: maliciousInput })
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    test('should handle SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE recipes; --";
      
      const response = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: sqlInjection })
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });

    test('should handle oversized requests', async () => {
      const largeIngredients = Array(1000).fill('chicken');
      
      const response = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: largeIngredients.join(',') })
        .expect(400);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('Error Recovery Tests', () => {
    test('should recover from database connection errors', async () => {
      // Close database to simulate connection error
      await database.close();
      
      const response = await request(app)
        .get('/api/v1/recipes/search')
        .query({ ingredients: 'chicken' })
        .expect(500);

      // This will fail - RED phase
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('InternalServerError');
    });

    test('should handle concurrent requests gracefully', async () => {
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/v1/recipes/search')
          .query({ ingredients: 'chicken' })
      );

      const responses = await Promise.allSettled(promises);
      
      // This will fail - RED phase
      expect(responses.length).toBe(10);
      // At least some requests should succeed
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
