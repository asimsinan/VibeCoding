/**
 * Recipe entity implementation
 * Traces to FR-002: System MUST search through a recipe database and return recipes
 * Traces to FR-003: Users MUST be able to view detailed recipe information
 */

import { Recipe, RecipeContract, RecipeValidationResult } from './Recipe';

export class RecipeImpl implements RecipeContract {
  validate(recipe: Recipe): RecipeValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!recipe.id || recipe.id.trim() === '') {
      errors.push('Recipe ID is required');
    }

    if (!recipe.title || recipe.title.trim() === '') {
      errors.push('Recipe title is required');
    }

    if (!recipe.description || recipe.description.trim() === '') {
      errors.push('Recipe description is required');
    }

    if (!recipe.cookingTime || recipe.cookingTime <= 0) {
      errors.push('Cooking time must be positive');
    }

    if (!recipe.difficulty || !['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
      errors.push('Invalid difficulty level');
    }

    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      errors.push('Recipe must have at least one ingredient');
    }

    if (!recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
      errors.push('Recipe must have at least one instruction');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  create(
    id: string,
    title: string,
    description: string,
    cookingTime: number,
    difficulty: 'easy' | 'medium' | 'hard',
    ingredients: string[],
    instructions: string[],
    image?: string
  ): Recipe {
    const recipe: Recipe = {
      id,
      title,
      description,
      cookingTime,
      difficulty,
      ingredients: Object.freeze([...ingredients]),
      instructions: Object.freeze([...instructions]),
      ...(image && { image })
    };

    const validation = this.validate(recipe);
    if (!validation.isValid) {
      throw new Error(`Invalid recipe: ${validation.errors.join(', ')}`);
    }

    return recipe;
  }
}
