/**
 * Ingredient normalization implementation
 * Traces to FR-004: System MUST handle ingredient matching with fuzzy search capabilities
 */

import { IngredientNormalizer } from './IngredientNormalizer';

export class IngredientNormalizerImpl implements IngredientNormalizer {
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

    // Handle common abbreviations
    const abbreviations: { [key: string]: string } = {
      'tbsp': 'tablespoon',
      'tsp': 'teaspoon',
      'oz': 'ounce',
      'lb': 'pound'
    };

    for (const [abbr, full] of Object.entries(abbreviations)) {
      normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }

    // Handle common cooking terms - only remove if they're not the main ingredient
    const cookingTerms = ['minced', 'diced', 'chopped', 'fresh', 'ground', 'boneless', 'skinless'];
    for (const term of cookingTerms) {
      // Only remove if it's not the only word left
      const words = normalized.split(' ');
      if (words.length > 1) {
        normalized = normalized.replace(new RegExp(`\\b${term}\\b`, 'g'), '');
      }
    }

    // Handle common descriptors - only remove if they're not the main ingredient
    const descriptors = ['extra virgin', 'cold pressed', 'organic', 'from italy'];
    for (const descriptor of descriptors) {
      const words = normalized.split(' ');
      if (words.length > 1) {
        normalized = normalized.replace(new RegExp(`\\b${descriptor}\\b`, 'g'), '');
      }
    }

    // Handle numbers and percentages
    normalized = normalized.replace(/\d+%?\s*/g, '');

    // Handle non-English characters
    normalized = normalized
      .replace(/[éèêë]/g, 'e')
      .replace(/[àáâãä]/g, 'a')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n');

    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }
}
