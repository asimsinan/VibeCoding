/**
 * SQLite implementation of Database interface
 * Traces to FR-002: System MUST search through a recipe database
 */

import * as sqlite3 from 'sqlite3';
import { Database } from './Database';
import { Recipe } from '../entities/Recipe';
import { Ingredient } from '../entities/Ingredient';

export class SQLiteDatabase implements Database {
  private db: sqlite3.Database | null = null;

  constructor(private dbPath: string = ':memory:') {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createRecipesTable = `
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image TEXT,
        cookingTime INTEGER NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        ingredients TEXT NOT NULL, -- JSON array
        instructions TEXT NOT NULL -- JSON array
      )
    `;

    const createIngredientsTable = `
      CREATE TABLE IF NOT EXISTS ingredients (
        name TEXT PRIMARY KEY,
        normalizedName TEXT NOT NULL,
        category TEXT NOT NULL,
        variations TEXT NOT NULL, -- JSON array
        synonyms TEXT NOT NULL -- JSON array
      )
    `;

    return new Promise((resolve, reject) => {
      this.db!.exec(createRecipesTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db!.exec(createIngredientsTable, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async getAllRecipes(): Promise<Recipe[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM recipes', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const recipes: Recipe[] = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            image: row.image,
            cookingTime: row.cookingTime,
            difficulty: row.difficulty,
            ingredients: JSON.parse(row.ingredients),
            instructions: JSON.parse(row.instructions)
          }));
          resolve(recipes);
        }
      });
    });
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const recipe: Recipe = {
            id: row.id,
            title: row.title,
            description: row.description,
            image: row.image,
            cookingTime: row.cookingTime,
            difficulty: row.difficulty,
            ingredients: JSON.parse(row.ingredients),
            instructions: JSON.parse(row.instructions)
          };
          resolve(recipe);
        }
      });
    });
  }

  async searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    if (!this.db) throw new Error('Database not initialized');

    // This is a simplified search - in real implementation, we'd use more sophisticated matching
    return new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM recipes', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const recipes: Recipe[] = rows
            .map(row => ({
              id: row.id,
              title: row.title,
              description: row.description,
              image: row.image,
              cookingTime: row.cookingTime,
              difficulty: row.difficulty,
              ingredients: JSON.parse(row.ingredients),
              instructions: JSON.parse(row.instructions)
            }))
            .filter(recipe => {
              // Simple matching: recipe must contain at least one of the search ingredients
              return ingredients.some(searchIngredient =>
                recipe.ingredients.some((recipeIngredient: string) =>
                  recipeIngredient.toLowerCase().includes(searchIngredient.toLowerCase())
                )
              );
            });
          resolve(recipes);
        }
      });
    });
  }

  async getAllIngredients(): Promise<Ingredient[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM ingredients', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const ingredients: Ingredient[] = rows.map(row => ({
            name: row.name,
            normalizedName: row.normalizedName,
            category: row.category,
            variations: JSON.parse(row.variations),
            synonyms: JSON.parse(row.synonyms)
          }));
          resolve(ingredients);
        }
      });
    });
  }

  async getIngredientByName(name: string): Promise<Ingredient | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get('SELECT * FROM ingredients WHERE name = ?', [name], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const ingredient: Ingredient = {
            name: row.name,
            normalizedName: row.normalizedName,
            category: row.category,
            variations: JSON.parse(row.variations),
            synonyms: JSON.parse(row.synonyms)
          };
          resolve(ingredient);
        }
      });
    });
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM ingredients WHERE name LIKE ? OR normalizedName LIKE ?',
        [`%${query}%`, `%${query}%`],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const ingredients: Ingredient[] = rows.map(row => ({
              name: row.name,
              normalizedName: row.normalizedName,
              category: row.category,
              variations: JSON.parse(row.variations),
              synonyms: JSON.parse(row.synonyms)
            }));
            resolve(ingredients);
          }
        }
      );
    });
  }

  async insertRecipe(recipe: Recipe): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate recipe data
    this.validateRecipe(recipe);

    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO recipes (id, title, description, image, cookingTime, difficulty, ingredients, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          recipe.id,
          recipe.title,
          recipe.description,
          recipe.image || null,
          recipe.cookingTime,
          recipe.difficulty,
          JSON.stringify(recipe.ingredients),
          JSON.stringify(recipe.instructions)
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async insertIngredient(ingredient: Ingredient): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate ingredient data
    this.validateIngredient(ingredient);

    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO ingredients (name, normalizedName, category, variations, synonyms) VALUES (?, ?, ?, ?, ?)',
        [
          ingredient.name,
          ingredient.normalizedName,
          ingredient.category,
          JSON.stringify(ingredient.variations),
          JSON.stringify(ingredient.synonyms)
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.exec('DELETE FROM recipes; DELETE FROM ingredients;', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
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
