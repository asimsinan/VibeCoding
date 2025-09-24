/**
 * API Types and Interfaces
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Contract Tests (RED phase - should fail)
 */

import { Request, Response } from 'express';
import { Recipe } from '../../lib/entities/Recipe';
import { Ingredient } from '../../lib/entities/Ingredient';

// Request/Response Types
export interface SearchRecipesRequest {
  ingredients: string[];
  limit?: number;
  offset?: number;
}

export interface SearchRecipesResponse {
  recipes: readonly Recipe[];
  totalCount: number;
  hasMore: boolean;
}

export interface GetRecipeRequest {
  id: string;
}

export interface GetRecipeResponse {
  recipe: Recipe | null;
}

export interface GetIngredientSuggestionsRequest {
  query: string;
  limit?: number;
}

export interface GetIngredientSuggestionsResponse {
  ingredients: Ingredient[];
}

export interface GetPopularRecipesRequest {
  limit?: number;
}

export interface GetPopularRecipesResponse {
  recipes: Recipe[];
}

// Error Response Types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// API Controller Interfaces
export interface RecipeController {
  searchRecipes(req: Request, res: Response): Promise<void>;
  getRecipe(req: Request, res: Response): Promise<void>;
  getPopularRecipes(req: Request, res: Response): Promise<void>;
}

export interface IngredientController {
  getSuggestions(req: Request, res: Response): Promise<void>;
}

// Middleware Interfaces
export interface ValidationMiddleware {
  validateSearchRecipes(req: Request, res: Response, next: Function): void;
  validateGetRecipe(req: Request, res: Response, next: Function): void;
  validateGetIngredientSuggestions(req: Request, res: Response, next: Function): void;
  validateGetPopularRecipes(req: Request, res: Response, next: Function): void;
}

export interface ErrorMiddleware {
  handleError(error: Error, req: Request, res: Response, next: Function): void;
  handleNotFound(req: Request, res: Response, next: Function): void;
}

export interface SecurityMiddleware {
  setupSecurity(req: Request, res: Response, next: Function): void;
  rateLimit(req: Request, res: Response, next: Function): void;
}

// API Response Helpers
export interface ApiResponse {
  success<T>(data: T, statusCode?: number): void;
  error(error: ApiError): void;
  validationError(errors: string[]): void;
}
