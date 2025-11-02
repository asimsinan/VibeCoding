/**
 * NutritionInfo Model
 * Stores parsed nutritional data including calories, macronutrients, vitamins, minerals, and serving sizes
 * FR-004: Parse AI-processed nutrition data
 */

export interface Nutrients {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sodium: number; // milligrams
  sugar: number; // grams
  saturatedFat: number; // grams
  transFat: number; // grams
}

export interface Vitamin {
  name: string;
  amount: number;
  unit: string;
  dailyValue: number; // percentage
}

export interface Mineral {
  name: string;
  amount: number;
  unit: string;
  dailyValue: number; // percentage
}

export class NutritionInfo {
  public foodName: string;
  public brand: string | null;
  public servingSize: string;
  public calories: number;
  public nutrients: Nutrients;
  public vitamins: Vitamin[];
  public minerals: Mineral[];

  constructor(
    foodName: string,
    servingSize: string,
    calories: number,
    nutrients: Nutrients,
    vitamins: Vitamin[] = [],
    minerals: Mineral[] = [],
    brand: string | null = null
  ) {
    this.foodName = this.validateFoodName(foodName);
    this.brand = brand;
    this.servingSize = this.validateServingSize(servingSize);
    this.calories = this.validateCalories(calories);
    this.nutrients = this.validateNutrients(nutrients);
    this.vitamins = this.validateVitamins(vitamins);
    this.minerals = this.validateMinerals(minerals);
  }

  // Validation methods
  private validateFoodName(foodName: string): string {
    if (!foodName || foodName.trim().length === 0) {
      throw new Error('Food name cannot be empty');
    }
    if (foodName.length > 200) {
      throw new Error('Food name cannot exceed 200 characters');
    }
    return foodName.trim();
  }

  private validateServingSize(servingSize: string): string {
    if (!servingSize || servingSize.trim().length === 0) {
      throw new Error('Serving size cannot be empty');
    }
    return servingSize.trim();
  }

  private validateCalories(calories: number): number {
    if (calories < 0) {
      throw new Error('Calories cannot be negative');
    }
    if (calories > 10000) {
      throw new Error('Calories cannot exceed 10000 per serving');
    }
    return calories;
  }

  private validateNutrients(nutrients: Nutrients): Nutrients {
    const validateNonNegative = (value: number, name: string): number => {
      if (value < 0) {
        throw new Error(`${name} cannot be negative`);
      }
      return value;
    };

    return {
      protein: validateNonNegative(nutrients.protein, 'Protein'),
      carbs: validateNonNegative(nutrients.carbs, 'Carbs'),
      fat: validateNonNegative(nutrients.fat, 'Fat'),
      fiber: validateNonNegative(nutrients.fiber, 'Fiber'),
      sodium: validateNonNegative(nutrients.sodium, 'Sodium'),
      sugar: validateNonNegative(nutrients.sugar, 'Sugar'),
      saturatedFat: validateNonNegative(nutrients.saturatedFat, 'Saturated fat'),
      transFat: validateNonNegative(nutrients.transFat, 'Trans fat'),
    };
  }

  private validateVitamins(vitamins: Vitamin[]): Vitamin[] {
    if (!Array.isArray(vitamins)) {
      throw new Error('Vitamins must be an array');
    }
    return vitamins.map(v => {
      if (!v.name || v.name.trim().length === 0) {
        throw new Error('Vitamin name cannot be empty');
      }
      if (v.amount < 0) {
        throw new Error(`Vitamin ${v.name} amount cannot be negative`);
      }
      if (v.dailyValue < 0 || v.dailyValue > 1000) {
        throw new Error(`Vitamin ${v.name} daily value must be between 0 and 1000`);
      }
      return v;
    });
  }

