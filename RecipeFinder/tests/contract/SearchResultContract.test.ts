/**
 * Contract tests for SearchResult entity
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-005: System MUST display search results in a user-friendly format
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { SearchResult, SearchResultContract, SearchResultValidationResult } from '../../src/lib/entities/SearchResult';
import { Recipe } from '../../src/lib/entities/Recipe';
import { SearchResultImpl } from '../../src/lib/entities/SearchResultImpl';

describe('SearchResult Contract Tests', () => {
  let searchResultContract: SearchResultContract;

  beforeEach(() => {
    searchResultContract = new SearchResultImpl();
  });

  describe('SearchResult validation', () => {
    test('should validate a complete search result', () => {
      const recipes: Recipe[] = [
        {
          id: 'recipe-1',
          title: 'Chicken Stir Fry',
          description: 'A delicious chicken stir fry',
          cookingTime: 30,
          difficulty: 'easy',
          ingredients: ['chicken', 'vegetables'],
          instructions: ['Cut chicken', 'Stir fry']
        }
      ];

      const result: SearchResult = {
        recipes,
        totalCount: 1,
        hasMore: false
      };

      const validation: SearchResultValidationResult = searchResultContract.validate(result);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject result with negative totalCount', () => {
      const recipes: Recipe[] = [];
      const result: SearchResult = {
        recipes,
        totalCount: -1,
        hasMore: false
      };

      const validation: SearchResultValidationResult = searchResultContract.validate(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total count must be non-negative');
    });

    test('should reject result with inconsistent hasMore flag', () => {
      const recipes: Recipe[] = [
        {
          id: 'recipe-1',
          title: 'Chicken Stir Fry',
          description: 'A delicious chicken stir fry',
          cookingTime: 30,
          difficulty: 'easy',
          ingredients: ['chicken', 'vegetables'],
          instructions: ['Cut chicken', 'Stir fry']
        }
      ];

      const result: SearchResult = {
        recipes,
        totalCount: 1,
        hasMore: true // Inconsistent - should be false when totalCount equals recipes length
      };

      const validation: SearchResultValidationResult = searchResultContract.validate(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('HasMore flag is inconsistent with total count');
    });
  });

  describe('SearchResult creation', () => {
    test('should create search result', () => {
      const recipes: Recipe[] = [
        {
          id: 'recipe-1',
          title: 'Chicken Stir Fry',
          description: 'A delicious chicken stir fry',
          cookingTime: 30,
          difficulty: 'easy',
          ingredients: ['chicken', 'vegetables'],
          instructions: ['Cut chicken', 'Stir fry']
        }
      ];

      const result: SearchResult = searchResultContract.create(recipes, 1, false);

      expect(result.recipes).toEqual(recipes);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    test('should create empty search result', () => {
      const result: SearchResult = searchResultContract.create([], 0, false);

      expect(result.recipes).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Result sorting by relevance', () => {
    test('should sort recipes by match score', () => {
      const recipes: Recipe[] = [
        {
          id: 'recipe-1',
          title: 'Chicken Stir Fry',
          description: 'A delicious chicken stir fry',
          cookingTime: 30,
          difficulty: 'easy',
          ingredients: ['chicken', 'vegetables'],
          instructions: ['Cut chicken', 'Stir fry'],
          matchScore: 0.7
        },
        {
          id: 'recipe-2',
          title: 'Beef Stir Fry',
          description: 'A delicious beef stir fry',
          cookingTime: 25,
          difficulty: 'medium',
          ingredients: ['beef', 'vegetables'],
          instructions: ['Cut beef', 'Stir fry'],
          matchScore: 0.9
        }
      ];

      const result: SearchResult = {
        recipes,
        totalCount: 2,
        hasMore: false
      };

      const sortedResult: SearchResult = searchResultContract.sortByRelevance(result);

      expect(sortedResult.recipes[0]?.id).toBe('recipe-2'); // Higher match score
      expect(sortedResult.recipes[1]?.id).toBe('recipe-1'); // Lower match score
    });

    test('should handle recipes without match scores', () => {
      const recipes: Recipe[] = [
        {
          id: 'recipe-1',
          title: 'Chicken Stir Fry',
          description: 'A delicious chicken stir fry',
          cookingTime: 30,
          difficulty: 'easy',
          ingredients: ['chicken', 'vegetables'],
          instructions: ['Cut chicken', 'Stir fry']
          // No matchScore
        },
        {
          id: 'recipe-2',
          title: 'Beef Stir Fry',
          description: 'A delicious beef stir fry',
          cookingTime: 25,
          difficulty: 'medium',
          ingredients: ['beef', 'vegetables'],
          instructions: ['Cut beef', 'Stir fry'],
          matchScore: 0.9
        }
      ];

      const result: SearchResult = {
        recipes,
        totalCount: 2,
        hasMore: false
      };

      const sortedResult: SearchResult = searchResultContract.sortByRelevance(result);

      expect(sortedResult.recipes[0]?.id).toBe('recipe-2'); // Has match score
      expect(sortedResult.recipes[1]?.id).toBe('recipe-1'); // No match score
    });
  });
});

// Implementation now provided by SearchResultImpl
