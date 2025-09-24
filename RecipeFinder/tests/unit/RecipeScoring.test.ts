/**
 * Unit tests for recipe scoring calculations
 * Traces to FR-005: System MUST display search results in a user-friendly format
 * TDD Phase: Unit Tests (RED phase - should fail)
 */

import { RecipeScorer } from '../../src/lib/algorithms/RecipeScorer';
import { Recipe } from '../../src/lib/entities/Recipe';
import { RecipeScorerImpl } from '../../src/lib/algorithms/RecipeScorerImpl';

describe('Recipe Scoring Unit Tests', () => {
  let recipeScorer: RecipeScorer;
  let sampleRecipe: Recipe;

  beforeEach(() => {
    recipeScorer = new RecipeScorerImpl();

    sampleRecipe = {
      id: 'recipe-1',
      title: 'Chicken Stir Fry',
      description: 'A delicious chicken stir fry with vegetables',
      cookingTime: 30,
      difficulty: 'easy',
      ingredients: ['chicken breast', 'bell peppers', 'onion', 'garlic', 'soy sauce', 'vegetable oil'],
      instructions: ['Cut chicken', 'Stir fry vegetables', 'Add sauce']
    };
  });

  describe('Basic scoring', () => {
    test('should calculate score for exact ingredient matches', () => {
      const searchIngredients = ['chicken breast', 'bell peppers'];
      const score = recipeScorer.calculateScore(sampleRecipe, [...searchIngredients]);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should return 0 for no matching ingredients', () => {
      const searchIngredients = ['beef', 'pork'];
      const score = recipeScorer.calculateScore(sampleRecipe, [...searchIngredients]);
      
      expect(score).toBe(0);
    });

    test('should return 1 for perfect match', () => {
      const searchIngredients = sampleRecipe.ingredients;
      const score = recipeScorer.calculateScore(sampleRecipe, [...searchIngredients]);
      
      expect(score).toBe(1);
    });
  });

  describe('Partial matching scoring', () => {
    test('should score partial ingredient matches', () => {
      const searchIngredients = ['chicken', 'peppers']; // Partial matches
      const score = recipeScorer.calculateScore(sampleRecipe, [...searchIngredients]);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    test('should score higher for more matching ingredients', () => {
      const fewMatches = ['chicken'];
      const manyMatches = ['chicken', 'peppers', 'onion'];
      
      const fewScore = recipeScorer.calculateScore(sampleRecipe, fewMatches);
      const manyScore = recipeScorer.calculateScore(sampleRecipe, manyMatches);
      
      expect(manyScore).toBeGreaterThan(fewScore);
    });

    test('should score based on ingredient coverage ratio', () => {
      const searchIngredients = ['chicken breast', 'bell peppers', 'onion']; // 3 out of 6 ingredients
      const score = recipeScorer.calculateScore(sampleRecipe, [...searchIngredients]);
      
      expect(score).toBeCloseTo(0.5, 1); // Should be around 50%
    });
  });

  describe('Weighted scoring', () => {
    test('should weight main ingredients higher', () => {
      const mainIngredientSearch = ['chicken breast'];
      const secondaryIngredientSearch = ['soy sauce'];
      
      const mainScore = recipeScorer.calculateScore(sampleRecipe, mainIngredientSearch);
      const secondaryScore = recipeScorer.calculateScore(sampleRecipe, secondaryIngredientSearch);
      
      expect(mainScore).toBeGreaterThan(secondaryScore);
    });

    test('should weight protein ingredients higher', () => {
      const proteinSearch = ['chicken breast'];
      const vegetableSearch = ['bell peppers'];
      
      const proteinScore = recipeScorer.calculateScore(sampleRecipe, proteinSearch);
      const vegetableScore = recipeScorer.calculateScore(sampleRecipe, vegetableSearch);
      
      expect(proteinScore).toBeGreaterThan(vegetableScore);
    });

    test('should weight unique ingredients higher', () => {
      const uniqueSearch = ['soy sauce']; // Unique ingredient
      const commonSearch = ['onion']; // Common ingredient
      
      const uniqueScore = recipeScorer.calculateScore(sampleRecipe, uniqueSearch);
      const commonScore = recipeScorer.calculateScore(sampleRecipe, commonSearch);
      
      expect(uniqueScore).toBeGreaterThan(commonScore);
    });
  });

  describe('Recipe complexity scoring', () => {
    test('should consider cooking time in scoring', () => {
      const quickRecipe: Recipe = {
        ...sampleRecipe,
        cookingTime: 15
      };
      
      const slowRecipe: Recipe = {
        ...sampleRecipe,
        cookingTime: 60
      };

      const searchIngredients = ['chicken'];
      
      const quickScore = recipeScorer.calculateScore(quickRecipe, searchIngredients);
      const slowScore = recipeScorer.calculateScore(slowRecipe, searchIngredients);
      
      // Quick recipes should score higher for convenience
      expect(quickScore).toBeGreaterThan(slowScore);
    });

    test('should consider difficulty in scoring', () => {
      const easyRecipe: Recipe = {
        ...sampleRecipe,
        difficulty: 'easy'
      };
      
      const hardRecipe: Recipe = {
        ...sampleRecipe,
        difficulty: 'hard'
      };

      const searchIngredients = ['chicken'];
      
      const easyScore = recipeScorer.calculateScore(easyRecipe, searchIngredients);
      const hardScore = recipeScorer.calculateScore(hardRecipe, searchIngredients);
      
      // Easy recipes should score higher for accessibility
      expect(easyScore).toBeGreaterThan(hardScore);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty search ingredients', () => {
      const score = recipeScorer.calculateScore(sampleRecipe, []);
      
      expect(score).toBe(0);
    });

    test('should handle empty recipe ingredients', () => {
      const emptyRecipe: Recipe = {
        ...sampleRecipe,
        ingredients: []
      };
      
      const score = recipeScorer.calculateScore(emptyRecipe, ['chicken']);
      
      expect(score).toBe(0);
    });

    test('should handle duplicate search ingredients', () => {
      const duplicateSearch = ['chicken', 'chicken', 'chicken'];
      const singleSearch = ['chicken'];
      
      const duplicateScore = recipeScorer.calculateScore(sampleRecipe, duplicateSearch);
      const singleScore = recipeScorer.calculateScore(sampleRecipe, singleSearch);
      
      // Duplicates shouldn't inflate the score
      expect(duplicateScore).toBeLessThanOrEqual(singleScore);
    });

    test('should handle very long ingredient lists', () => {
      const longRecipe: Recipe = {
        ...sampleRecipe,
        ingredients: Array(100).fill('ingredient')
      };
      
      const searchIngredients = ['ingredient'];
      const score = recipeScorer.calculateScore(longRecipe, searchIngredients);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Scoring consistency', () => {
    test('should return consistent scores for same inputs', () => {
      const searchIngredients = ['chicken', 'peppers'];
      
      const score1 = recipeScorer.calculateScore(sampleRecipe, searchIngredients);
      const score2 = recipeScorer.calculateScore(sampleRecipe, searchIngredients);
      
      expect(score1).toBe(score2);
    });

    test('should handle case insensitive matching', () => {
      const lowercaseSearch = ['chicken breast'];
      const uppercaseSearch = ['CHICKEN BREAST'];
      
      const lowercaseScore = recipeScorer.calculateScore(sampleRecipe, lowercaseSearch);
      const uppercaseScore = recipeScorer.calculateScore(sampleRecipe, uppercaseSearch);
      
      expect(lowercaseScore).toBe(uppercaseScore);
    });

    test('should handle whitespace differences', () => {
      const normalSearch = ['chicken breast'];
      const spacedSearch = ['  chicken breast  '];
      
      const normalScore = recipeScorer.calculateScore(sampleRecipe, normalSearch);
      const spacedScore = recipeScorer.calculateScore(sampleRecipe, spacedSearch);
      
      expect(normalScore).toBe(spacedScore);
    });
  });

  describe('Performance', () => {
    test('should calculate scores quickly', () => {
      const searchIngredients = ['chicken', 'peppers', 'onion'];
      
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        recipeScorer.calculateScore(sampleRecipe, searchIngredients);
      }
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(100); // Should be very fast
    });

    test('should handle large ingredient lists efficiently', () => {
      const largeRecipe: Recipe = {
        ...sampleRecipe,
        ingredients: Array(1000).fill(null).map((_, i) => `ingredient-${i}`)
      };
      
      const searchIngredients = Array(100).fill(null).map((_, i) => `ingredient-${i * 10}`);
      
      const startTime = Date.now();
      recipeScorer.calculateScore(largeRecipe, searchIngredients);
      const endTime = Date.now();

      const scoreTime = endTime - startTime;
      expect(scoreTime).toBeLessThan(50); // Should still be fast
    });
  });
});

// Implementation now provided by RecipeScorerImpl
