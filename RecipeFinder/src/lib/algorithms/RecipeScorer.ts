/**
 * Recipe scoring interface
 * Traces to FR-005: System MUST display search results in a user-friendly format
 */

import { Recipe } from '../entities/Recipe';

export interface RecipeScorer {
  calculateScore(recipe: Recipe, searchIngredients: string[]): number;
}
