/**
 * Contract tests for Ingredient entity
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { Ingredient, IngredientContract, IngredientValidationResult } from '../../src/lib/entities/Ingredient';
import { IngredientImpl } from '../../src/lib/entities/IngredientImpl';

describe('Ingredient Contract Tests', () => {
  let ingredientContract: IngredientContract;

  beforeEach(() => {
    ingredientContract = new IngredientImpl();
  });

  describe('Ingredient validation', () => {
    test('should validate a complete ingredient', () => {
      const ingredient: Ingredient = {
        name: 'tomato',
        normalizedName: 'tomato',
        category: 'vegetable',
        variations: ['tomatoes', 'cherry tomatoes'],
        synonyms: ['tomato fruit']
      };

      const result: IngredientValidationResult = ingredientContract.validate(ingredient);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject ingredient with missing required fields', () => {
      const invalidIngredient = {
        name: 'tomato',
        // Missing required fields
      } as Ingredient;

      const result: IngredientValidationResult = ingredientContract.validate(invalidIngredient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject ingredient with empty name', () => {
      const ingredient: Ingredient = {
        name: '',
        normalizedName: '',
        category: 'vegetable',
        variations: [],
        synonyms: []
      };

      const result: IngredientValidationResult = ingredientContract.validate(ingredient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name cannot be empty');
    });
  });

  describe('Ingredient normalization', () => {
    test('should normalize ingredient names', () => {
      expect(ingredientContract.normalize('Tomatoes')).toBe('tomato');
      expect(ingredientContract.normalize('CHICKEN BREAST')).toBe('chicken breast');
      expect(ingredientContract.normalize('  olive oil  ')).toBe('olive oil');
      expect(ingredientContract.normalize('Salt & Pepper')).toBe('salt pepper');
    });

    test('should handle special characters in normalization', () => {
      expect(ingredientContract.normalize('Tomato (fresh)')).toBe('tomato fresh');
      expect(ingredientContract.normalize('Garlic, minced')).toBe('garlic minced');
    });
  });

  describe('Ingredient creation', () => {
    test('should create a valid ingredient', () => {
      const ingredient: Ingredient = ingredientContract.create(
        'tomato',
        'vegetable',
        ['tomatoes', 'cherry tomatoes'],
        ['tomato fruit']
      );

      expect(ingredient.name).toBe('tomato');
      expect(ingredient.normalizedName).toBe('tomato');
      expect(ingredient.category).toBe('vegetable');
      expect(ingredient.variations).toHaveLength(2);
      expect(ingredient.synonyms).toHaveLength(1);
    });

    test('should create ingredient with empty variations and synonyms', () => {
      const ingredient: Ingredient = ingredientContract.create(
        'salt',
        'seasoning'
      );

      expect(ingredient.name).toBe('salt');
      expect(ingredient.variations).toHaveLength(0);
      expect(ingredient.synonyms).toHaveLength(0);
    });
  });

  describe('Fuzzy matching', () => {
    test('should find exact matches', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomato', normalizedName: 'tomato', category: 'vegetable', variations: [], synonyms: [] },
        { name: 'chicken', normalizedName: 'chicken', category: 'protein', variations: [], synonyms: [] }
      ];

      const matches: Ingredient[] = ingredientContract.findMatches('tomato', ingredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should find fuzzy matches', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomato', normalizedName: 'tomato', category: 'vegetable', variations: ['tomatoes'], synonyms: [] },
        { name: 'chicken', normalizedName: 'chicken', category: 'protein', variations: [], synonyms: [] }
      ];

      const matches: Ingredient[] = ingredientContract.findMatches('tomatoes', ingredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should find matches by synonyms', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomato', normalizedName: 'tomato', category: 'vegetable', variations: [], synonyms: ['tomato fruit'] },
        { name: 'chicken', normalizedName: 'chicken', category: 'protein', variations: [], synonyms: [] }
      ];

      const matches: Ingredient[] = ingredientContract.findMatches('tomato fruit', ingredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should return empty array for no matches', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomato', normalizedName: 'tomato', category: 'vegetable', variations: [], synonyms: [] }
      ];

      const matches: Ingredient[] = ingredientContract.findMatches('beef', ingredients);
      
      expect(matches).toHaveLength(0);
    });
  });
});

// Implementation now provided by IngredientImpl
