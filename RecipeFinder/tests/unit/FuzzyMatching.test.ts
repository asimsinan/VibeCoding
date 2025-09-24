/**
 * Unit tests for fuzzy matching algorithms
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 * TDD Phase: Unit Tests (RED phase - should fail)
 */

import { FuzzyMatcher } from '../../src/lib/algorithms/FuzzyMatcher';
import { Ingredient } from '../../src/lib/entities/Ingredient';
import { FuzzyMatcherImpl } from '../../src/lib/algorithms/FuzzyMatcherImpl';

describe('Fuzzy Matching Unit Tests', () => {
  let fuzzyMatcher: FuzzyMatcher;
  let sampleIngredients: Ingredient[];

  beforeEach(() => {
    fuzzyMatcher = new FuzzyMatcherImpl();

    // Sample ingredients for testing
    sampleIngredients = [
      {
        name: 'chicken breast',
        normalizedName: 'chicken breast',
        category: 'protein',
        variations: ['chicken', 'chicken breast meat'],
        synonyms: ['chicken fillet']
      },
      {
        name: 'tomato',
        normalizedName: 'tomato',
        category: 'vegetable',
        variations: ['tomatoes', 'cherry tomatoes'],
        synonyms: ['tomato fruit']
      },
      {
        name: 'onion',
        normalizedName: 'onion',
        category: 'vegetable',
        variations: ['onions', 'yellow onion'],
        synonyms: ['bulb onion']
      },
      {
        name: 'garlic',
        normalizedName: 'garlic',
        category: 'vegetable',
        variations: ['garlic cloves'],
        synonyms: ['garlic bulb']
      }
    ];
  });

  describe('Exact matching', () => {
    test('should find exact matches', () => {
      const matches = fuzzyMatcher.findMatches('chicken breast', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should find exact matches with case differences', () => {
      const matches = fuzzyMatcher.findMatches('CHICKEN BREAST', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should return empty array for no exact matches', () => {
      const matches = fuzzyMatcher.findMatches('beef', sampleIngredients);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Fuzzy matching with variations', () => {
    test('should find matches by variations', () => {
      const matches = fuzzyMatcher.findMatches('chicken', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should find matches by plural variations', () => {
      const matches = fuzzyMatcher.findMatches('tomatoes', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should find matches by descriptive variations', () => {
      const matches = fuzzyMatcher.findMatches('yellow onion', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('onion');
    });
  });

  describe('Fuzzy matching with synonyms', () => {
    test('should find matches by synonyms', () => {
      const matches = fuzzyMatcher.findMatches('chicken fillet', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should find matches by alternative names', () => {
      const matches = fuzzyMatcher.findMatches('tomato fruit', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should find matches by scientific names', () => {
      const matches = fuzzyMatcher.findMatches('bulb onion', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('onion');
    });
  });

  describe('Partial matching', () => {
    test('should find partial matches', () => {
      const matches = fuzzyMatcher.findMatches('chick', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should find matches with typos', () => {
      const matches = fuzzyMatcher.findMatches('tomatos', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('tomato');
    });

    test('should find matches with missing letters', () => {
      const matches = fuzzyMatcher.findMatches('chiken', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });
  });

  describe('Scoring and ranking', () => {
    test('should return matches with scores', () => {
      const matches = fuzzyMatcher.findMatches('chicken', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.matchScore).toBeDefined();
      expect(matches[0]?.matchScore).toBeGreaterThan(0);
      expect(matches[0]?.matchScore).toBeLessThanOrEqual(1);
    });

    test('should rank exact matches higher than fuzzy matches', () => {
      const exactMatches = fuzzyMatcher.findMatches('chicken breast', sampleIngredients);
      const fuzzyMatches = fuzzyMatcher.findMatches('chicken', sampleIngredients);
      
      expect(exactMatches[0]?.matchScore).toBeGreaterThan(fuzzyMatches[0]?.matchScore || 0);
    });

    test('should rank variation matches higher than synonym matches', () => {
      const variationMatches = fuzzyMatcher.findMatches('chicken', sampleIngredients);
      const synonymMatches = fuzzyMatcher.findMatches('chicken fillet', sampleIngredients);
      
      expect(variationMatches[0]?.matchScore).toBeGreaterThan(synonymMatches[0]?.matchScore || 0);
    });
  });

  describe('Multiple matches', () => {
    test('should return multiple matches when appropriate', () => {
      const extendedIngredients = [
        ...sampleIngredients,
        {
          name: 'chicken thigh',
          normalizedName: 'chicken thigh',
          category: 'protein',
          variations: ['chicken'],
          synonyms: []
        }
      ];

      const matches = fuzzyMatcher.findMatches('chicken', extendedIngredients);
      
      expect(matches).toHaveLength(2);
      expect(matches.map(m => m.name)).toContain('chicken breast');
      expect(matches.map(m => m.name)).toContain('chicken thigh');
    });

    test('should rank multiple matches by score', () => {
      const extendedIngredients = [
        ...sampleIngredients,
        {
          name: 'chicken',
          normalizedName: 'chicken',
          category: 'protein',
          variations: [],
          synonyms: []
        }
      ];

      const matches = fuzzyMatcher.findMatches('chicken', extendedIngredients);
      
      expect(matches).toHaveLength(2);
      // Exact match should be first
      expect(matches[0]?.name).toBe('chicken');
      expect(matches[0]?.matchScore).toBeGreaterThan(matches[1]?.matchScore || 0);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty search query', () => {
      const matches = fuzzyMatcher.findMatches('', sampleIngredients);
      
      expect(matches).toHaveLength(0);
    });

    test('should handle empty ingredients array', () => {
      const matches = fuzzyMatcher.findMatches('chicken', []);
      
      expect(matches).toHaveLength(0);
    });

    test('should handle very short search queries', () => {
      const matches = fuzzyMatcher.findMatches('c', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should handle very long search queries', () => {
      const longQuery = 'chicken breast meat boneless skinless';
      const matches = fuzzyMatcher.findMatches(longQuery, sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });

    test('should handle special characters in search', () => {
      const matches = fuzzyMatcher.findMatches('chicken-breast', sampleIngredients);
      
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe('chicken breast');
    });
  });

  describe('Performance', () => {
    test('should perform fuzzy matching quickly', () => {
      const queries = ['chicken', 'tomato', 'onion', 'garlic', 'beef'];
      
      const startTime = Date.now();
      queries.forEach(query => fuzzyMatcher.findMatches(query, sampleIngredients));
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(50); // Should be very fast
    });

    test('should handle large ingredient lists efficiently', () => {
      const largeIngredientList = Array(1000).fill(null).map((_, i) => ({
        name: `ingredient-${i}`,
        normalizedName: `ingredient-${i}`,
        category: 'test',
        variations: [],
        synonyms: []
      }));

      const startTime = Date.now();
      fuzzyMatcher.findMatches('ingredient-500', largeIngredientList);
      const endTime = Date.now();

      const searchTime = endTime - startTime;
      expect(searchTime).toBeLessThan(100); // Should still be fast with large lists
    });
  });
});

// Implementation now provided by FuzzyMatcherImpl
