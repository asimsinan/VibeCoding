/**
 * Ingredient Controller Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Request, Response } from 'express';
import { IngredientController as IIngredientController, GetIngredientSuggestionsResponse } from '../types/ApiTypes';
import { SQLiteDatabase } from '../../lib/database/SQLiteDatabase';
import { FuzzyMatcherImpl } from '../../lib/algorithms/FuzzyMatcherImpl';

export class IngredientController implements IIngredientController {
  private database: SQLiteDatabase;
  private fuzzyMatcher: FuzzyMatcherImpl;

  constructor(database: SQLiteDatabase) {
    this.database = database;
    this.fuzzyMatcher = new FuzzyMatcherImpl();
  }

  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 10 } = req.query;

      // Validate query
      if (!query || typeof query !== 'string' || query.trim() === '') {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Query parameter is required and must be a non-empty string',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

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

      // Get all ingredients from database
      const allIngredients = await this.database.getAllIngredients();

      // Find matching ingredients using fuzzy matching
      const matches = this.fuzzyMatcher.findMatches(query.trim(), allIngredients);

      // Sort by match score and limit results
      const suggestions = matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limitNum)
        .map(match => ({
          name: match.name,
          normalizedName: match.normalizedName,
          category: match.category,
          variations: match.variations,
          synonyms: match.synonyms
        }));

      const response: GetIngredientSuggestionsResponse = {
        ingredients: suggestions
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to get ingredient suggestions',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  }
}
