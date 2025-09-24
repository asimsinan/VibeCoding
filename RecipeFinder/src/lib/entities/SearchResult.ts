/**
 * SearchResult entity contract
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-005: System MUST display search results in a user-friendly format
 */

export interface SearchResult {
  readonly recipes: readonly Recipe[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

export interface SearchResultValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SearchResultContract {
  validate(result: SearchResult): SearchResultValidationResult;
  create(
    recipes: Recipe[],
    totalCount: number,
    hasMore: boolean
  ): SearchResult;
  sortByRelevance(results: SearchResult): SearchResult;
}

// Re-export Recipe for convenience
import { Recipe } from './Recipe';
