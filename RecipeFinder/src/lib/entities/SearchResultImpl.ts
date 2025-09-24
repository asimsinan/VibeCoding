/**
 * SearchResult entity implementation
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-005: System MUST display search results in a user-friendly format
 */

import { SearchResult, SearchResultContract, SearchResultValidationResult } from './SearchResult';
import { Recipe } from './Recipe';

export class SearchResultImpl implements SearchResultContract {
  validate(result: SearchResult): SearchResultValidationResult {
    const errors: string[] = [];

    // Validate total count
    if (result.totalCount < 0) {
      errors.push('Total count must be non-negative');
    }

    // Validate hasMore consistency
    if (result.hasMore && result.recipes.length >= result.totalCount) {
      errors.push('HasMore flag is inconsistent with total count');
    }

    // Validate recipes array
    if (!Array.isArray(result.recipes)) {
      errors.push('Recipes must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  create(
    recipes: Recipe[],
    totalCount: number,
    hasMore: boolean
  ): SearchResult {
    const result: SearchResult = {
      recipes: Object.freeze([...recipes]),
      totalCount,
      hasMore
    };

    const validation = this.validate(result);
    if (!validation.isValid) {
      throw new Error(`Invalid search result: ${validation.errors.join(', ')}`);
    }

    return result;
  }

  sortByRelevance(results: SearchResult): SearchResult {
    const sortedRecipes = [...results.recipes].sort((a, b) => {
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      return scoreB - scoreA; // Higher scores first
    });

    return {
      ...results,
      recipes: Object.freeze(sortedRecipes)
    };
  }
}
