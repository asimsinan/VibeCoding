/**
 * FoodScan Business Logic Tests
 * Comprehensive tests for scan health scoring, allergen matching, and business rules
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { FoodScan } from '../../../src/lib/food-label-scanner/models/FoodScan';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';
import { AllergenInfo } from '../../../src/lib/food-label-scanner/models/AllergenInfo';

describe('FoodScan Business Logic', () => {
  const createImageMetadata = () => ({
    size: 1024 * 1024,
    format: 'jpeg' as const,
    width: 1920,
    height: 1080,
    uploadedAt: new Date(),
  });

  const createNutrition = (calories: number, overrides = {}) => {
    return new NutritionInfo(
      'Test Food',
      '100g',
      calories,
      {
        protein: 10,
        carbs: 30,
        fat: 5,
        fiber: 5,
        sodium: 500,
        sugar: 15,
        saturatedFat: 2,
        transFat: 0,
        ...overrides,
      }
    );
  };

  describe('Health Scoring', () => {
    it('should calculate overall health score for scan', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(200, {
        protein: 20,
        fiber: 10,
        sodium: 200,
        sugar: 5,
      });
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, []);
      
      const score = scan.getHealthScore();
      expect(score).toBeGreaterThan(70);
    });

    it('should penalize health score for high severity allergens', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(200);
      const allergens = [
        new AllergenInfo('Peanuts', 'high'),
        new AllergenInfo('Tree Nuts', 'high'),
      ];
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, allergens);
      
      const score = scan.getHealthScore();
      expect(score).toBeLessThan(scan.getHealthScoreWithoutAllergens());
    });

    it('should calculate allergen risk score', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const allergens = [
        new AllergenInfo('Peanuts', 'high'),
        new AllergenInfo('Milk', 'medium'),
        new AllergenInfo('Sesame', 'low'),
      ];
      
      scan.allergens = allergens;
      
      const riskScore = scan.getAllergenRiskScore();
      expect(riskScore).toBeGreaterThan(5); // Should reflect multiple high-severity allergens
    });
  });

  describe('User Dietary Restriction Matching', () => {
    it('should identify if scan contains restricted allergens', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const allergens = [
        new AllergenInfo('Gluten', 'high'),
        new AllergenInfo('Dairy', 'medium'),
      ];
      
      scan.allergens = allergens;
      
      const userRestrictions = ['gluten-free', 'dairy-free'];
      expect(scan.containsRestrictedAllergens(userRestrictions)).toBe(true);
    });

    it('should return matching allergens for user restrictions', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const allergens = [
        new AllergenInfo('Gluten', 'high'),
        new AllergenInfo('Peanuts', 'high'),
        new AllergenInfo('Soy', 'medium'),
      ];
      
      scan.allergens = allergens;
      
      const userRestrictions = ['gluten-free'];
      const matches = scan.getMatchingRestrictedAllergens(userRestrictions);
      expect(matches.length).toBe(1);
      expect(matches[0].name).toBe('Gluten');
    });

    it('should calculate safety score for user based on restrictions', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(200);
      const allergens = [
        new AllergenInfo('Milk', 'high'),
      ];
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, allergens);
      
      const userRestrictions = ['dairy-free'];
      const safetyScore = scan.getSafetyScoreForUser(userRestrictions);
      expect(safetyScore).toBeLessThan(50); // Should be low due to dairy restriction
    });
  });

  describe('Nutrition Analysis', () => {
    it('should identify if scan is suitable for specific diet type', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(200, {
        carbs: 5, // Low carb
        protein: 25, // High protein
        fat: 15,
      });
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, []);
      
      expect(scan.isSuitableForDiet('keto')).toBe(true);
      expect(scan.isSuitableForDiet('low-carb')).toBe(true);
      expect(scan.isSuitableForDiet('high-protein')).toBe(true);
    });

    it('should calculate nutritional completeness score', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(250, {
        protein: 25,
        fiber: 10,
      });
      
      // Add vitamins and minerals
      nutrition.vitamins = [
        { name: 'Vitamin C', amount: 100, unit: 'mg', dailyValue: 100 },
      ];
      nutrition.minerals = [
        { name: 'Iron', amount: 18, unit: 'mg', dailyValue: 100 },
      ];
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, []);
      
      const completeness = scan.getNutritionalCompletenessScore();
      expect(completeness).toBeGreaterThan(60); // Should reflect good nutrition profile
    });
  });

  describe('Recommendation Logic', () => {
    it('should determine if alternatives should be shown', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(500, {
        sodium: 2000,
        sugar: 40,
        fat: 25,
      });
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, []);
      
      expect(scan.shouldShowAlternatives()).toBe(true); // Unhealthy food should show alternatives
    });

    it('should not show alternatives for healthy foods', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(200, {
        protein: 20,
        fiber: 10,
        sodium: 200,
        sugar: 5,
        fat: 3,
      });
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, []);
      
      expect(scan.shouldShowAlternatives()).toBe(false);
    });

    it('should calculate urgency score for showing alternatives', () => {
      const scan = new FoodScan(
        'scan1',
        'user1',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      
      const nutrition = createNutrition(600, {
        transFat: 3, // Very unhealthy
        sodium: 2500,
        sugar: 50,
      });
      
      scan.markAsProcessing();
      scan.markAsCompleted(nutrition, [
        new AllergenInfo('Peanuts', 'high'),
      ]);
      
      const urgency = scan.getAlternativeShowUrgency();
      expect(urgency).toBeGreaterThan(8); // Should be high urgency
    });
  });
});

