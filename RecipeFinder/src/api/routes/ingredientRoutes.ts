/**
 * Ingredient Routes Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Router } from 'express';
import { IngredientController } from '../controllers/IngredientController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { SQLiteDatabase } from '../../lib/database/SQLiteDatabase';

export function createIngredientRoutes(database: SQLiteDatabase): Router {
  const router = Router();
  const ingredientController = new IngredientController(database);
  const validationMiddleware = new ValidationMiddleware();

  // Get ingredient suggestions endpoint
  router.get('/suggestions',
    validationMiddleware.validateGetIngredientSuggestions.bind(validationMiddleware),
    ingredientController.getSuggestions.bind(ingredientController)
  );

  return router;
}
