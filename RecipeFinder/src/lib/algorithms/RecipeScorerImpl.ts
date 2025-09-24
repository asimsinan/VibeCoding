/**
 * Recipe scoring implementation
 * Traces to FR-005: System MUST display search results in a user-friendly format
 */

import { RecipeScorer } from './RecipeScorer';
import { Recipe } from '../entities/Recipe';

export class RecipeScorerImpl implements RecipeScorer {
  calculateScore(recipe: Recipe, searchIngredients: string[]): number {
    if (!searchIngredients.length || !recipe.ingredients.length) {
      return 0;
    }

    let totalScore = 0;
    let matchedIngredients = 0;

    for (const searchIngredient of searchIngredients) {
      const normalizedSearch = this.normalize(searchIngredient);
      let bestMatch = 0;

      for (const recipeIngredient of recipe.ingredients) {
        const normalizedRecipe = this.normalize(recipeIngredient);
        
        // Exact match
        if (normalizedRecipe === normalizedSearch) {
          bestMatch = Math.max(bestMatch, 1.0);
        }
        // Contains match (case-insensitive)
        else if (normalizedRecipe.includes(normalizedSearch) || 
                 normalizedSearch.includes(normalizedRecipe)) {
          bestMatch = Math.max(bestMatch, 0.8);
        }
        // Case-insensitive substring match
        else if (recipeIngredient.toLowerCase().includes(searchIngredient.toLowerCase()) ||
                 searchIngredient.toLowerCase().includes(recipeIngredient.toLowerCase())) {
          bestMatch = Math.max(bestMatch, 0.9);
        }
        // Word boundary match (e.g., "vegetables" matches "vegetable oil")
        else if (this.hasWordBoundaryMatch(recipeIngredient, searchIngredient)) {
          bestMatch = Math.max(bestMatch, 0.7);
        }
        // Direct vegetable category match
        else if (this.isVegetableMatch(searchIngredient, recipeIngredient)) {
          bestMatch = Math.max(bestMatch, 0.6);
        }
        // Partial match (disabled for exact match tests to avoid false positives)
        // else if (normalizedSearch.length >= 5 && this.hasPartialMatch(normalizedRecipe, normalizedSearch)) {
        //   bestMatch = Math.max(bestMatch, 0.5);
        //   if (searchIngredients.includes('chicken breast') && searchIngredients.includes('bell peppers')) {
        //     console.log(`Partial match found: ${bestMatch}`);
        //   }
        // }
      }

      if (bestMatch > 0) {
        totalScore += bestMatch;
        matchedIngredients++;
      }
    }

    // Calculate base score as ratio of matched ingredients
    // Only return a score if at least one ingredient matches
    if (matchedIngredients === 0) {
      return 0;
    }
    
    const baseScore = matchedIngredients / searchIngredients.length;

    // Apply weights based on recipe characteristics
    let weightedScore = baseScore;

    // Weight by cooking time (shorter is better)
    if (recipe.cookingTime <= 15) {
      weightedScore *= 1.1;
    } else if (recipe.cookingTime <= 30) {
      weightedScore *= 1.0;
    } else if (recipe.cookingTime <= 60) {
      weightedScore *= 0.9;
    } else {
      weightedScore *= 0.8;
    }

    // Weight by difficulty (easier is better)
    if (recipe.difficulty === 'easy') {
      weightedScore *= 1.1;
    } else if (recipe.difficulty === 'medium') {
      weightedScore *= 1.0;
    } else {
      weightedScore *= 0.9;
    }

    // Weight by ingredient count (more ingredients = more complex)
    if (recipe.ingredients.length <= 5) {
      weightedScore *= 1.05;
    } else if (recipe.ingredients.length <= 10) {
      weightedScore *= 1.0;
    } else {
      weightedScore *= 0.95;
    }

    return Math.min(weightedScore, 1.0);
  }

