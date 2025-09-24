/**
 * End-to-end tests for complete recipe search workflow
 * Traces to FR-002, FR-005, FR-006
 * TDD Phase: E2E Tests (RED phase - should fail)
 */

import { SQLiteDatabase } from '../../src/lib/database/SQLiteDatabase';
import { RecipeSearchEngine } from '../../src/lib/algorithms/RecipeSearchEngine';
import { RecipeSearchEngineImpl } from '../../src/lib/algorithms/RecipeSearchEngineImpl';
import { IngredientNormalizerImpl } from '../../src/lib/algorithms/IngredientNormalizerImpl';
import { FuzzyMatcherImpl } from '../../src/lib/algorithms/FuzzyMatcherImpl';
import { RecipeScorerImpl } from '../../src/lib/algorithms/RecipeScorerImpl';
import { SearchQuery } from '../../src/lib/entities/SearchQuery';
import { SearchResult } from '../../src/lib/entities/SearchResult';
import { Recipe } from '../../src/lib/entities/Recipe';
import { Ingredient } from '../../src/lib/entities/Ingredient';
import * as fs from 'fs';
import * as path from 'path';

describe('Recipe Search Workflow E2E Tests', () => {
  let database: SQLiteDatabase;
  let searchEngine: RecipeSearchEngine;
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
    // Initialize database
    database = new SQLiteDatabase(':memory:');
    await database.initialize();

    // Insert sample data
    for (const recipe of sampleRecipes) {
      await database.insertRecipe(recipe);
    }
    for (const ingredient of sampleIngredients) {
      await database.insertIngredient(ingredient);
    }

    // Initialize search engine with all dependencies
    const normalizer = new IngredientNormalizerImpl();
    const fuzzyMatcher = new FuzzyMatcherImpl();
    const scorer = new RecipeScorerImpl();
    searchEngine = new RecipeSearchEngineImpl(database, normalizer, fuzzyMatcher, scorer);
  });

  afterEach(async () => {
    await database.close();
  });

  describe('Complete recipe search workflow', () => {
    test('should find recipes with exact ingredient matches', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken breast', 'bell peppers'],
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.hasMore).toBe(false);
      
      // Verify all returned recipes contain at least one search ingredient
      result.recipes.forEach(recipe => {
        const hasMatchingIngredient = recipe.ingredients.some(ingredient =>
          query.ingredients.some(searchIngredient =>
            ingredient.toLowerCase().includes(searchIngredient.toLowerCase())
          )
        );
        expect(hasMatchingIngredient).toBe(true);
      });
    });

    test('should find recipes with fuzzy ingredient matches', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken', 'peppers'], // Partial matches
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      
      // Verify fuzzy matching works
      const chickenRecipe = result.recipes.find(recipe => 
        recipe.title.toLowerCase().includes('chicken')
      );
      expect(chickenRecipe).toBeDefined();
    });

    test('should rank recipes by relevance score', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken', 'vegetables'],
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes.length).toBeGreaterThan(0);
      
      // Verify recipes are ranked by match score (highest first)
      for (let i = 1; i < result.recipes.length; i++) {
        const currentScore = result.recipes[i]?.matchScore || 0;
        const previousScore = result.recipes[i - 1]?.matchScore || 0;
        expect(currentScore).toBeLessThanOrEqual(previousScore);
      }
    });

    test('should handle pagination correctly', async () => {
      const query: SearchQuery = {
        ingredients: ['vegetables'],
        limit: 2,
        offset: 0
      };

      const firstPage: SearchResult = await searchEngine.searchRecipes(query);
      expect(firstPage.recipes).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);

      const secondPageQuery: SearchQuery = {
        ingredients: ['vegetables'],
        limit: 2,
        offset: 2
      };

      const secondPage: SearchResult = await searchEngine.searchRecipes(secondPageQuery);
      expect(secondPage.recipes.length).toBeGreaterThan(0);
      expect(secondPage.hasMore).toBe(false);
    });

    test('should return empty results for non-matching ingredients', async () => {
      const query: SearchQuery = {
        ingredients: ['unicorn meat', 'dragon scales'],
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    test('should handle empty search query gracefully', async () => {
      const query: SearchQuery = {
        ingredients: [],
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Search result quality and relevance', () => {
    test('should return recipes with high relevance scores', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken breast', 'bell peppers', 'onion'],
        limit: 5,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes.length).toBeGreaterThan(0);
      
      // Verify match scores are calculated
      result.recipes.forEach(recipe => {
        expect(recipe.matchScore).toBeDefined();
        expect(recipe.matchScore).toBeGreaterThanOrEqual(0);
        expect(recipe.matchScore).toBeLessThanOrEqual(1);
      });
    });

    test('should prioritize recipes with more matching ingredients', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken', 'vegetables', 'soy sauce'],
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      expect(result.recipes.length).toBeGreaterThan(0);
      
      // The first recipe should have the highest match score
      const topRecipe = result.recipes[0];
      expect(topRecipe?.matchScore).toBeGreaterThan(0);
      
      // Verify it contains multiple search ingredients
      const matchingIngredients = topRecipe?.ingredients.filter(ingredient =>
        query.ingredients.some(searchIngredient =>
          ingredient.toLowerCase().includes(searchIngredient.toLowerCase())
        )
      ) || [];
      
      expect(matchingIngredients.length).toBeGreaterThan(1);
    });
  });

  describe('Performance with large datasets', () => {
    test('should complete search within performance threshold', async () => {
      const query: SearchQuery = {
        ingredients: ['chicken', 'vegetables'],
        limit: 20,
        offset: 0
      };

      const startTime = Date.now();
      const result: SearchResult = await searchEngine.searchRecipes(query);
      const endTime = Date.now();

      const searchTime = endTime - startTime;
      expect(searchTime).toBeLessThan(500); // <500ms requirement
      expect(result.recipes.length).toBeGreaterThan(0);
    });

    test('should handle concurrent search operations', async () => {
      const queries: SearchQuery[] = [
        { ingredients: ['chicken'], limit: 5, offset: 0 },
        { ingredients: ['vegetables'], limit: 5, offset: 0 },
        { ingredients: ['cheese'], limit: 5, offset: 0 }
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        queries.map(query => searchEngine.searchRecipes(query))
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // <1s for concurrent operations
      
      results.forEach(result => {
        expect(result.recipes.length).toBeGreaterThanOrEqual(0);
        expect(result.totalCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Error handling for invalid inputs', () => {
    test('should handle invalid search query parameters', async () => {
      const invalidQuery: SearchQuery = {
        ingredients: ['chicken'],
        limit: -1, // Invalid limit
        offset: -1  // Invalid offset
      };

      await expect(searchEngine.searchRecipes(invalidQuery)).rejects.toThrow();
    });

    test('should handle malformed ingredient names', async () => {
      const query: SearchQuery = {
        ingredients: ['', '   ', 'chicken'], // Empty and whitespace ingredients
        limit: 10,
        offset: 0
      };

      const result: SearchResult = await searchEngine.searchRecipes(query);

      // Should filter out empty ingredients and still return results
      expect(result.recipes.length).toBeGreaterThan(0);
    });

    test('should handle very long ingredient lists', async () => {
      const longIngredientList = Array(100).fill('chicken');
      const query: SearchQuery = {
        ingredients: longIngredientList,
        limit: 10,
        offset: 0
      };

      const startTime = Date.now();
      const result: SearchResult = await searchEngine.searchRecipes(query);
      const endTime = Date.now();

      const searchTime = endTime - startTime;
      expect(searchTime).toBeLessThan(1000); // Should still be fast
      expect(result.recipes.length).toBeGreaterThan(0);
    });
  });
});

// Implementation now provided by RecipeSearchEngineImpl
