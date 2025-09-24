/**
 * Ingredient entity contract
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

export interface Ingredient {
  readonly name: string;
  readonly normalizedName: string;
  readonly category: string;
  readonly variations: readonly string[];
  readonly synonyms: readonly string[];
}

export interface IngredientValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IngredientContract {
  validate(ingredient: Ingredient): IngredientValidationResult;
  normalize(name: string): string;
  create(
    name: string,
    category: string,
    variations?: string[],
    synonyms?: string[]
  ): Ingredient;
  findMatches(query: string, ingredients: Ingredient[]): Ingredient[];
}