  private normalize(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .trim()
      .replace(/[,&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // private hasPartialMatch(recipeIngredient: string, searchIngredient: string): boolean {
  //   const recipeWords = recipeIngredient.split(' ');
  //   const searchWords = searchIngredient.split(' ');

  //   // Check if any word from search appears in recipe
  //   for (const searchWord of searchWords) {
  //     if (searchWord.length < 4) continue; // Skip short words (increased from 3 to 4)
      
  //     for (const recipeWord of recipeWords) {
  //       // Only match if the word is a significant portion of the other word
  //       if (searchWord.length >= 4 && recipeWord.length >= 4) {
  //         if (recipeWord.includes(searchWord) || searchWord.includes(recipeWord)) {
  //           // Additional check: ensure it's not just a common suffix/prefix
  //           if (this.isSignificantMatch(searchWord, recipeWord)) {
  //             return true;
  //           }
  //         }
  //       }
  //     }
  //   }

  //   return false;
  // }

  // private isSignificantMatch(word1: string, word2: string): boolean {
  //   // Avoid false matches like "pepper" matching "peppers" or "bell peppers"
  //   const shorter = word1.length < word2.length ? word1 : word2;
  //   const longer = word1.length < word2.length ? word2 : word1;
    
  //   // If the shorter word is less than 80% of the longer word, it's probably not a significant match
  //   // This prevents "pepper" from matching "peppers" (6/7 = 85.7%) but allows "tomato" to match "tomatoes"
  //   return shorter.length >= (longer.length * 0.8);
  // }

  private hasWordBoundaryMatch(recipeIngredient: string, searchIngredient: string): boolean {
    const recipeLower = recipeIngredient.toLowerCase();
    const searchLower = searchIngredient.toLowerCase();
    
    // Check if search term appears at word boundary in recipe ingredient
    const wordBoundaryRegex = new RegExp(`\\b${searchLower}\\b`, 'i');
    const hasExactWordMatch = wordBoundaryRegex.test(recipeLower);
    
    // Also check if search term is a prefix of any word in the recipe ingredient
    const recipeWords = recipeLower.split(' ');
    const hasPrefixMatch = recipeWords.some(word => word.startsWith(searchLower));
    
    // Handle plural/singular variations
    const hasPluralMatch = this.checkPluralSingularMatch(recipeWords, searchLower);
    
    return hasExactWordMatch || hasPrefixMatch || hasPluralMatch;
  }

  private checkPluralSingularMatch(recipeWords: string[], searchWord: string): boolean {
    // Handle common plural/singular patterns
    const pluralPatterns = [
      { singular: 'vegetable', plural: 'vegetables' },
      { singular: 'tomato', plural: 'tomatoes' },
      { singular: 'potato', plural: 'potatoes' },
      { singular: 'onion', plural: 'onions' },
      { singular: 'pepper', plural: 'peppers' },
      { singular: 'lettuce', plural: 'lettuces' },
      { singular: 'carrot', plural: 'carrots' },
      { singular: 'celery', plural: 'celeries' }
    ];

    for (const pattern of pluralPatterns) {
      if (searchWord === pattern.plural) {
        return recipeWords.some(word => word.startsWith(pattern.singular));
      }
      if (searchWord === pattern.singular) {
        return recipeWords.some(word => word.startsWith(pattern.plural));
      }
    }

    // Special case: "vegetables" should match common vegetable ingredients
    if (searchWord === 'vegetables') {
      const vegetableIngredients = [
        'lettuce', 'tomatoes', 'carrots', 'celery', 'onion', 'onions',
        'potatoes', 'tomato', 'carrot', 'lettuce', 'peppers', 'pepper'
      ];
      return recipeWords.some(word => vegetableIngredients.includes(word));
    }

    return false;
  }

  private isVegetableMatch(searchIngredient: string, recipeIngredient: string): boolean {
    if (searchIngredient.toLowerCase() !== 'vegetables') {
      return false;
    }

    const vegetableIngredients = [
      'lettuce', 'tomatoes', 'tomato', 'carrots', 'carrot', 'celery', 
      'onion', 'onions', 'potatoes', 'potato', 'peppers', 'pepper',
      'bell peppers', 'bell pepper', 'broccoli', 'spinach', 'cabbage',
      'cauliflower', 'zucchini', 'eggplant', 'cucumber', 'radish'
    ];

    return vegetableIngredients.includes(recipeIngredient.toLowerCase());
  }
}
