/**
 * Validation Middleware Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationMiddleware as IValidationMiddleware } from '../types/ApiTypes';

export class ValidationMiddleware implements IValidationMiddleware {
  validateSearchRecipes(req: Request, res: Response, next: NextFunction): void {
    try {
      let { ingredients, limit, offset } = req.body;

      // Handle ingredients - convert string to array if needed
      if (typeof ingredients === 'string') {
        ingredients = ingredients.split(',').map(ingredient => ingredient.trim()).filter(ingredient => ingredient.length > 0);
      }

      // Validate ingredients
      if (!Array.isArray(ingredients)) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Ingredients must be an array or comma-separated string',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (ingredients.length === 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Ingredients array cannot be empty',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate each ingredient is a string
      for (const ingredient of ingredients) {
        if (typeof ingredient !== 'string' || ingredient.trim() === '') {
          res.status(400).json({
            error: 'ValidationError',
            message: 'All ingredients must be non-empty strings',
            statusCode: 400,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      // Update the request body with the converted ingredients array
      req.body.ingredients = ingredients;

      // Validate limit if provided
      if (limit !== undefined) {
        if (typeof limit !== 'number' || limit < 1 || limit > 100) {
          res.status(400).json({
            error: 'ValidationError',
            message: 'Limit must be between 1 and 100',
            statusCode: 400,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      // Validate offset if provided
      if (offset !== undefined) {
        if (typeof offset !== 'number' || offset < 0) {
          res.status(400).json({
            error: 'ValidationError',
            message: 'Offset must be a non-negative number',
            statusCode: 400,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request format',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
  }

  validateGetRecipe(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim() === '') {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Recipe ID is required and must be a non-empty string',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate ID format (alphanumeric with hyphens)
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Recipe ID contains invalid characters',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request format',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
  }

  validateGetIngredientSuggestions(req: Request, res: Response, next: NextFunction): void {
    try {
      const { query, limit } = req.query;

      if (!query || typeof query !== 'string' || query.trim() === '') {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Query parameter is required and must be a non-empty string',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Reject numeric-only queries as ingredient names should be text
      if (/^\d+$/.test(query.trim())) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Query parameter must contain text, not just numbers',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Validate limit if provided
      if (limit !== undefined) {
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
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request format',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
  }

  validateGetPopularRecipes(req: Request, res: Response, next: NextFunction): void {
    try {
      const { limit } = req.query;

      // Validate limit if provided
      if (limit !== undefined) {
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
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request format',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
  }
}
