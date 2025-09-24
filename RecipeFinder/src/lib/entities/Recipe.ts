/**
 * Recipe entity contract
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-003: Users MUST be able to view detailed recipe information
 */

export interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly image?: string;
  readonly cookingTime: number; // in minutes
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly ingredients: readonly string[];
  readonly instructions: readonly string[];
  readonly matchScore?: number; // 0-1, calculated during search
}

export interface RecipeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RecipeContract {
  validate(recipe: Recipe): RecipeValidationResult;
  create(
    id: string,
    title: string,
    description: string,
    cookingTime: number,
    difficulty: 'easy' | 'medium' | 'hard',
    ingredients: string[],
    instructions: string[],
    image?: string
  ): Recipe;
}
