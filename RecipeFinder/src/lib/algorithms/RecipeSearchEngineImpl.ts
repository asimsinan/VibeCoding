/**
 * Recipe search engine implementation
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-005: System MUST display search results in a user-friendly format
 * Traces to FR-006: System MUST provide real-time search results
 */

import { RecipeSearchEngine } from './RecipeSearchEngine';
import { Recipe } from '../entities/Recipe';
import { SearchQuery } from '../entities/SearchQuery';
import { SearchResult } from '../entities/SearchResult';
import { Database } from '../database/Database';
import { IngredientNormalizer } from './IngredientNormalizer';
import { FuzzyMatcher } from './FuzzyMatcher';
import { RecipeScorer } from './RecipeScorer';
import { Ingredient } from '../entities/Ingredient';

export class RecipeSearchEngineImpl implements RecipeSearchEngine {
  constructor(
    private database: Database,
    private normalizer: IngredientNormalizer,
    private fuzzyMatcher: FuzzyMatcher,
    private scorer: RecipeScorer
  ) {}

  async searchRecipes(query: SearchQuery): Promise<SearchResult> {
    try {
      // Handle empty search query gracefully
      if (!query.ingredients || query.ingredients.length === 0) {
        return {
          recipes: [],
          totalCount: 0,
          hasMore: false
        };
      }
      
      if (query.limit < 1 || query.limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }
      
      if (query.offset < 0) {
        throw new Error('Offset must be non-negative');
      }

      // Get all recipes from database
      const allRecipes = await this.database.getAllRecipes();
      
      if (allRecipes.length === 0) {
        return {
          recipes: [],
          totalCount: 0,
          hasMore: false
        };
      }

      // Score and filter recipes
      const scoredRecipes = allRecipes
        .map(recipe => {
          const score = this.calculateMatchScore(recipe, [...query.ingredients]);
          return { ...recipe, matchScore: score };
        })
        .filter(recipe => recipe.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      // Apply pagination
      const startIndex = query.offset;
      const endIndex = startIndex + query.limit;
      const paginatedRecipes = scoredRecipes.slice(startIndex, endIndex);
      
      // Create search result
      const result: SearchResult = {
        recipes: paginatedRecipes,
        totalCount: scoredRecipes.length,
        hasMore: endIndex < scoredRecipes.length
      };

      return result;
    } catch (error) {
      console.error('Error in searchRecipes:', error);
      throw new Error('Failed to search recipes');
    }
  }

  calculateMatchScore(recipe: Recipe, searchIngredients: string[]): number {
    if (!searchIngredients.length || !recipe.ingredients.length) {
      return 0;
    }

    // Use the recipe scorer to calculate the match score
    return this.scorer.calculateScore(recipe, searchIngredients);
  }

  async getIngredientSuggestions(partialIngredient: string): Promise<Ingredient[]> {
    try {
      if (!partialIngredient || partialIngredient.trim().length < 2) {
        return [];
      }

      const allIngredients = await this.database.getAllIngredients();
      const normalizedPartial = this.normalizer.normalize(partialIngredient);
      
      // Find matches using fuzzy matching
      const matches = this.fuzzyMatcher.findMatches(normalizedPartial, allIngredients);
      
      // Return top 10 matches
      return matches.slice(0, 10).map(match => ({
        name: match.name,
        normalizedName: match.normalizedName,
        category: match.category,
        variations: match.variations,
        synonyms: match.synonyms
      }));
    } catch (error) {
      console.error('Error in getIngredientSuggestions:', error);
      return [];
    }
  }

  async getPopularRecipes(limit: number = 10): Promise<Recipe[]> {
    try {
      const allRecipes = await this.database.getAllRecipes();
      
      // For now, return recipes sorted by cooking time (shorter = more popular)
      // In a real app, this would be based on actual usage data
      return allRecipes
        .sort((a, b) => a.cookingTime - b.cookingTime)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getPopularRecipes:', error);
      return [];
    }
  }

  rankRecipes(recipes: Recipe[], searchIngredients: string[]): Recipe[] {
    return recipes
      .map(recipe => {
        const score = this.calculateMatchScore(recipe, searchIngredients);
        return { ...recipe, matchScore: score };
      })
      .filter(recipe => recipe.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}
