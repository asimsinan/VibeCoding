/**
 * Ingredient entity implementation
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

import { Ingredient, IngredientContract, IngredientValidationResult } from './Ingredient';

export class IngredientImpl implements IngredientContract {
  validate(ingredient: Ingredient): IngredientValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!ingredient.name || ingredient.name.trim() === '') {
      errors.push('Name cannot be empty');
    }

    if (!ingredient.normalizedName || ingredient.normalizedName.trim() === '') {
      errors.push('Normalized name cannot be empty');
    }

    if (!ingredient.category || ingredient.category.trim() === '') {
      errors.push('Category cannot be empty');
    }

    if (!Array.isArray(ingredient.variations)) {
      errors.push('Variations must be an array');
    }

    if (!Array.isArray(ingredient.synonyms)) {
      errors.push('Synonyms must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  normalize(name: string): string {
    if (!name) return '';

    let normalized = name
      .toLowerCase()
      .trim()
      // Remove parentheses and content, but keep the content as separate words
      .replace(/\(([^)]*)\)/g, ' $1 ')
      // Replace commas and ampersands with spaces
      .replace(/[,&]/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim();

    // Handle plurals (simple cases)
    if (normalized.endsWith('ies')) {
      normalized = normalized.slice(0, -3) + 'y';
    } else if (normalized.endsWith('ves')) {
      normalized = normalized.slice(0, -3) + 'f';
    } else if (normalized.endsWith('es') && normalized.length > 3) {
      normalized = normalized.slice(0, -2);
    } else if (normalized.endsWith('s') && normalized.length > 2) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  create(
    name: string,
    category: string,
    variations: string[] = [],
    synonyms: string[] = []
  ): Ingredient {
    const normalizedName = this.normalize(name);
    
    const ingredient: Ingredient = {
      name,
      normalizedName,
      category,
      variations: Object.freeze([...variations]),
      synonyms: Object.freeze([...synonyms])
    };

    const validation = this.validate(ingredient);
    if (!validation.isValid) {
      throw new Error(`Invalid ingredient: ${validation.errors.join(', ')}`);
    }

    return ingredient;
  }

  findMatches(query: string, ingredients: Ingredient[]): Ingredient[] {
    if (!query || !ingredients.length) return [];

    const normalizedQuery = this.normalize(query);
    const matches: Array<Ingredient & { matchScore: number }> = [];

    for (const ingredient of ingredients) {
      let score = 0;

      // Exact match on normalized name
      if (ingredient.normalizedName === normalizedQuery) {
        score = 1.0;
      }
      // Exact match on original name
      else if (ingredient.name.toLowerCase() === query.toLowerCase()) {
        score = 0.95;
      }
      // Match in variations
      else if (ingredient.variations.some(variation => 
        this.normalize(variation) === normalizedQuery ||
        variation.toLowerCase() === query.toLowerCase()
      )) {
        score = 0.8;
      }
      // Match in synonyms
      else if (ingredient.synonyms.some(synonym => 
        this.normalize(synonym) === normalizedQuery ||
        synonym.toLowerCase() === query.toLowerCase()
      )) {
        score = 0.7;
      }
      // Partial match
      else if (ingredient.normalizedName.includes(normalizedQuery) ||
               normalizedQuery.includes(ingredient.normalizedName)) {
        score = 0.5;
      }

      if (score > 0) {
        matches.push({ ...ingredient, matchScore: score });
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
}
