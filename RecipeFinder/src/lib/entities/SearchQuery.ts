/**
 * SearchQuery entity contract
 * Traces to FR-001: System MUST provide an ingredient input interface
 * Traces to FR-006: System MUST provide real-time search results
 */

export interface SearchQuery {
  readonly ingredients: readonly string[];
  readonly limit: number;
  readonly offset: number;
}

export interface SearchQueryValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SearchQueryContract {
  validate(query: SearchQuery): SearchQueryValidationResult;
  create(ingredients: string[], limit?: number, offset?: number): SearchQuery;
  sanitizeIngredients(ingredients: string[]): string[];
}
