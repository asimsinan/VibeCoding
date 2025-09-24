/**
 * Recipe Routes Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Router } from 'express';
import { RecipeController } from '../controllers/RecipeController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { SQLiteDatabase } from '../../lib/database/SQLiteDatabase';

export function createRecipeRoutes(database: SQLiteDatabase): Router {
  const router = Router();
  const recipeController = new RecipeController(database);
  const validationMiddleware = new ValidationMiddleware();

  // Search recipes endpoint
  router.post('/search', 
    validationMiddleware.validateSearchRecipes.bind(validationMiddleware),
    recipeController.searchRecipes.bind(recipeController)
  );

  // Get popular recipes endpoint (must come before /:id route)
  router.get('/popular',
    validationMiddleware.validateGetPopularRecipes.bind(validationMiddleware),
    recipeController.getPopularRecipes.bind(recipeController)
  );

  // Get recipe by ID endpoint
  router.get('/:id',
    validationMiddleware.validateGetRecipe.bind(validationMiddleware),
    recipeController.getRecipe.bind(recipeController)
  );

  return router;
}
