import { AlternativeController } from '../../../src/lib/food-label-scanner/services/controllers/AlternativeController';
import { aiService } from '../../../src/lib/food-label-scanner/services/ai/AIService';
import { AlternativeSuggestion, NutritionComparison } from '../../../src/lib/food-label-scanner/models/AlternativeSuggestion';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';

// Mock axios for AIService
jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('../../../src/lib/food-label-scanner/services/ai/AIService', () => ({
  aiService: {
    suggestAlternatives: jest.fn(),
    processNutrition: jest.fn(),
    processAllergens: jest.fn(),
  },
}));

describe('AlternativeController', () => {
  let controller: AlternativeController;
  const mockAIService = aiService as jest.Mocked<typeof aiService>;

  beforeEach(() => {
    controller = new AlternativeController();
    jest.clearAllMocks();
  });

  describe('Request Handling', () => {
    it('should handle alternative suggestion request', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      const mockAlternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Healthier Food',
          'Lower calories and sodium',
          createMockComparison(),
          'https://example.com/image.jpg'
        ),
      ];

      mockAIService.suggestAlternatives.mockResolvedValue(mockAlternatives);

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: [],
      });

      expect(mockAIService.suggestAlternatives).toHaveBeenCalledWith(
        mockNutrition,
        []
      );
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should handle alternative request with dietary restrictions', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      const mockAlternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Gluten-Free Food',
          'No gluten',
          createMockComparison(),
          'https://example.com/image.jpg'
        ),
      ];

      mockAIService.suggestAlternatives.mockResolvedValue(mockAlternatives);

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: ['gluten'],
      });

      expect(mockAIService.suggestAlternatives).toHaveBeenCalledWith(
        mockNutrition,
        ['gluten']
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Response Formatting', () => {
    it('should format successful alternatives response', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      const mockAlternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Healthier Food',
          'Lower calories',
          createMockComparison(),
          'https://example.com/image.jpg'
        ),
        new AlternativeSuggestion(
          'alt2',
          'Another Option',
          'High protein',
          createMockComparison(),
          'https://example.com/image2.jpg'
        ),
      ];

      mockAIService.suggestAlternatives.mockResolvedValue(mockAlternatives);

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: [],
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].name).toBe('Healthier Food');
    });

    it('should format empty alternatives response', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      mockAIService.suggestAlternatives.mockResolvedValue([]);

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: [],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Error Management', () => {
    it('should format error for invalid nutrition data', async () => {
      const invalidNutrition = null as any;

      const result = await controller.getAlternatives({
        currentNutrition: invalidNutrition,
        dietaryRestrictions: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should format error for AI service failure', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      mockAIService.suggestAlternatives.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('AI service unavailable');
    });

    it('should handle rate limit errors', async () => {
      const mockNutrition = new NutritionInfo('Food', '100g', 500, {
        protein: 5,
        carbs: 60,
        fat: 20,
        fiber: 2,
        sodium: 800,
        sugar: 30,
        saturatedFat: 10,
        transFat: 1,
      });

      mockAIService.suggestAlternatives.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const result = await controller.getAlternatives({
        currentNutrition: mockNutrition,
        dietaryRestrictions: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Rate limit exceeded');
    });
  });

  function createMockComparison(): NutritionComparison {
    return {
      calories: { current: 500, alternative: 300, difference: -200 },
      protein: { current: 5, alternative: 15, difference: 10 },
      carbs: { current: 60, alternative: 40, difference: -20 },
      fat: { current: 20, alternative: 10, difference: -10 },
      fiber: { current: 2, alternative: 8, difference: 6 },
      sodium: { current: 800, alternative: 400, difference: -400 },
    };
  }
});
