/**
 * Recipe Controller Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Request, Response } from 'express';
import { RecipeController as IRecipeController, SearchRecipesResponse, GetRecipeResponse, GetPopularRecipesResponse } from '../types/ApiTypes';
import { RecipeSearchEngineImpl } from '../../lib/algorithms/RecipeSearchEngineImpl';
import { IngredientNormalizerImpl } from '../../lib/algorithms/IngredientNormalizerImpl';
import { FuzzyMatcherImpl } from '../../lib/algorithms/FuzzyMatcherImpl';
import { RecipeScorerImpl } from '../../lib/algorithms/RecipeScorerImpl';
import { SQLiteDatabase } from '../../lib/database/SQLiteDatabase';

export class RecipeController implements IRecipeController {
  private searchEngine: RecipeSearchEngineImpl;
  private database: SQLiteDatabase;

  constructor(database: SQLiteDatabase) {
    this.database = database;
    
    // Initialize search engine with dependencies
    const normalizer = new IngredientNormalizerImpl();
    const fuzzyMatcher = new FuzzyMatcherImpl();
    const recipeScorer = new RecipeScorerImpl();
    this.searchEngine = new RecipeSearchEngineImpl(database, normalizer, fuzzyMatcher, recipeScorer);
  }

  async searchRecipes(req: Request, res: Response): Promise<void> {
    try {
      const { ingredients, limit = 10, offset = 0 } = req.body;

      // Validate ingredients
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Ingredients must be a non-empty array',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate limit
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Limit must be between 1 and 100',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate offset
      if (typeof offset !== 'number' || offset < 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Offset must be a non-negative number',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Search recipes
      const result = await this.searchEngine.searchRecipes({
        ingredients,
        limit,
        offset
      });

      const response: SearchRecipesResponse = {
        recipes: result.recipes,
        totalCount: result.totalCount,
        hasMore: result.hasMore
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in searchRecipes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to search recipes',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getRecipe(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate recipe ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Recipe ID is required',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Get recipe from database
      const recipe = await this.database.getRecipeById(id);

      if (!recipe) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Recipe not found',
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const response: GetRecipeResponse = {
        recipe
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getRecipe:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get recipe',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getPopularRecipes(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      // Validate limit
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Limit must be between 1 and 100',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Get all recipes (for now, we'll implement popularity logic later)
      const allRecipes = await this.database.getAllRecipes();
      
      // Sort by cooking time (shorter = more popular for now)
      const popularRecipes = allRecipes
        .sort((a, b) => a.cookingTime - b.cookingTime)
        .slice(0, limitNum);

      const response: GetPopularRecipesResponse = {
        recipes: popularRecipes
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getPopularRecipes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get popular recipes',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }
}
