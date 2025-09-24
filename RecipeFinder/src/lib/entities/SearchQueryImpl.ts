/**
 * SearchQuery entity implementation
 * Traces to FR-001: System MUST provide an ingredient input interface
 * Traces to FR-006: System MUST provide real-time search results
 */

import { SearchQuery, SearchQueryContract, SearchQueryValidationResult } from './SearchQuery';

export class SearchQueryImpl implements SearchQueryContract {
  validate(query: SearchQuery): SearchQueryValidationResult {
    const errors: string[] = [];

    // Validate ingredients
    if (!query.ingredients || !Array.isArray(query.ingredients) || query.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    }

    // Validate limit
    if (query.limit < 1 || query.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    // Validate offset
    if (query.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  create(ingredients: string[], limit: number = 20, offset: number = 0): SearchQuery {
    const sanitizedIngredients = this.sanitizeIngredients(ingredients);
    
    const query: SearchQuery = {
      ingredients: Object.freeze(sanitizedIngredients),
      limit,
      offset
    };

    const validation = this.validate(query);
    if (!validation.isValid) {
      throw new Error(`Invalid search query: ${validation.errors.join(', ')}`);
    }

    return query;
  }

  sanitizeIngredients(ingredients: string[]): string[] {
    return ingredients
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0)
      .map(ingredient => 
        ingredient
          .toLowerCase()
          // Remove parentheses and content, but keep the content as separate words
          .replace(/\(([^)]*)\)/g, ' $1 ')
          // Replace commas and ampersands with spaces
          .replace(/[,&]/g, ' ')
          // Replace multiple spaces with single space
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(ingredient => ingredient.length > 0);
  }
}
