/**
 * Nutrition Calculation Utilities Tests
 * Tests for shared calculation logic and business rules
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

describe('Nutrition Calculations', () => {
  describe('Daily Value Calculations', () => {
    it('should calculate daily value for calories', () => {
      const { calculateDailyValue } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const dv = calculateDailyValue(2000, 'calories');
      expect(dv).toBe(100); // 2000 is 100% of 2000 DV
    });

    it('should calculate daily value for sodium', () => {
      const { calculateDailyValue } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const dv = calculateDailyValue(1150, 'sodium');
      expect(dv).toBeCloseTo(50, 1); // 1150mg is 50% of 2300mg DV
    });

    it('should calculate daily value for fiber', () => {
      const { calculateDailyValue } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const dv = calculateDailyValue(14, 'fiber');
      expect(dv).toBeCloseTo(50, 1); // 14g is 50% of 28g DV
    });
  });

  describe('Health Score Calculation', () => {
    it('should calculate health score based on nutrition profile', () => {
      const { calculateHealthScore } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const healthyProfile = {
        calories: 200,
        protein: 20,
        carbs: 30,
        fat: 5,
        fiber: 10,
        sodium: 200,
        sugar: 5,
        saturatedFat: 1,
        transFat: 0,
      };
      
      const score = calculateHealthScore(healthyProfile);
      expect(score).toBeGreaterThan(75);
    });

    it('should penalize unhealthy nutrients in score', () => {
      const { calculateHealthScore } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const unhealthyProfile = {
        calories: 500,
        protein: 5,
        carbs: 60,
        fat: 25,
        fiber: 1,
        sodium: 2000,
        sugar: 40,
        saturatedFat: 10,
        transFat: 2,
      };
      
      const score = calculateHealthScore(unhealthyProfile);
      expect(score).toBeLessThan(40);
    });
  });

  describe('Macronutrient Ratio Calculations', () => {
    it('should calculate macronutrient ratios', () => {
      const { calculateMacronutrientRatios } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const macros = {
        protein: 20,
        carbs: 30,
        fat: 5,
      };
      
      const ratios = calculateMacronutrientRatios(macros);
      expect(ratios.protein).toBeCloseTo(36.36, 2);
      expect(ratios.carbs).toBeCloseTo(54.55, 2);
      expect(ratios.fat).toBeCloseTo(9.09, 2);
      expect(ratios.protein + ratios.carbs + ratios.fat).toBeCloseTo(100, 2);
    });
  });

  describe('Calorie Calculations', () => {
    it('should calculate calories from macronutrients', () => {
      const { calculateCaloriesFromMacros } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const macros = {
        protein: 20, // 20g * 4 = 80 cal
        carbs: 30,  // 30g * 4 = 120 cal
        fat: 5,     // 5g * 9 = 45 cal
      };
      
      const total = calculateCaloriesFromMacros(macros);
      expect(total).toBe(245);
    });

    it('should calculate percentage of calories from each macro', () => {
      const { calculateCaloriePercentages } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const macros = {
        protein: 20,
        carbs: 30,
        fat: 5,
      };
      const totalCalories = 245;
      
      const percentages = calculateCaloriePercentages(macros, totalCalories);
      expect(percentages.protein).toBeCloseTo(32.65, 1);
      expect(percentages.carbs).toBeCloseTo(48.98, 1);
      expect(percentages.fat).toBeCloseTo(18.37, 1);
    });
  });

  describe('Diet Compatibility Checks', () => {
    it('should check if nutrition profile matches keto diet', () => {
      const { isCompatibleWithDiet } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const ketoProfile = {
        calories: 500,
        protein: 25,
        carbs: 5, // Very low carbs
        fat: 70,
      };
      
      expect(isCompatibleWithDiet(ketoProfile, 'keto')).toBe(true);
    });

    it('should check if nutrition profile matches high-protein diet', () => {
      const { isCompatibleWithDiet } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const highProteinProfile = {
        calories: 400,
        protein: 40, // High protein
        carbs: 30,
        fat: 10,
      };
      
      expect(isCompatibleWithDiet(highProteinProfile, 'high-protein')).toBe(true);
    });

    it('should check if nutrition profile matches low-fat diet', () => {
      const { isCompatibleWithDiet } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const lowFatProfile = {
        calories: 300,
        protein: 20,
        carbs: 50,
        fat: 5, // Low fat
      };
      
      expect(isCompatibleWithDiet(lowFatProfile, 'low-fat')).toBe(true);
    });
  });

  describe('Warning Detection', () => {
    it('should detect high sodium warning', () => {
      const { detectNutritionWarnings } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const profile = {
        sodium: 2000, // >20% DV (460mg threshold)
        calories: 200,
      };
      
      const warnings = detectNutritionWarnings(profile);
      expect(warnings).toContain('High sodium');
    });

    it('should detect high sugar warning', () => {
      const { detectNutritionWarnings } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const profile = {
        sugar: 15, // >20% DV (10g threshold)
        calories: 200,
      };
      
      const warnings = detectNutritionWarnings(profile);
      expect(warnings).toContain('High sugar');
    });

    it('should detect trans fat warning', () => {
      const { detectNutritionWarnings } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const profile = {
        transFat: 1, // Any trans fat is concerning
        calories: 200,
      };
      
      const warnings = detectNutritionWarnings(profile);
      expect(warnings).toContain('Contains trans fat');
    });

    it('should detect multiple warnings', () => {
      const { detectNutritionWarnings } = require('../../../src/lib/food-label-scanner/utils/nutritionCalculations');
      
      const profile = {
        sodium: 2000,
        sugar: 15,
        transFat: 1,
        saturatedFat: 15,
        calories: 500,
      };
      
      const warnings = detectNutritionWarnings(profile);
      expect(warnings.length).toBeGreaterThan(2);
    });
  });
});

