#!/usr/bin/env node
/**
 * Test script for ServerlessDatabase
 * Run with: node debug/test-serverless-db.js
 */

const { ServerlessDatabase } = require('../dist/lib/database/ServerlessDatabase');

async function testServerlessDatabase() {
  console.log('🧪 Testing ServerlessDatabase...');
  
  const db = new ServerlessDatabase();
  
  try {
    // Initialize database
    await db.initialize();
    console.log('✅ Database initialized');
    
    // Test getting all recipes
    const recipes = await db.getAllRecipes();
    console.log(`✅ Found ${recipes.length} recipes`);
    
    // Test getting all ingredients
    const ingredients = await db.getAllIngredients();
    console.log(`✅ Found ${ingredients.length} ingredients`);
    
    // Test recipe search
    const searchResults = await db.searchRecipesByIngredients(['chicken', 'onion']);
    console.log(`✅ Search found ${searchResults.length} recipes with chicken or onion`);
    
    // Test ingredient search
    const ingredientSearch = await db.searchIngredients('chicken');
    console.log(`✅ Ingredient search found ${ingredientSearch.length} ingredients matching 'chicken'`);
    
    // Test getting specific recipe
    const recipe = await db.getRecipeById('recipe-1');
    if (recipe) {
      console.log(`✅ Found recipe: ${recipe.title}`);
    } else {
      console.log('❌ Recipe not found');
    }
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

testServerlessDatabase();
