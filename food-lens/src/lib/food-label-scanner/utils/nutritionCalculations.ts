/**
 * Nutrition Calculation Utilities
 * Shared calculation logic for nutrition business rules
 */

interface NutritionProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  saturatedFat: number;
  transFat: number;
}

interface Macronutrients {
  protein: number;
  carbs: number;
  fat: number;
}

// Daily Value constants (FDA standards)
const DAILY_VALUES = {
  calories: 2000,
  protein: 50, // grams
  carbs: 275, // grams
  fat: 65, // grams
  fiber: 28, // grams
  sodium: 2300, // milligrams
  sugar: 50, // grams
  saturatedFat: 20, // grams
};

/**
 * Calculate daily value percentage for a nutrient
 */
export function calculateDailyValue(amount: number, nutrient: keyof typeof DAILY_VALUES): number {
  const dv = DAILY_VALUES[nutrient];
  if (!dv || dv === 0) return 0;
  return (amount / dv) * 100;
}

/**
 * Calculate health score based on nutrition profile
 */
export function calculateHealthScore(profile: NutritionProfile): number {
  let score = 100;

  // Penalize high calories
  if (profile.calories > 600) score -= 20;
  else if (profile.calories > 400) score -= 10;

  // Reward protein
  const proteinPercent = (profile.protein / (profile.protein + profile.carbs + profile.fat)) * 100;
  if (proteinPercent > 30) score += 10;
  if (proteinPercent < 10) score -= 10;

  // Penalize high sodium
  const sodiumDV = calculateDailyValue(profile.sodium, 'sodium');
  if (sodiumDV > 50) score -= 15;
  else if (sodiumDV > 30) score -= 10;
  else if (sodiumDV > 20) score -= 5;

  // Penalize high sugar
  const sugarDV = calculateDailyValue(profile.sugar, 'sugar');
  if (sugarDV > 50) score -= 15;
  else if (sugarDV > 30) score -= 10;
  else if (sugarDV > 20) score -= 5;

  // Reward fiber
  const fiberDV = calculateDailyValue(profile.fiber, 'fiber');
  if (fiberDV > 50) score += 10;
  else if (fiberDV > 20) score += 5;
  if (profile.fiber < 2) score -= 5;

  // Heavy penalty for trans fat
  if (profile.transFat > 0) {
    score -= 20;
    if (profile.transFat > 1) score -= 10;
  }

  // Penalize high saturated fat
  const saturatedFatDV = calculateDailyValue(profile.saturatedFat, 'saturatedFat');
  if (saturatedFatDV > 50) score -= 10;
  else if (saturatedFatDV > 30) score -= 5;

  // Penalize high fat percentage
  const fatPercent = (profile.fat / (profile.protein + profile.carbs + profile.fat)) * 100;
  if (fatPercent > 40) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate macronutrient ratios
 */
export function calculateMacronutrientRatios(macros: Macronutrients): { protein: number; carbs: number; fat: number } {
  const total = macros.protein + macros.carbs + macros.fat;
  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: (macros.protein / total) * 100,
    carbs: (macros.carbs / total) * 100,
    fat: (macros.fat / total) * 100,
  };
}

/**
 * Calculate calories from macronutrients
 */
export function calculateCaloriesFromMacros(macros: Macronutrients): number {
  const proteinCalories = macros.protein * 4; // 4 cal/g
  const carbsCalories = macros.carbs * 4; // 4 cal/g
  const fatCalories = macros.fat * 9; // 9 cal/g

  return proteinCalories + carbsCalories + fatCalories;
}

/**
 * Calculate percentage of calories from each macronutrient
 */
export function calculateCaloriePercentages(
  macros: Macronutrients,
  totalCalories: number
): { protein: number; carbs: number; fat: number } {
  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  const proteinCalories = macros.protein * 4;
  const carbsCalories = macros.carbs * 4;
  const fatCalories = macros.fat * 9;

  return {
    protein: (proteinCalories / totalCalories) * 100,
    carbs: (carbsCalories / totalCalories) * 100,
    fat: (fatCalories / totalCalories) * 100,
  };
}

/**
 * Check if nutrition profile matches a specific diet type
 */
export function isCompatibleWithDiet(
  profile: Macronutrients & { calories: number },
  dietType: 'keto' | 'high-protein' | 'low-fat' | 'low-carb'
): boolean {
  const percentages = calculateCaloriePercentages(profile, profile.calories);

  switch (dietType) {
    case 'keto':
      // Keto: Very low carbs (<10%), high fat (>60%)
      return percentages.carbs <= 10 && percentages.fat >= 60;

    case 'high-protein':
      // High protein: >20% calories from protein
      return percentages.protein >= 20;

    case 'low-fat':
      // Low fat: <15% calories from fat
      return percentages.fat <= 15;

    case 'low-carb':
      // Low carb: <10% calories from carbs
      return percentages.carbs <= 10;

    default:
      return false;
  }
}

/**
 * Detect nutrition warnings based on profile
 */
export function detectNutritionWarnings(profile: Partial<NutritionProfile>): string[] {
  const warnings: string[] = [];

  // High sodium (>20% DV = 460mg)
  if (profile.sodium && profile.sodium > 460) {
    warnings.push('High sodium');
  }

  // High sugar (>20% DV = 10g)
  if (profile.sugar && profile.sugar > 10) {
    warnings.push('High sugar');
  }

  // Trans fat (any amount is concerning)
  if (profile.transFat && profile.transFat > 0) {
    warnings.push('Contains trans fat');
  }

  // High saturated fat (>50% DV = 10g)
  if (profile.saturatedFat && profile.saturatedFat > 10) {
    warnings.push('High saturated fat');
  }

  // High calories (>500 per serving)
  if (profile.calories && profile.calories > 500) {
    warnings.push('High calorie');
  }

  return warnings;
}

