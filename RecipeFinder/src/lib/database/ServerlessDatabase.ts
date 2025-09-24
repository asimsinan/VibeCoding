/**
 * Serverless Database Implementation
 * Uses in-memory storage for Vercel serverless functions
 */

import { Database } from './Database';
import { Recipe } from '../entities/Recipe';
import { Ingredient } from '../entities/Ingredient';
import { SampleDataLoader } from './SampleDataLoader';

export class ServerlessDatabase implements Database {
  private recipes: Recipe[] = [];
  private ingredients: Ingredient[] = [];
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load sample data
    this.recipes = SampleDataLoader.getSampleRecipes();
    this.ingredients = SampleDataLoader.getSampleIngredients();
    
    this.initialized = true;
    console.log(`✅ Serverless database initialized with ${this.recipes.length} recipes and ${this.ingredients.length} ingredients`);
  }

  async close(): Promise<void> {
    // No-op for in-memory database
    this.initialized = false;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    await this.ensureInitialized();
    return [...this.recipes];
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    await this.ensureInitialized();
    return this.recipes.find(recipe => recipe.id === id) || null;
  }

  async searchRecipesByIngredients(searchIngredients: string[]): Promise<Recipe[]> {
    await this.ensureInitialized();
    
    return this.recipes.filter(recipe => {
      // Simple matching: recipe must contain at least one of the search ingredients
      return searchIngredients.some(searchIngredient =>
        recipe.ingredients.some(recipeIngredient =>
          recipeIngredient.toLowerCase().includes(searchIngredient.toLowerCase())
        )
      );
    });
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    await this.ensureInitialized();
    return [...this.ingredients];
  }

  async getIngredientByName(name: string): Promise<Ingredient | null> {
    await this.ensureInitialized();
    return this.ingredients.find(ingredient => 
      ingredient.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    await this.ensureInitialized();
    
    const lowercaseQuery = query.toLowerCase();
    return this.ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(lowercaseQuery) ||
      ingredient.normalizedName.toLowerCase().includes(lowercaseQuery) ||
      ingredient.synonyms.some(synonym => synonym.toLowerCase().includes(lowercaseQuery))
    );
  }

  async insertRecipe(recipe: Recipe): Promise<void> {
    await this.ensureInitialized();
    this.validateRecipe(recipe);
    
    // Check if recipe already exists
    const existingIndex = this.recipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      this.recipes[existingIndex] = recipe;
    } else {
      this.recipes.push(recipe);
    }
  }

  async insertIngredient(ingredient: Ingredient): Promise<void> {
    await this.ensureInitialized();
    this.validateIngredient(ingredient);
    
    // Check if ingredient already exists
    const existingIndex = this.ingredients.findIndex(i => i.name === ingredient.name);
    if (existingIndex >= 0) {
      this.ingredients[existingIndex] = ingredient;
    } else {
      this.ingredients.push(ingredient);
    }
  }

  async clearAllData(): Promise<void> {
    this.recipes = [];
    this.ingredients = [];
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private validateRecipe(recipe: Recipe): void {
    if (!recipe.id || typeof recipe.id !== 'string' || recipe.id.trim() === '') {
      throw new Error('Recipe ID is required and must be a non-empty string');
    }
    
    if (!recipe.title || typeof recipe.title !== 'string' || recipe.title.trim() === '') {
      throw new Error('Recipe title is required and must be a non-empty string');
    }
    
    if (!recipe.description || typeof recipe.description !== 'string' || recipe.description.trim() === '') {
      throw new Error('Recipe description is required and must be a non-empty string');
    }
    
    if (typeof recipe.cookingTime !== 'number' || recipe.cookingTime < 0) {
      throw new Error('Cooking time must be a non-negative number');
    }
    
    if (!recipe.difficulty || typeof recipe.difficulty !== 'string' || !['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
      throw new Error('Difficulty must be one of: easy, medium, hard');
    }
    
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      throw new Error('Ingredients must be a non-empty array');
    }
    
    if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
      throw new Error('Instructions must be a non-empty array');
    }
    
    // Validate each ingredient is a string
    for (const ingredient of recipe.ingredients) {
      if (typeof ingredient !== 'string' || ingredient.trim() === '') {
        throw new Error('All ingredients must be non-empty strings');
      }
    }
    
    // Validate each instruction is a string
    for (const instruction of recipe.instructions) {
      if (typeof instruction !== 'string' || instruction.trim() === '') {
        throw new Error('All instructions must be non-empty strings');
      }
    }
  }

  private validateIngredient(ingredient: Ingredient): void {
    if (!ingredient.name || typeof ingredient.name !== 'string' || ingredient.name.trim() === '') {
      throw new Error('Ingredient name is required and must be a non-empty string');
    }
    
    if (!ingredient.normalizedName || typeof ingredient.normalizedName !== 'string' || ingredient.normalizedName.trim() === '') {
      throw new Error('Normalized name is required and must be a non-empty string');
    }
    
    if (!ingredient.category || typeof ingredient.category !== 'string' || ingredient.category.trim() === '') {
      throw new Error('Category is required and must be a non-empty string');
    }
    
    if (!Array.isArray(ingredient.variations)) {
      throw new Error('Variations must be an array');
    }
    
    if (!Array.isArray(ingredient.synonyms)) {
      throw new Error('Synonyms must be an array');
    }
    
    // Validate each variation is a string
    for (const variation of ingredient.variations) {
      if (typeof variation !== 'string') {
        throw new Error('All variations must be strings');
      }
    }
    
    // Validate each synonym is a string
    for (const synonym of ingredient.synonyms) {
      if (typeof synonym !== 'string') {
        throw new Error('All synonyms must be strings');
      }
    }
  }
}
