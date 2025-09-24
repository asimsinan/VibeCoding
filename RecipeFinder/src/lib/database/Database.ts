/**
 * Database interface for recipe and ingredient storage
 * Traces to FR-002: System MUST search through a recipe database
 */

import { Recipe } from '../entities/Recipe';
import { Ingredient } from '../entities/Ingredient';

export interface Database {
  initialize(): Promise<void>;
  close(): Promise<void>;
  
  // Recipe operations
  getAllRecipes(): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe | null>;
  searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]>;
  
  // Ingredient operations
  getAllIngredients(): Promise<Ingredient[]>;
  getIngredientByName(name: string): Promise<Ingredient | null>;
  searchIngredients(query: string): Promise<Ingredient[]>;
  
  // Data management
  insertRecipe(recipe: Recipe): Promise<void>;
  insertIngredient(ingredient: Ingredient): Promise<void>;
  clearAllData(): Promise<void>;
}
