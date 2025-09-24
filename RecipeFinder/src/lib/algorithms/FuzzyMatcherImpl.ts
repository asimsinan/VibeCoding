/**
 * Fuzzy matching implementation
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

import { FuzzyMatcher } from './FuzzyMatcher';
import { Ingredient } from '../entities/Ingredient';

export class FuzzyMatcherImpl implements FuzzyMatcher {
  findMatches(query: string, ingredients: Ingredient[]): Array<Ingredient & { matchScore: number }> {
    if (!query || !ingredients.length) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const matches: Array<Ingredient & { matchScore: number }> = [];

    for (const ingredient of ingredients) {
      let score = 0;

      // Exact match on normalized name
      if (ingredient.normalizedName === normalizedQuery) {
        score = 1.0;
      }
      // Exact match on original name
      else if (ingredient.name.toLowerCase() === normalizedQuery) {
        score = 0.95;
      }
      // Match in variations
      else if (ingredient.variations.some(variation => 
        variation.toLowerCase() === normalizedQuery ||
        this.normalize(variation) === normalizedQuery
      )) {
        score = 0.8;
      }
      // Match in synonyms
      else if (ingredient.synonyms.some(synonym => 
        synonym.toLowerCase() === normalizedQuery ||
        this.normalize(synonym) === normalizedQuery
      )) {
        score = 0.7;
      }
      // Partial match on normalized name
      else if (ingredient.normalizedName.includes(normalizedQuery) ||
               normalizedQuery.includes(ingredient.normalizedName)) {
        score = 0.5;
      }
      // Fuzzy match using Levenshtein distance
      else {
        const distance = this.levenshteinDistance(normalizedQuery, ingredient.normalizedName);
        const maxLength = Math.max(normalizedQuery.length, ingredient.normalizedName.length);
        if (distance <= 2 && maxLength > 0) {
          score = 0.3 * (1 - distance / maxLength);
        }
        // Also check variations and synonyms for fuzzy matching
        for (const variation of ingredient.variations) {
          const variationDistance = this.levenshteinDistance(normalizedQuery, this.normalize(variation));
          const variationMaxLength = Math.max(normalizedQuery.length, this.normalize(variation).length);
          if (variationDistance <= 2 && variationMaxLength > 0) {
            score = Math.max(score, 0.2 * (1 - variationDistance / variationMaxLength));
          }
        }
      }

      if (score > 0) {
        matches.push({ ...ingredient, matchScore: score });
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[,&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1, // substitution
            matrix[i]![j - 1]! + 1,     // insertion
            matrix[i - 1]![j]! + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }
}
