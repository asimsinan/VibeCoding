/**
 * Ingredient normalization interface
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

export interface IngredientNormalizer {
  normalize(name: string): string;
}