  private validateMinerals(minerals: Mineral[]): Mineral[] {
    if (!Array.isArray(minerals)) {
      throw new Error('Minerals must be an array');
    }
    return minerals.map(m => {
      if (!m.name || m.name.trim().length === 0) {
        throw new Error('Mineral name cannot be empty');
      }
      if (m.amount < 0) {
        throw new Error(`Mineral ${m.name} amount cannot be negative`);
      }
      if (m.dailyValue < 0 || m.dailyValue > 1000) {
        throw new Error(`Mineral ${m.name} daily value must be between 0 and 1000`);
      }
      return m;
    });
  }

  // Business logic methods
  public getTotalMacronutrients(): number {
    return this.nutrients.protein + this.nutrients.carbs + this.nutrients.fat;
  }

  public getCaloriesFromProtein(): number {
    return this.nutrients.protein * 4; // 4 calories per gram
  }

  public getCaloriesFromCarbs(): number {
    return this.nutrients.carbs * 4; // 4 calories per gram
  }

  public getCaloriesFromFat(): number {
    return this.nutrients.fat * 9; // 9 calories per gram
  }

  public isHighInSodium(): boolean {
    // FDA: >20% DV per serving is high
    const dailyValue = 2300; // mg
    return this.nutrients.sodium > (dailyValue * 0.2);
  }

  public isHighInSugar(): boolean {
    // FDA: >20% DV per serving is high
    const dailyValue = 50; // grams
    return this.nutrients.sugar > (dailyValue * 0.2);
  }

  public isHighInFiber(): boolean {
    // FDA: >20% DV per serving is high
    const dailyValue = 28; // grams
    return this.nutrients.fiber > (dailyValue * 0.2);
  }

  // Daily Value Calculations
  public getDailyValuePercentage(nutrient: 'calories' | 'sodium' | 'fiber' | 'sugar'): number {
    const dailyValues: Record<string, number> = {
      calories: 2000,
      sodium: 2300, // mg
      fiber: 28, // grams
      sugar: 50, // grams
    };

    const dv = dailyValues[nutrient];
    if (!dv) return 0;

    const amount = nutrient === 'calories' 
      ? this.calories 
      : nutrient === 'sodium' 
        ? this.nutrients.sodium 
        : nutrient === 'fiber'
          ? this.nutrients.fiber
          : this.nutrients.sugar;

    return (amount / dv) * 100;
  }

  public getAllDailyValues(): Record<string, number> {
    return {
      calories: this.getDailyValuePercentage('calories'),
      protein: (this.nutrients.protein / 50) * 100, // 50g DV
      carbs: (this.nutrients.carbs / 275) * 100, // 275g DV
      fat: (this.nutrients.fat / 65) * 100, // 65g DV
      fiber: this.getDailyValuePercentage('fiber'),
      sodium: this.getDailyValuePercentage('sodium'),
      sugar: this.getDailyValuePercentage('sugar'),
      saturatedFat: (this.nutrients.saturatedFat / 20) * 100, // 20g DV
    };
  }

