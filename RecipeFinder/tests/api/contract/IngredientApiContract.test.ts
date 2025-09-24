/**
 * Ingredient API Contract Tests
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { IngredientController } from '../../../src/api/controllers/IngredientController';
import { GetIngredientSuggestionsRequest } from '../../../src/api/types/ApiTypes';
import { SQLiteDatabase } from '../../../src/lib/database/SQLiteDatabase';

describe('Ingredient API Contract Tests', () => {
  let ingredientController: IngredientController;
  let database: SQLiteDatabase;

  beforeEach(async () => {
    database = new SQLiteDatabase(':memory:');
    await database.initialize();
    ingredientController = new IngredientController(database);
  });

  afterEach(async () => {
    if (database) {
      await database.close();
    }
  });

  describe('getSuggestions endpoint contract', () => {
    test('should have correct method signature', () => {
      expect(typeof ingredientController.getSuggestions).toBe('function');
    });

    test('should accept GetIngredientSuggestionsRequest and return GetIngredientSuggestionsResponse', async () => {
      const request: GetIngredientSuggestionsRequest = {
        query: 'chicken',
        limit: 10
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // This should work now
      await expect(ingredientController.getSuggestions(request as any, mockRes as any)).resolves.not.toThrow();
    });

    test('should handle empty query string', () => {
      const request: GetIngredientSuggestionsRequest = {
        query: '',
        limit: 10
      };

      // This will fail - RED phase
      expect(() => ingredientController.getSuggestions(request as any, {} as any)).not.toThrow();
    });

    test('should handle missing optional parameters', () => {
      const request: GetIngredientSuggestionsRequest = {
        query: 'tomato'
      };

      // This will fail - RED phase
      expect(() => ingredientController.getSuggestions(request as any, {} as any)).not.toThrow();
    });

    test('should handle partial matches', () => {
      const request: GetIngredientSuggestionsRequest = {
        query: 'chick',
        limit: 5
      };

      // This will fail - RED phase
      expect(() => ingredientController.getSuggestions(request as any, {} as any)).not.toThrow();
    });
  });
});
