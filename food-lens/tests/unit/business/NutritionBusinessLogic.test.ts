/**
 * Nutrition Business Logic Tests
 * Comprehensive tests for nutrition calculations, health scoring, and business rules
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';

describe('Nutrition Business Logic', () => {
  describe('Calorie Calculations', () => {
    it('should calculate total calories from macronutrients', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        250,
        {
          protein: 20, // 20g * 4 = 80 cal
          carbs: 30,  // 30g * 4 = 120 cal
          fat: 5,     // 5g * 9 = 45 cal
          fiber: 10,
          sodium: 500,
          sugar: 15,
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      const totalFromMacros = nutrition.getCaloriesFromProtein() + 
                             nutrition.getCaloriesFromCarbs() + 
                             nutrition.getCaloriesFromFat();
      
      expect(totalFromMacros).toBe(245); // 80 + 120 + 45
    });

    it('should calculate daily value percentage for calories', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        2000, // 2000 calories (100% DV)
        {
          protein: 50,
          carbs: 250,
          fat: 65,
          fiber: 28,
          sodium: 2300,
          sugar: 50,
          saturatedFat: 20,
          transFat: 0,
        }
      );
      
      // Business rule: Daily value is 2000 calories
      const dailyValuePercent = nutrition.getDailyValuePercentage('calories');
      expect(dailyValuePercent).toBe(100);
    });

    it('should calculate macronutrient ratios', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        250,
        {
          protein: 20, // 20% of 100g total macros
          carbs: 30,  // 30% of 100g total macros
          fat: 5,     // 5% of 100g total macros
          fiber: 10,
          sodium: 500,
          sugar: 15,
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      const ratios = nutrition.getMacronutrientRatios();
      expect(ratios.protein).toBeCloseTo(36.36, 2); // 20/55 * 100
      expect(ratios.carbs).toBeCloseTo(54.55, 2);   // 30/55 * 100
      expect(ratios.fat).toBeCloseTo(9.09, 2);      // 5/55 * 100
    });
  });

  describe('Health Scoring', () => {
    it('should calculate overall health score', () => {
      const healthyNutrition = new NutritionInfo(
        'Healthy Food',
        '100g',
        150,
        {
          protein: 20,
          carbs: 25,
          fat: 3,
          fiber: 10,
          sodium: 200,
          sugar: 5,
          saturatedFat: 1,
          transFat: 0,
        }
      );
      
      const score = healthyNutrition.getHealthScore();
      expect(score).toBeGreaterThan(70); // Should score high
    });

    it('should penalize high sodium in health score', () => {
      const highSodiumNutrition = new NutritionInfo(
        'Salty Food',
        '100g',
        200,
        {
          protein: 10,
          carbs: 30,
          fat: 5,
          fiber: 2,
          sodium: 2000, // Very high
          sugar: 20,
          saturatedFat: 3,
          transFat: 0,
        }
      );
      
      const score = highSodiumNutrition.getHealthScore();
      expect(score).toBeLessThan(50); // Should score low due to sodium
    });

    it('should reward high fiber in health score', () => {
      const highFiberNutrition = new NutritionInfo(
        'Fiber Food',
        '100g',
        150,
        {
          protein: 15,
          carbs: 40,
          fat: 2,
          fiber: 15, // Very high fiber
          sodium: 100,
          sugar: 3,
          saturatedFat: 0.5,
          transFat: 0,
        }
      );
      
      const score = highFiberNutrition.getHealthScore();
      expect(score).toBeGreaterThan(75); // Should score high due to fiber
    });

    it('should penalize high sugar in health score', () => {
      const highSugarNutrition = new NutritionInfo(
        'Sugary Food',
        '100g',
        300,
        {
          protein: 5,
          carbs: 60,
          fat: 5,
          fiber: 1,
          sodium: 100,
          sugar: 45, // Very high sugar
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      const score = highSugarNutrition.getHealthScore();
      expect(score).toBeLessThan(50); // Should score low due to sugar
    });
  });

  describe('Daily Value Calculations', () => {
    it('should calculate daily value percentage for sodium', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        250,
        {
          protein: 10,
          carbs: 30,
          fat: 5,
          fiber: 5,
          sodium: 1150, // 50% of 2300mg DV
          sugar: 10,
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      const dvPercent = nutrition.getDailyValuePercentage('sodium');
      expect(dvPercent).toBeCloseTo(50, 1);
    });

    it('should calculate daily value percentage for fiber', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        250,
        {
          protein: 10,
          carbs: 30,
          fat: 5,
          fiber: 14, // 50% of 28g DV
          sodium: 500,
          sugar: 10,
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      const dvPercent = nutrition.getDailyValuePercentage('fiber');
      expect(dvPercent).toBeCloseTo(50, 1);
    });

    it('should calculate daily value for all nutrients', () => {
      const nutrition = new NutritionInfo(
        'Test Food',
        '100g',
        250,
        {
          protein: 50, // 100% of 50g DV
          carbs: 130,
          fat: 65,
          fiber: 28, // 100% of 28g DV
          sodium: 2300, // 100% of 2300mg DV
          sugar: 50, // 100% of 50g DV
          saturatedFat: 20,
          transFat: 0,
        }
      );
      
      const allDV = nutrition.getAllDailyValues();
      expect(allDV.protein).toBeCloseTo(100, 1);
      expect(allDV.fiber).toBeCloseTo(100, 1);
      expect(allDV.sodium).toBeCloseTo(100, 1);
      expect(allDV.sugar).toBeCloseTo(100, 1);
    });
  });

  describe('Nutrition Warnings', () => {
    it('should identify high trans fat foods', () => {
      const highTransFat = new NutritionInfo(
        'Unhealthy Food',
        '100g',
        300,
        {
          protein: 5,
          carbs: 30,
          fat: 15,
          fiber: 1,
          sodium: 500,
          sugar: 20,
          saturatedFat: 5,
          transFat: 2, // High trans fat
        }
      );
      
      expect(highTransFat.hasTransFat()).toBe(true);
      expect(highTransFat.getNutritionWarnings()).toContain('High trans fat');
    });

    it('should identify multiple nutrition warnings', () => {
      const unhealthy = new NutritionInfo(
        'Unhealthy Food',
        '100g',
        500,
        {
          protein: 5,
          carbs: 60,
          fat: 20,
          fiber: 1,
          sodium: 2000,
          sugar: 40,
          saturatedFat: 10,
          transFat: 1,
        }
      );
      
      const warnings = unhealthy.getNutritionWarnings();
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings).toContain('High sodium');
      expect(warnings).toContain('High sugar');
    });

    it('should not warn for healthy foods', () => {
      const healthy = new NutritionInfo(
        'Healthy Food',
        '100g',
        150,
        {
          protein: 20,
          carbs: 25,
          fat: 3,
          fiber: 10,
          sodium: 200,
          sugar: 5,
          saturatedFat: 1,
          transFat: 0,
        }
      );
      
      const warnings = healthy.getNutritionWarnings();
      expect(warnings.length).toBe(0);
    });
  });

  describe('Macronutrient Analysis', () => {
    it('should identify if food is high protein', () => {
      const highProtein = new NutritionInfo(
        'Protein Food',
        '100g',
        200,
        {
          protein: 40, // 40% of calories from protein
          carbs: 20,
          fat: 5,
          fiber: 5,
          sodium: 300,
          sugar: 2,
          saturatedFat: 1,
          transFat: 0,
        }
      );
      
      expect(highProtein.isHighProtein()).toBe(true);
    });

    it('should identify if food is low carb', () => {
      const lowCarb = new NutritionInfo(
        'Low Carb Food',
        '100g',
        200,
        {
          protein: 30,
          carbs: 5, // Very low carbs
          fat: 10,
          fiber: 8,
          sodium: 200,
          sugar: 1,
          saturatedFat: 2,
          transFat: 0,
        }
      );
      
      expect(lowCarb.isLowCarb()).toBe(true);
    });

    it('should identify if food is low fat', () => {
      const lowFat = new NutritionInfo(
        'Low Fat Food',
        '100g',
        150,
        {
          protein: 20,
          carbs: 30,
          fat: 2, // Very low fat
          fiber: 8,
          sodium: 200,
          sugar: 5,
          saturatedFat: 0.5,
          transFat: 0,
        }
      );
      
      expect(lowFat.isLowFat()).toBe(true);
    });
  });
});

