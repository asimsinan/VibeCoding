/**
 * Unit tests for ingredient normalization functions
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 * TDD Phase: Unit Tests (RED phase - should fail)
 */

import { IngredientNormalizer } from '../../src/lib/algorithms/IngredientNormalizer';
import { IngredientNormalizerImpl } from '../../src/lib/algorithms/IngredientNormalizerImpl';

describe('Ingredient Normalization Unit Tests', () => {
  let normalizer: IngredientNormalizer;

  beforeEach(() => {
    normalizer = new IngredientNormalizerImpl();
  });

  describe('Basic normalization', () => {
    test('should convert to lowercase', () => {
      expect(normalizer.normalize('CHICKEN BREAST')).toBe('chicken breast');
      expect(normalizer.normalize('Tomato')).toBe('tomato');
      expect(normalizer.normalize('ONION')).toBe('onion');
    });

    test('should trim whitespace', () => {
      expect(normalizer.normalize('  chicken breast  ')).toBe('chicken breast');
      expect(normalizer.normalize('\ttomato\n')).toBe('tomato');
      expect(normalizer.normalize('  olive oil  ')).toBe('olive oil');
    });

    test('should handle empty strings', () => {
      expect(normalizer.normalize('')).toBe('');
      expect(normalizer.normalize('   ')).toBe('');
      expect(normalizer.normalize('\t\n')).toBe('');
    });
  });

  describe('Special character handling', () => {
    test('should remove parentheses and content', () => {
      expect(normalizer.normalize('Tomato (fresh)')).toBe('tomato');
      expect(normalizer.normalize('Chicken (boneless)')).toBe('chicken');
      expect(normalizer.normalize('Oil (extra virgin)')).toBe('oil');
    });

    test('should handle commas', () => {
      expect(normalizer.normalize('Garlic, minced')).toBe('garlic minced');
      expect(normalizer.normalize('Onion, diced')).toBe('onion diced');
      expect(normalizer.normalize('Salt, pepper')).toBe('salt pepper');
    });

    test('should handle ampersands', () => {
      expect(normalizer.normalize('Salt & Pepper')).toBe('salt pepper');
      expect(normalizer.normalize('Oil & Vinegar')).toBe('oil vinegar');
    });

    test('should handle multiple special characters', () => {
      expect(normalizer.normalize('Tomato (fresh), diced')).toBe('tomato diced');
      expect(normalizer.normalize('Chicken (boneless) & vegetables')).toBe('chicken vegetables');
    });
  });

  describe('Pluralization handling', () => {
    test('should normalize plurals to singular', () => {
      expect(normalizer.normalize('tomatoes')).toBe('tomato');
      expect(normalizer.normalize('onions')).toBe('onion');
      expect(normalizer.normalize('carrots')).toBe('carrot');
      expect(normalizer.normalize('potatoes')).toBe('potato');
    });

    test('should handle irregular plurals', () => {
      expect(normalizer.normalize('children')).toBe('child');
      expect(normalizer.normalize('people')).toBe('person');
    });

    test('should handle words ending in -ies', () => {
      expect(normalizer.normalize('cherries')).toBe('cherry');
      expect(normalizer.normalize('strawberries')).toBe('strawberry');
    });

    test('should handle words ending in -ves', () => {
      expect(normalizer.normalize('leaves')).toBe('leaf');
      expect(normalizer.normalize('knives')).toBe('knife');
    });
  });

  describe('Common ingredient variations', () => {
    test('should normalize common abbreviations', () => {
      expect(normalizer.normalize('tbsp')).toBe('tablespoon');
      expect(normalizer.normalize('tsp')).toBe('teaspoon');
      expect(normalizer.normalize('oz')).toBe('ounce');
      expect(normalizer.normalize('lb')).toBe('pound');
    });

    test('should normalize common cooking terms', () => {
      expect(normalizer.normalize('minced garlic')).toBe('garlic');
      expect(normalizer.normalize('diced onion')).toBe('onion');
      expect(normalizer.normalize('chopped parsley')).toBe('parsley');
      expect(normalizer.normalize('fresh basil')).toBe('basil');
    });

    test('should normalize common descriptors', () => {
      expect(normalizer.normalize('extra virgin olive oil')).toBe('olive oil');
      expect(normalizer.normalize('boneless chicken breast')).toBe('chicken breast');
      expect(normalizer.normalize('ground beef')).toBe('beef');
    });
  });

  describe('Edge cases', () => {
    test('should handle very long ingredient names', () => {
      const longName = 'extra virgin cold pressed organic olive oil from italy';
      const normalized = normalizer.normalize(longName);
      expect(normalized).toBe('olive oil');
    });

    test('should handle numbers in ingredient names', () => {
      expect(normalizer.normalize('2% milk')).toBe('milk');
      expect(normalizer.normalize('whole wheat flour')).toBe('flour');
    });

    test('should handle mixed case and special characters', () => {
      expect(normalizer.normalize('ChIcKeN BrEaSt (BoNeLeSs)')).toBe('chicken breast');
      expect(normalizer.normalize('ToMaToEs, FrEsH')).toBe('tomato');
    });

    test('should handle non-English characters', () => {
      expect(normalizer.normalize('café')).toBe('cafe');
      expect(normalizer.normalize('naïve')).toBe('naive');
    });
  });

  describe('Performance', () => {
    test('should normalize ingredients quickly', () => {
      const ingredients = [
        'Chicken Breast (Boneless)',
        'Tomatoes, Fresh',
        'Extra Virgin Olive Oil',
        'Garlic, Minced',
        'Onion, Diced'
      ];

      const startTime = Date.now();
      ingredients.forEach(ingredient => normalizer.normalize(ingredient));
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10); // Should be very fast
    });
  });
});

// Implementation now provided by IngredientNormalizerImpl
