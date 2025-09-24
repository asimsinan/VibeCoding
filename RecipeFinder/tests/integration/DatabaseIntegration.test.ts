/**
 * Integration tests for database operations
 * Traces to FR-002, FR-004, FR-007
 * TDD Phase: Integration Tests (RED phase - should fail)
 */

import { SQLiteDatabase } from '../../src/lib/database/SQLiteDatabase';
import { Recipe } from '../../src/lib/entities/Recipe';
import { Ingredient } from '../../src/lib/entities/Ingredient';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Integration Tests', () => {
  let database: SQLiteDatabase;
  let sampleRecipes: Recipe[];
  let sampleIngredients: Ingredient[];

  beforeAll(async () => {
    // Load sample data
    const recipesPath = path.join(__dirname, '../../data/sample-recipes.json');
    const ingredientsPath = path.join(__dirname, '../../data/sample-ingredients.json');
    
    sampleRecipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
    sampleIngredients = JSON.parse(fs.readFileSync(ingredientsPath, 'utf8'));
  });

  beforeEach(async () => {
    database = new SQLiteDatabase(':memory:');
    await database.initialize();
  });

  afterEach(async () => {
    await database.close();
  });

  describe('Recipe operations', () => {
    test('should insert and retrieve recipes', async () => {
      // Insert sample recipes
      for (const recipe of sampleRecipes) {
        await database.insertRecipe(recipe);
      }

      // Retrieve all recipes
      const retrievedRecipes = await database.getAllRecipes();
      
      expect(retrievedRecipes).toHaveLength(sampleRecipes.length);
      expect(retrievedRecipes[0]?.title).toBe('Chicken Stir Fry');
    });

    test('should find recipe by ID', async () => {
      // Insert sample recipes
      for (const recipe of sampleRecipes) {
        await database.insertRecipe(recipe);
      }

      // Find specific recipe
      const recipe = await database.getRecipeById('recipe-1');
      
      expect(recipe).not.toBeNull();
      expect(recipe?.title).toBe('Chicken Stir Fry');
      expect(recipe?.ingredients).toContain('chicken breast');
    });

    test('should return null for non-existent recipe ID', async () => {
      const recipe = await database.getRecipeById('non-existent');
      
      expect(recipe).toBeNull();
    });

    test('should search recipes by ingredients', async () => {
      // Insert sample recipes
      for (const recipe of sampleRecipes) {
        await database.insertRecipe(recipe);
      }

      // Search for chicken recipes
      const chickenRecipes = await database.searchRecipesByIngredients(['chicken']);
      
      expect(chickenRecipes.length).toBeGreaterThan(0);
      expect(chickenRecipes.every(recipe => 
        recipe.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes('chicken')
        )
      )).toBe(true);
    });

    test('should handle empty ingredient search', async () => {
      // Insert sample recipes
      for (const recipe of sampleRecipes) {
        await database.insertRecipe(recipe);
      }

      // Search with empty ingredients
      const recipes = await database.searchRecipesByIngredients([]);
      
      expect(recipes).toHaveLength(0);
    });
  });

  describe('Ingredient operations', () => {
    test('should insert and retrieve ingredients', async () => {
      // Insert sample ingredients
      for (const ingredient of sampleIngredients) {
        await database.insertIngredient(ingredient);
      }

      // Retrieve all ingredients
      const retrievedIngredients = await database.getAllIngredients();
      
      expect(retrievedIngredients).toHaveLength(sampleIngredients.length);
      expect(retrievedIngredients[0]?.name).toBe('chicken breast');
    });

    test('should find ingredient by name', async () => {
      // Insert sample ingredients
      for (const ingredient of sampleIngredients) {
        await database.insertIngredient(ingredient);
      }

      // Find specific ingredient
      const ingredient = await database.getIngredientByName('chicken breast');
      
      expect(ingredient).not.toBeNull();
      expect(ingredient?.category).toBe('protein');
      expect(ingredient?.variations).toContain('chicken');
    });

    test('should return null for non-existent ingredient', async () => {
      const ingredient = await database.getIngredientByName('non-existent');
      
      expect(ingredient).toBeNull();
    });

    test('should search ingredients by query', async () => {
      // Insert sample ingredients
      for (const ingredient of sampleIngredients) {
        await database.insertIngredient(ingredient);
      }

      // Search for chicken-related ingredients
      const chickenIngredients = await database.searchIngredients('chicken');
      
      expect(chickenIngredients.length).toBeGreaterThan(0);
      expect(chickenIngredients.every(ingredient => 
        ingredient.name.toLowerCase().includes('chicken') ||
        ingredient.normalizedName.toLowerCase().includes('chicken')
      )).toBe(true);
    });

    test('should handle empty search query', async () => {
      // Insert sample ingredients
      for (const ingredient of sampleIngredients) {
        await database.insertIngredient(ingredient);
      }

      // Search with empty query
      const ingredients = await database.searchIngredients('');
      
      expect(ingredients).toHaveLength(sampleIngredients.length);
    });
  });

  describe('Data management', () => {
    test('should clear all data', async () => {
      // Insert sample data
      for (const recipe of sampleRecipes) {
        await database.insertRecipe(recipe);
      }
      for (const ingredient of sampleIngredients) {
        await database.insertIngredient(ingredient);
      }

      // Verify data exists
      expect(await database.getAllRecipes()).toHaveLength(sampleRecipes.length);
      expect(await database.getAllIngredients()).toHaveLength(sampleIngredients.length);

      // Clear all data
      await database.clearAllData();

      // Verify data is cleared
      expect(await database.getAllRecipes()).toHaveLength(0);
      expect(await database.getAllIngredients()).toHaveLength(0);
    });

    test('should handle duplicate recipe insertion', async () => {
      const recipe = sampleRecipes[0];
      if (!recipe) throw new Error('No sample recipes available');
      
      // Insert recipe first time
      await database.insertRecipe(recipe);
      
      // Try to insert same recipe again (should fail)
      await expect(database.insertRecipe(recipe)).rejects.toThrow();
    });

    test('should handle duplicate ingredient insertion', async () => {
      const ingredient = sampleIngredients[0];
      if (!ingredient) throw new Error('No sample ingredients available');
      
      // Insert ingredient first time
      await database.insertIngredient(ingredient);
      
      // Try to insert same ingredient again (should fail)
      await expect(database.insertIngredient(ingredient)).rejects.toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle malformed recipe data', async () => {
      const malformedRecipe = {
        id: 'malformed',
        title: 'Malformed Recipe',
        description: 'This recipe has invalid data',
        cookingTime: -10, // Invalid negative cooking time
        difficulty: 'invalid' as any, // Invalid difficulty
        ingredients: 'not an array' as any, // Invalid ingredients format
        instructions: 'not an array' as any // Invalid instructions format
      } as Recipe;

      // Should handle gracefully or throw appropriate error
      await expect(database.insertRecipe(malformedRecipe)).rejects.toThrow();
    });

    test('should handle malformed ingredient data', async () => {
      const malformedIngredient = {
        name: '', // Empty name
        normalizedName: '',
        category: '',
        variations: 'not an array' as any, // Invalid variations format
        synonyms: 'not an array' as any // Invalid synonyms format
      } as Ingredient;

      // Should handle gracefully or throw appropriate error
      await expect(database.insertIngredient(malformedIngredient)).rejects.toThrow();
    });

    test('should handle database operations without initialization', async () => {
      const uninitializedDb = new SQLiteDatabase(':memory:');
      
      // Should throw error for operations without initialization
      await expect(uninitializedDb.getAllRecipes()).rejects.toThrow('Database not initialized');
      await expect(uninitializedDb.getAllIngredients()).rejects.toThrow('Database not initialized');
    });
  });
});