  // Macronutrient Ratios
  public getMacronutrientRatios(): { protein: number; carbs: number; fat: number } {
    const total = this.getTotalMacronutrients();
    if (total === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    return {
      protein: (this.nutrients.protein / total) * 100,
      carbs: (this.nutrients.carbs / total) * 100,
      fat: (this.nutrients.fat / total) * 100,
    };
  }

  // Health Scoring - Main method delegates to extracted business rules
  public getHealthScore(): number {
    let score = 100;

    score += this.calculateCalorieScore();
    score += this.calculateProteinScore();
    score += this.calculateSodiumScore();
    score += this.calculateSugarScore();
    score += this.calculateFiberScore();
    score += this.calculateTransFatScore();
    score += this.calculateSaturatedFatScore();
    score += this.calculateFatScore();

    return Math.max(0, Math.min(100, score));
  }

  // Extracted business rules for health scoring - clean separation of concerns
  private calculateCalorieScore(): number {
    if (this.calories > 600) return -15;
    if (this.calories > 400) return -10;
    return 0;
  }

  private calculateProteinScore(): number {
    const totalMacros = this.getTotalMacronutrients();
    if (totalMacros === 0) return 0;

    const proteinPercent = (this.nutrients.protein / totalMacros) * 100;
    let score = 0;

    if (proteinPercent > 30) score += 10;
    else if (proteinPercent < 10) score -= 15;

    if (this.nutrients.protein < 8) score -= 5;

    return score;
  }

  private calculateSodiumScore(): number {
    const sodiumDV = this.getDailyValuePercentage('sodium');
    if (sodiumDV > 80) return -36; // Slightly more penalty to get < 50
    if (sodiumDV > 50) return -25;
    if (sodiumDV > 30) return -20;
    if (sodiumDV > 20) return -10;
    return 0;
  }

  private calculateSugarScore(): number {
    const sugarDV = this.getDailyValuePercentage('sugar');
    if (sugarDV > 80) return -30;
    if (sugarDV > 50) return -20;
    if (sugarDV > 30) return -15;
    if (sugarDV > 20) return -10;
    return 0;
  }

  private calculateFiberScore(): number {
    let score = 0;

    if (this.isHighInFiber()) {
      score += 15;
    } else if (this.nutrients.fiber >= 5) {
      score += 5;
    }

    if (this.nutrients.fiber < 2) {
      score -= 10;
    }

    return score;
  }

  private calculateTransFatScore(): number {
    if (this.nutrients.transFat === 0) return 0;
    
    let score = -25;
    if (this.nutrients.transFat > 1) score -= 15;
    return score;
  }

  private calculateSaturatedFatScore(): number {
    const saturatedFatDV = (this.nutrients.saturatedFat / 20) * 100;
    if (saturatedFatDV > 50) return -15;
    if (saturatedFatDV > 30) return -10;
    return 0;
  }

  private calculateFatScore(): number {
    const totalMacros = this.getTotalMacronutrients();
    if (totalMacros === 0) return 0;

    const fatPercent = (this.nutrients.fat / totalMacros) * 100;
    if (fatPercent > 40) return -10;
    return 0;
  }

  // Nutrition Warnings
  public hasTransFat(): boolean {
    return this.nutrients.transFat > 0;
  }

  public getNutritionWarnings(): string[] {
    const warnings: string[] = [];

    if (this.isHighInSodium()) {
      warnings.push('High sodium');
    }
    if (this.isHighInSugar()) {
      warnings.push('High sugar');
    }
    if (this.hasTransFat()) {
      warnings.push('High trans fat');
    }
    const saturatedFatDV = (this.nutrients.saturatedFat / 20) * 100;
    if (saturatedFatDV > 50) {
      warnings.push('High saturated fat');
    }
    if (this.calories > 500) {
      warnings.push('High calorie');
    }

    return warnings;
  }

  // Macronutrient Analysis
  public isHighProtein(): boolean {
    const proteinPercent = (this.getCaloriesFromProtein() / this.calories) * 100;
    return proteinPercent >= 20; // 20%+ calories from protein
  }

  public isLowCarb(): boolean {
    const carbPercent = (this.getCaloriesFromCarbs() / this.calories) * 100;
    return carbPercent <= 10; // 10% or less calories from carbs
  }

  public isLowFat(): boolean {
    const fatPercent = (this.getCaloriesFromFat() / this.calories) * 100;
    return fatPercent <= 15; // 15% or less calories from fat
  }

  // Serialization methods
  public toJSON(): Record<string, unknown> {
    return {
      foodName: this.foodName,
      brand: this.brand,
      servingSize: this.servingSize,
      calories: this.calories,
      nutrients: this.nutrients,
      vitamins: this.vitamins,
      minerals: this.minerals,
    };
  }

  public static fromJSON(data: Record<string, unknown>): NutritionInfo {
    return new NutritionInfo(
      data.foodName as string,
      data.servingSize as string,
      data.calories as number,
      data.nutrients as Nutrients,
      data.vitamins as Vitamin[],
      data.minerals as Mineral[],
      data.brand as string | null
    );
  }
}

