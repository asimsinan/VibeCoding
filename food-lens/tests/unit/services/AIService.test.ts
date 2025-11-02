/**
 * AIService Tests
 * Comprehensive tests for AI processing and external integrations
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { AIService } from '../../../src/lib/food-label-scanner/services/ai/AIService';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';

describe('AIService - External Integration', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Nutrition Data Processing', () => {
    it('should process image and extract nutrition data', async () => {
      expect(aiService).toBeDefined();
      
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = await aiService.processNutrition(imageData);

      expect(result.foodName).toBeDefined();
      expect(result.calories).toBeGreaterThan(0);
      expect(result.nutrients).toBeDefined();
    });

    it('should extract allergen information from processed data', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = await aiService.processAllergens(imageData);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].name).toBeDefined();
        expect(result[0].severity).toBeDefined();
      }
    });

    it('should handle invalid image format', async () => {
      const invalidImage = 'not-an-image';

      await expect(
        aiService.processNutrition(invalidImage)
      ).rejects.toThrow();
    });

    it('should retry on transient API failures', async () => {
      // Test retry logic for external API
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      
      // Mock the callAIWithRetry to simulate retries
      let callCount = 0;
      const originalCall = aiService['callAIWithRetry'].bind(aiService);
      aiService['callAIWithRetry'] = jest.fn().mockImplementation(async (operation: any, maxRetries: number) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('API timeout');
        }
        return operation();
      });

      try {
        await aiService.processNutritionWithRetry(imageData, 3);
      } catch (error) {
        // Expected to fail first time
      }

      // Restore and test successful retry
      aiService['callAIWithRetry'] = originalCall;
      const result = await aiService.processNutritionWithRetry(imageData, 3);
      expect(result).toBeDefined();
    });

    it('should format AI response into NutritionInfo model', async () => {
      const rawAIResponse = {
        foodName: 'Pizza',
        servingSize: '1 slice',
        calories: 300,
        nutrients: {
          protein: 12,
          carbs: 36,
          fat: 12,
        },
      };

      const nutritionInfo = await aiService.formatNutritionResponse(rawAIResponse);

      expect(nutritionInfo.foodName).toBe('Pizza');
      expect(nutritionInfo.calories).toBe(300);
    });
  });

  describe('Alternative Suggestions', () => {
    it('should generate alternative food suggestions', async () => {
      const nutritionData = new NutritionInfo('Cheeseburger', '100g', 500, {
        protein: 25,
        carbs: 40,
        fat: 25,
        fiber: 2,
        sodium: 800,
        sugar: 10,
        saturatedFat: 10,
        transFat: 0,
      });

      const alternatives = await aiService.suggestAlternatives(nutritionData, []);

      expect(Array.isArray(alternatives)).toBe(true);
      if (alternatives.length > 0) {
        expect(alternatives[0].name).toBeDefined();
        expect(alternatives[0].reason).toBeDefined();
      }
    });

    it('should calculate nutrition comparison for alternatives', async () => {
      const currentNutrition = {
        calories: 500,
        nutrients: { protein: 20, fat: 25, sodium: 1000 },
      };
      const alternativeNutrition = {
        calories: 350,
        nutrients: { protein: 25, fat: 15, sodium: 600 },
      };

      const comparison = await aiService.compareNutrition(
        currentNutrition,
        alternativeNutrition
      );

      expect(comparison.calories.difference).toBeLessThan(0);
      expect(comparison.sodium.difference).toBeLessThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      await expect(
        aiService.processNutrition(imageData)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed AI responses', async () => {
      const malformedResponse = { invalid: 'data' };

      await expect(
        aiService.formatNutritionResponse(malformedResponse)
      ).rejects.toThrow();
    });

    it('should validate AI response structure', async () => {
      const invalidResponse = null;

      await expect(
        aiService.validateAIResponse(invalidResponse)
      ).rejects.toThrow('Invalid response structure');
    });
  });
});

