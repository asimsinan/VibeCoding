/**
 * Contract tests for Recipe entity
 * Traces to FR-002, FR-003
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { Recipe, RecipeContract, RecipeValidationResult } from '../../src/lib/entities/Recipe';
import { RecipeImpl } from '../../src/lib/entities/RecipeImpl';

describe('Recipe Contract Tests', () => {
  let recipeContract: RecipeContract;

  beforeEach(() => {
    recipeContract = new RecipeImpl();
  });

  describe('Recipe validation', () => {
    test('should validate a complete recipe', () => {
      const recipe: Recipe = {
        id: 'recipe-1',
        title: 'Chicken Stir Fry',
        description: 'A delicious chicken stir fry',
        cookingTime: 30,
        difficulty: 'easy',
        ingredients: ['chicken', 'vegetables', 'soy sauce'],
        instructions: ['Cut chicken', 'Stir fry vegetables', 'Add sauce']
      };

      const result: RecipeValidationResult = recipeContract.validate(recipe);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject recipe with missing required fields', () => {
      const invalidRecipe = {
        id: 'recipe-1',
        title: 'Chicken Stir Fry',
        // Missing required fields
      } as Recipe;

      const result: RecipeValidationResult = recipeContract.validate(invalidRecipe);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject recipe with invalid difficulty', () => {
      const recipe: Recipe = {
        id: 'recipe-1',
        title: 'Chicken Stir Fry',
        description: 'A delicious chicken stir fry',
        cookingTime: 30,
        difficulty: 'invalid' as any,
        ingredients: ['chicken', 'vegetables'],
        instructions: ['Cut chicken', 'Stir fry']
      };

      const result: RecipeValidationResult = recipeContract.validate(recipe);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid difficulty level');
    });

    test('should reject recipe with negative cooking time', () => {
      const recipe: Recipe = {
        id: 'recipe-1',
        title: 'Chicken Stir Fry',
        description: 'A delicious chicken stir fry',
        cookingTime: -10,
        difficulty: 'easy',
        ingredients: ['chicken', 'vegetables'],
        instructions: ['Cut chicken', 'Stir fry']
      };

      const result: RecipeValidationResult = recipeContract.validate(recipe);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cooking time must be positive');
    });
  });

  describe('Recipe creation', () => {
    test('should create a valid recipe', () => {
      const recipe: Recipe = recipeContract.create(
        'recipe-1',
        'Chicken Stir Fry',
        'A delicious chicken stir fry',
        30,
        'easy',
        ['chicken', 'vegetables', 'soy sauce'],
        ['Cut chicken', 'Stir fry vegetables', 'Add sauce'],
        'chicken-stir-fry.jpg'
      );

      expect(recipe.id).toBe('recipe-1');
      expect(recipe.title).toBe('Chicken Stir Fry');
      expect(recipe.cookingTime).toBe(30);
      expect(recipe.difficulty).toBe('easy');
      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.instructions).toHaveLength(3);
      expect(recipe.image).toBe('chicken-stir-fry.jpg');
    });

    test('should create recipe without optional image', () => {
      const recipe: Recipe = recipeContract.create(
        'recipe-1',
        'Chicken Stir Fry',
        'A delicious chicken stir fry',
        30,
        'easy',
        ['chicken', 'vegetables'],
        ['Cut chicken', 'Stir fry']
      );

      expect(recipe.id).toBe('recipe-1');
      expect(recipe.image).toBeUndefined();
    });
  });
});

// Implementation now provided by RecipeImpl
