/**
 * AlternativeSuggestion Model
 * Links healthier food alternatives with nutritional comparisons and reasoning
 * FR-008: Suggest healthier alternatives
 */

export interface NutritionComparison {
  calories: { current: number; alternative: number; difference: number };
  protein: { current: number; alternative: number; difference: number };
  carbs: { current: number; alternative: number; difference: number };
  fat: { current: number; alternative: number; difference: number };
  fiber: { current: number; alternative: number; difference: number };
  sodium: { current: number; alternative: number; difference: number };
}

export class AlternativeSuggestion {
  public id: string;
  public name: string;
  public reason: string;
  public nutritionComparison: NutritionComparison;
  public imageUrl: string | null;

  constructor(
    id: string,
    name: string,
    reason: string,
    nutritionComparison: NutritionComparison,
    imageUrl: string | null = null
  ) {
    this.id = this.validateId(id);
    this.name = this.validateName(name);
    this.reason = this.validateReason(reason);
    this.nutritionComparison = this.validateNutritionComparison(nutritionComparison);
    this.imageUrl = imageUrl;
  }

  // Validation methods
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Alternative ID cannot be empty');
    }
    return id.trim();
  }

  private validateName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Alternative name cannot be empty');
    }
    if (name.length > 200) {
      throw new Error('Alternative name cannot exceed 200 characters');
    }
    return name.trim();
  }

  private validateReason(reason: string): string {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason cannot be empty');
    }
    if (reason.length > 500) {
      throw new Error('Reason cannot exceed 500 characters');
    }
    return reason.trim();
  }

  private validateNutritionComparison(comparison: NutritionComparison): NutritionComparison {
    const validateComparisonField = (
      field: { current: number; alternative: number; difference: number },
      fieldName: string
    ) => {
      if (field.current < 0 || field.alternative < 0) {
        throw new Error(`${fieldName} values cannot be negative`);
      }
      const calculatedDifference = field.alternative - field.current;
      if (Math.abs(field.difference - calculatedDifference) > 0.01) {
        throw new Error(`${fieldName} difference must equal alternative - current`);
      }
    };

    validateComparisonField(comparison.calories, 'Calories');
    validateComparisonField(comparison.protein, 'Protein');
    validateComparisonField(comparison.carbs, 'Carbs');
    validateComparisonField(comparison.fat, 'Fat');
    validateComparisonField(comparison.fiber, 'Fiber');
    validateComparisonField(comparison.sodium, 'Sodium');

    return comparison;
  }

  // Business logic methods
  public isHealthier(): boolean {
    return (
      this.nutritionComparison.calories.difference < 0 ||
      this.nutritionComparison.fat.difference < 0 ||
      this.nutritionComparison.sodium.difference < 0 ||
      this.nutritionComparison.fiber.difference > 0
    );
  }

  public getHealthImprovementScore(): number {
    let score = 0;
    if (this.nutritionComparison.calories.difference < 0) score += 3;
    if (this.nutritionComparison.fat.difference < 0) score += 2;
    if (this.nutritionComparison.sodium.difference < 0) score += 2;
    if (this.nutritionComparison.fiber.difference > 0) score += 2;
    if (this.nutritionComparison.protein.difference > 0) score += 1;
    return score;
  }

  public getPrimaryBenefit(): string {
    const benefits: string[] = [];
    if (this.nutritionComparison.calories.difference < 0) {
      benefits.push(`Lower calories (${Math.abs(this.nutritionComparison.calories.difference)} fewer)`);
    }
    if (this.nutritionComparison.fat.difference < 0) {
      benefits.push(`Lower fat (${Math.abs(this.nutritionComparison.fat.difference)}g less)`);
    }
    if (this.nutritionComparison.sodium.difference < 0) {
      benefits.push(`Lower sodium (${Math.abs(this.nutritionComparison.sodium.difference)}mg less)`);
    }
    if (this.nutritionComparison.fiber.difference > 0) {
      benefits.push(`Higher fiber (+${this.nutritionComparison.fiber.difference}g)`);
    }
    return benefits.join(', ') || 'Nutritional benefits';
  }

  // Recommendation Logic
  public static sortByHealthImprovement(alternatives: AlternativeSuggestion[]): AlternativeSuggestion[] {
    return [...alternatives].sort((a, b) => 
      b.getHealthImprovementScore() - a.getHealthImprovementScore()
    );
  }

  public static getBestForGoal(
    alternatives: AlternativeSuggestion[],
    goal: 'calories' | 'protein' | 'sodium' | 'fat'
  ): AlternativeSuggestion {
    if (alternatives.length === 0) {
      throw new Error('No alternatives provided');
    }

    return alternatives.reduce((best, current) => {
      const currentDiff = current.nutritionComparison[goal].difference;
      const bestDiff = best.nutritionComparison[goal].difference;

      // For calories, fat, sodium: want negative (lower is better)
      // For protein: want positive (higher is better)
      if (goal === 'protein') {
        return currentDiff > bestDiff ? current : best;
      } else {
        return currentDiff < bestDiff ? current : best;
      }
    });
  }

  public static filterByMinimumImprovement(
    alternatives: AlternativeSuggestion[],
    minimumScore: number
  ): AlternativeSuggestion[] {
    return alternatives.filter(alt => alt.getHealthImprovementScore() >= minimumScore);
  }

  // Comparison Analysis
  public getPercentageImprovement(nutrient: 'calories' | 'protein' | 'fat' | 'sodium'): number {
    const comparison = this.nutritionComparison[nutrient];
    if (comparison.current === 0) return 0;
    
    const improvement = (Math.abs(comparison.difference) / comparison.current) * 100;
    return improvement;
  }

  public getPrimaryImprovementCategory(): 'calories' | 'protein' | 'fat' | 'sodium' | 'fiber' {
    // Calculate improvement scores (normalized)
    const improvements: Array<{ category: 'calories' | 'protein' | 'fat' | 'sodium' | 'fiber'; score: number }> = [
      { 
        category: 'calories', 
        score: this.nutritionComparison.calories.current > 0 
          ? (Math.abs(this.nutritionComparison.calories.difference) / this.nutritionComparison.calories.current) * 100 
          : 0
      },
      { 
        category: 'protein', 
        score: this.nutritionComparison.protein.difference > 0 && this.nutritionComparison.protein.current > 0
          ? (this.nutritionComparison.protein.difference / this.nutritionComparison.protein.current) * 100
          : 0
      },
      { 
        category: 'fat', 
        score: this.nutritionComparison.fat.current > 0
          ? (Math.abs(this.nutritionComparison.fat.difference) / this.nutritionComparison.fat.current) * 100
          : 0
      },
      { 
        category: 'sodium', 
        score: this.nutritionComparison.sodium.current > 0
          ? (Math.abs(this.nutritionComparison.sodium.difference) / this.nutritionComparison.sodium.current) * 100
          : 0
      },
      { 
        category: 'fiber', 
        score: this.nutritionComparison.fiber.difference > 0 && this.nutritionComparison.fiber.current > 0
          ? (this.nutritionComparison.fiber.difference / this.nutritionComparison.fiber.current) * 100
          : this.nutritionComparison.fiber.difference > 0 ? 100 : 0
      },
    ];

    // Sort by normalized score (highest improvement first)
    improvements.sort((a, b) => b.score - a.score);

    return improvements[0].category;
  }

  public getOverallImprovementPercentage(): number {
    const improvements = [
      this.getPercentageImprovement('calories'),
      this.getPercentageImprovement('fat'),
      this.getPercentageImprovement('sodium'),
    ];

    const proteinImprovement = this.nutritionComparison.protein.difference > 0
      ? (this.nutritionComparison.protein.difference / this.nutritionComparison.protein.current) * 100
      : 0;

    const fiberImprovement = this.nutritionComparison.fiber.difference > 0
      ? (this.nutritionComparison.fiber.difference / (this.nutritionComparison.fiber.current || 1)) * 100
      : 0;

    const avgImprovement = [...improvements, proteinImprovement, fiberImprovement]
      .filter(v => v > 0)
      .reduce((sum, v) => sum + v, 0) / 5;

    return avgImprovement;
  }

  // Business Rules
  public meetsMinimumHealthStandards(): boolean {
    // Alternative must be healthier in at least one significant way
    return this.isHealthier() && this.getHealthImprovementScore() >= 2;
  }

  public getCostBenefitRatio(): number {
    const benefits = this.getHealthImprovementScore();
    const costs = this.getPotentialDrawbacks();
    
    if (costs === 0) return benefits > 0 ? 10 : 1;
    return benefits / costs;
  }

  private getPotentialDrawbacks(): number {
    let drawbacks = 0;
    
    // Penalize if protein decreases
    if (this.nutritionComparison.protein.difference < 0) {
      drawbacks += 2;
    }
    
    // Penalize if fiber decreases
    if (this.nutritionComparison.fiber.difference < 0) {
      drawbacks += 1;
    }
    
    // Small penalty if calories increase (unlikely but possible)
    if (this.nutritionComparison.calories.difference > 0) {
      drawbacks += 3;
    }

    return drawbacks;
  }

  // Serialization methods
  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      reason: this.reason,
      nutritionComparison: this.nutritionComparison,
      imageUrl: this.imageUrl,
    };
  }

  public static fromJSON(data: Record<string, unknown>): AlternativeSuggestion {
    return new AlternativeSuggestion(
      data.id as string,
      data.name as string,
      data.reason as string,
      data.nutritionComparison as NutritionComparison,
      data.imageUrl as string | null
    );
  }
}

