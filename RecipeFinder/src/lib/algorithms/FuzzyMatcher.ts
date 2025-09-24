/**
 * Fuzzy matching interface
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

import { Ingredient } from '../entities/Ingredient';

export interface FuzzyMatcher {
  findMatches(query: string, ingredients: Ingredient[]): Array<Ingredient & { matchScore: number }>;
}
