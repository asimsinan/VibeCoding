/**
 * Contract tests for SearchQuery entity
 * Traces to FR-001: System MUST provide an ingredient input interface
 * Traces to FR-006: System MUST provide real-time search results
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { SearchQuery, SearchQueryContract, SearchQueryValidationResult } from '../../src/lib/entities/SearchQuery';
import { SearchQueryImpl } from '../../src/lib/entities/SearchQueryImpl';

describe('SearchQuery Contract Tests', () => {
  let searchQueryContract: SearchQueryContract;

  beforeEach(() => {
    searchQueryContract = new SearchQueryImpl();
  });

  describe('SearchQuery validation', () => {
    test('should validate a complete search query', () => {
      const query: SearchQuery = {
        ingredients: ['chicken', 'tomato', 'onion'],
        limit: 20,
        offset: 0
      };

      const result: SearchQueryValidationResult = searchQueryContract.validate(query);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject query with empty ingredients', () => {
      const query: SearchQuery = {
        ingredients: [],
        limit: 20,
        offset: 0
      };

      const result: SearchQueryValidationResult = searchQueryContract.validate(query);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one ingredient is required');
    });

    test('should reject query with invalid limit', () => {
      const query: SearchQuery = {
        ingredients: ['chicken'],
        limit: 0,
        offset: 0
      };

      const result: SearchQueryValidationResult = searchQueryContract.validate(query);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });

    test('should reject query with negative offset', () => {
      const query: SearchQuery = {
        ingredients: ['chicken'],
        limit: 20,
        offset: -1
      };

      const result: SearchQueryValidationResult = searchQueryContract.validate(query);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Offset must be non-negative');
    });

    test('should reject query with limit exceeding maximum', () => {
      const query: SearchQuery = {
        ingredients: ['chicken'],
        limit: 101,
        offset: 0
      };

      const result: SearchQueryValidationResult = searchQueryContract.validate(query);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });
  });

  describe('SearchQuery creation', () => {
    test('should create query with default values', () => {
      const query: SearchQuery = searchQueryContract.create(['chicken', 'tomato']);

      expect(query.ingredients).toEqual(['chicken', 'tomato']);
      expect(query.limit).toBe(20);
      expect(query.offset).toBe(0);
    });

    test('should create query with custom values', () => {
      const query: SearchQuery = searchQueryContract.create(
        ['chicken', 'tomato', 'onion'],
        10,
        5
      );

      expect(query.ingredients).toEqual(['chicken', 'tomato', 'onion']);
      expect(query.limit).toBe(10);
      expect(query.offset).toBe(5);
    });
  });

  describe('Ingredient sanitization', () => {
    test('should sanitize ingredient names', () => {
      const ingredients: string[] = ['  Chicken  ', 'Tomato (fresh)', 'Onion, diced'];
      const sanitized: string[] = searchQueryContract.sanitizeIngredients(ingredients);

      expect(sanitized).toEqual(['chicken', 'tomato fresh', 'onion diced']);
    });

    test('should remove empty ingredients', () => {
      const ingredients: string[] = ['chicken', '', 'tomato', '   '];
      const sanitized: string[] = searchQueryContract.sanitizeIngredients(ingredients);

      expect(sanitized).toEqual(['chicken', 'tomato']);
    });

    test('should handle special characters', () => {
      const ingredients: string[] = ['Salt & Pepper', 'Olive Oil (extra virgin)', 'Garlic, minced'];
      const sanitized: string[] = searchQueryContract.sanitizeIngredients(ingredients);

      expect(sanitized).toEqual(['salt pepper', 'olive oil extra virgin', 'garlic minced']);
    });
  });
});

// Implementation now provided by SearchQueryImpl
