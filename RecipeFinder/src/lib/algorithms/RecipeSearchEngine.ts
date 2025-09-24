/**
 * Recipe search engine interface
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 * Traces to FR-005: System MUST display search results in a user-friendly format
 */

import { Recipe } from '../entities/Recipe';
import { SearchQuery } from '../entities/SearchQuery';
import { SearchResult } from '../entities/SearchResult';

export interface RecipeSearchEngine {
  searchRecipes(query: SearchQuery): Promise<SearchResult>;
  calculateMatchScore(recipe: Recipe, searchIngredients: string[]): number;
  rankRecipes(recipes: Recipe[], searchIngredients: string[]): Recipe[];
}

export interface RecipeSearchEngineContract {
  validateSearchQuery(query: SearchQuery): boolean;
  normalizeIngredients(ingredients: string[]): string[];
  findMatchingRecipes(recipes: Recipe[], searchIngredients: string[]): Recipe[];
  calculateRelevanceScore(recipe: Recipe, searchIngredients: string[]): number;
}
