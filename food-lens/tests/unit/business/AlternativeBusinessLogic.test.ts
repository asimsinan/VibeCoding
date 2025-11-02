/**
 * Alternative Suggestion Business Logic Tests
 * Comprehensive tests for alternative scoring, comparison logic, and recommendation rules
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { AlternativeSuggestion } from '../../../src/lib/food-label-scanner/models/AlternativeSuggestion';

describe('Alternative Suggestion Business Logic', () => {
  const createComparison = (differences: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
  }) => {
    const current = {
      calories: 300,
      protein: 10,
      carbs: 40,
      fat: 10,
      fiber: 2,
      sodium: 500,
    };
    
    return {
      calories: {
        current: current.calories,
        alternative: current.calories + (differences.calories || 0),
        difference: differences.calories || 0,
      },
      protein: {
        current: current.protein,
        alternative: current.protein + (differences.protein || 0),
        difference: differences.protein || 0,
      },
      carbs: {
        current: current.carbs,
        alternative: current.carbs + (differences.carbs || 0),
        difference: differences.carbs || 0,
      },
      fat: {
        current: current.fat,
        alternative: current.fat + (differences.fat || 0),
        difference: differences.fat || 0,
      },
      fiber: {
        current: current.fiber,
        alternative: current.fiber + (differences.fiber || 0),
        difference: differences.fiber || 0,
      },
      sodium: {
        current: current.sodium,
        alternative: current.sodium + (differences.sodium || 0),
        difference: differences.sodium || 0,
      },
    };
  };

  describe('Health Improvement Scoring', () => {
    it('should calculate improvement score for better alternative', () => {
      const alternative = new AlternativeSuggestion(
        'alt1',
        'Better Food',
        'Lower calories and fat',
        createComparison({
          calories: -100,
          fat: -5,
          fiber: 5,
        })
      );
      
      const score = alternative.getHealthImprovementScore();
      expect(score).toBeGreaterThan(5); // Should score well
    });

    it('should rank alternatives by improvement score', () => {
      const alternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Best Alternative',
          'Much better',
          createComparison({ calories: -150, fat: -8, fiber: 10 })
        ),
        new AlternativeSuggestion(
          'alt2',
          'Good Alternative',
          'Better',
          createComparison({ calories: -50, fat: -2 })
        ),
        new AlternativeSuggestion(
          'alt3',
          'OK Alternative',
          'Slightly better',
          createComparison({ calories: -20 })
        ),
      ];
      
      const sorted = AlternativeSuggestion.sortByHealthImprovement(alternatives);
      expect(sorted[0].name).toBe('Best Alternative');
      expect(sorted[1].name).toBe('Good Alternative');
      expect(sorted[2].name).toBe('OK Alternative');
    });
  });

  describe('Recommendation Logic', () => {
    it('should identify best alternative for specific goal', () => {
      const alternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Low Calorie',
          'Fewer calories',
          createComparison({ calories: -200, fat: -2 })
        ),
        new AlternativeSuggestion(
          'alt2',
          'High Protein',
          'More protein',
          createComparison({ calories: -50, protein: 15 })
        ),
        new AlternativeSuggestion(
          'alt3',
          'Low Sodium',
          'Less sodium',
          createComparison({ calories: -30, sodium: -300 })
        ),
      ];
      
      const bestForWeightLoss = AlternativeSuggestion.getBestForGoal(alternatives, 'calories');
      expect(bestForWeightLoss.name).toBe('Low Calorie');
      
      const bestForMuscle = AlternativeSuggestion.getBestForGoal(alternatives, 'protein');
      expect(bestForMuscle.name).toBe('High Protein');
      
      const bestForHeart = AlternativeSuggestion.getBestForGoal(alternatives, 'sodium');
      expect(bestForHeart.name).toBe('Low Sodium');
    });

    it('should filter alternatives by minimum improvement threshold', () => {
      const alternatives = [
        new AlternativeSuggestion(
          'alt1',
          'Great Alternative',
          'Much better',
          createComparison({ calories: -150, fat: -8 })
        ),
        new AlternativeSuggestion(
          'alt2',
          'OK Alternative',
          'Slightly better',
          createComparison({ calories: -10 })
        ),
        new AlternativeSuggestion(
          'alt3',
          'Poor Alternative',
          'Not much better',
          createComparison({ calories: -5 })
        ),
      ];
      
      const significant = AlternativeSuggestion.filterByMinimumImprovement(alternatives, 5);
      expect(significant.length).toBe(1);
      expect(significant[0].name).toBe('Great Alternative');
    });
  });

  describe('Comparison Analysis', () => {
    it('should calculate percentage improvement', () => {
      const alternative = new AlternativeSuggestion(
        'alt1',
        'Better Food',
        '20% fewer calories',
        createComparison({ calories: -60 }) // 20% of 300
      );
      
      const improvement = alternative.getPercentageImprovement('calories');
      expect(improvement).toBeCloseTo(20, 1);
    });

    it('should identify primary improvement category', () => {
      const lowCalorieAlt = new AlternativeSuggestion(
        'alt1',
        'Low Calorie',
        'Fewer calories',
        createComparison({ calories: -150, fat: -3 })
      );
      
      expect(lowCalorieAlt.getPrimaryImprovementCategory()).toBe('calories');
      
      const lowSodiumAlt = new AlternativeSuggestion(
        'alt2',
        'Low Sodium',
        'Less sodium',
        createComparison({ sodium: -400, calories: -20 })
      );
      
      expect(lowSodiumAlt.getPrimaryImprovementCategory()).toBe('sodium');
    });

    it('should calculate overall improvement percentage', () => {
      const alternative = new AlternativeSuggestion(
        'alt1',
        'Much Better',
        'Significant improvement',
        createComparison({
          calories: -100,
          fat: -5,
          sodium: -200,
          fiber: 8,
        })
      );
      
      const overallImprovement = alternative.getOverallImprovementPercentage();
      expect(overallImprovement).toBeGreaterThan(10);
    });
  });

  describe('Business Rules', () => {
    it('should validate alternative meets minimum health standards', () => {
      const goodAlternative = new AlternativeSuggestion(
        'alt1',
        'Good Alternative',
        'Better nutrition',
        createComparison({ calories: -100, fat: -5, fiber: 5 })
      );
      
      expect(goodAlternative.meetsMinimumHealthStandards()).toBe(true);
    });

    it('should reject alternatives that are not healthier', () => {
      const badAlternative = new AlternativeSuggestion(
        'alt1',
        'Bad Alternative',
        'Worse nutrition',
        createComparison({ calories: 50, fat: 5, sodium: 100 }) // Worse on all fronts
      );
      
      expect(badAlternative.meetsMinimumHealthStandards()).toBe(false);
    });

    it('should calculate cost-benefit ratio', () => {
      const alternative = new AlternativeSuggestion(
        'alt1',
        'Alternative',
        'Better option',
        createComparison({ calories: -100, fat: -5 })
      );
      
      // Cost-benefit considers improvement vs potential trade-offs
      const ratio = alternative.getCostBenefitRatio();
      expect(ratio).toBeGreaterThan(1); // Benefits should outweigh costs
    });
  });
});

