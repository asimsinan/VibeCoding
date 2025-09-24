/**
 * Sample Data Loader for Recipe Finder App
 * Provides sample recipes and ingredients for serverless environments
 */

import { Recipe } from '../entities/Recipe';
import { Ingredient } from '../entities/Ingredient';

export class SampleDataLoader {
  static getSampleRecipes(): Recipe[] {
    return [
      {
        id: 'recipe-1',
        title: 'Chicken Stir Fry',
        description: 'A quick and healthy chicken stir fry with fresh vegetables and aromatic sauce.',
        image: '/images/recipes/chicken-stir-fry.jpg',
        cookingTime: 20,
        difficulty: 'easy',
        ingredients: [
          '2 chicken breasts, sliced',
          '1 bell pepper, sliced',
          '1 onion, sliced',
          '2 cloves garlic, minced',
          '1 tbsp soy sauce',
          '1 tbsp olive oil',
          'Salt and pepper to taste'
        ],
        instructions: [
          'Heat olive oil in a large pan over medium-high heat',
          'Add chicken and cook until golden brown, about 5-7 minutes',
          'Add garlic and cook for 1 minute until fragrant',
          'Add bell pepper and onion, stir-fry for 3-4 minutes',
          'Add soy sauce and season with salt and pepper',
          'Cook for another 2 minutes until vegetables are tender-crisp',
          'Serve hot over rice or noodles'
        ]
      },
      {
        id: 'recipe-2',
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish with eggs, cheese, and pancetta.',
        image: '/images/recipes/pasta-carbonara.jpg',
        cookingTime: 25,
        difficulty: 'medium',
        ingredients: [
          '400g spaghetti',
          '200g pancetta, diced',
          '4 large eggs',
          '100g parmesan cheese, grated',
          '2 cloves garlic, minced',
          'Black pepper to taste',
          'Salt for pasta water'
        ],
        instructions: [
          'Bring a large pot of salted water to boil and cook spaghetti according to package directions',
          'In a bowl, whisk together eggs, parmesan, and black pepper',
          'Cook pancetta in a large pan until crispy, about 5-7 minutes',
          'Add garlic and cook for 1 minute',
          'Drain pasta, reserving 1 cup of pasta water',
          'Add hot pasta to the pan with pancetta',
          'Remove from heat and quickly stir in egg mixture',
          'Add pasta water gradually until sauce is creamy',
          'Serve immediately with extra parmesan'
        ]
      },
      {
        id: 'recipe-3',
        title: 'Beef Tacos',
        description: 'Delicious ground beef tacos with fresh toppings and homemade seasoning.',
        image: '/images/recipes/beef-tacos.jpg',
        cookingTime: 30,
        difficulty: 'easy',
        ingredients: [
          '500g ground beef',
          '8 taco shells',
          '1 onion, diced',
          '2 cloves garlic, minced',
          '1 packet taco seasoning',
          '1 cup lettuce, shredded',
          '1 tomato, diced',
          '1 cup cheddar cheese, shredded',
          'Sour cream for serving'
        ],
        instructions: [
          'Heat a large pan over medium-high heat',
          'Add ground beef and cook until browned, breaking it up with a spoon',
          'Add onion and garlic, cook until softened',
          'Add taco seasoning and 1/2 cup water, simmer for 5 minutes',
          'Warm taco shells according to package directions',
          'Fill shells with beef mixture',
          'Top with lettuce, tomato, cheese, and sour cream',
          'Serve immediately'
        ]
      },
      {
        id: 'recipe-4',
        title: 'Salmon Teriyaki',
        description: 'Pan-seared salmon with homemade teriyaki glaze and steamed vegetables.',
        image: '/images/recipes/salmon-teriyaki.jpg',
        cookingTime: 35,
        difficulty: 'medium',
        ingredients: [
          '4 salmon fillets',
          '1/4 cup soy sauce',
          '2 tbsp honey',
          '2 tbsp rice vinegar',
          '1 tbsp sesame oil',
          '2 cloves garlic, minced',
          '1 tsp ginger, grated',
          '2 cups broccoli florets',
          '1 carrot, sliced',
          'Sesame seeds for garnish'
        ],
        instructions: [
          'Mix soy sauce, honey, rice vinegar, sesame oil, garlic, and ginger for teriyaki sauce',
          'Season salmon with salt and pepper',
          'Heat oil in a large pan over medium-high heat',
          'Cook salmon for 4-5 minutes per side until golden',
          'Add teriyaki sauce and simmer for 2-3 minutes',
          'Steam broccoli and carrot until tender',
          'Serve salmon over vegetables, drizzled with sauce',
          'Garnish with sesame seeds'
        ]
      },
      {
        id: 'recipe-5',
        title: 'Vegetarian Pasta',
        description: 'Hearty vegetarian pasta with mushrooms, spinach, and creamy sauce.',
        image: '/images/recipes/vegetarian-pasta.jpg',
        cookingTime: 25,
        difficulty: 'easy',
        ingredients: [
          '400g penne pasta',
          '200g mushrooms, sliced',
          '2 cups fresh spinach',
          '1 onion, diced',
          '3 cloves garlic, minced',
          '1 cup heavy cream',
          '1/2 cup parmesan cheese, grated',
          '2 tbsp olive oil',
          'Salt and pepper to taste'
        ],
        instructions: [
          'Cook pasta according to package directions',
          'Heat olive oil in a large pan over medium heat',
          'Add onion and cook until softened',
          'Add mushrooms and cook until golden',
          'Add garlic and cook for 1 minute',
          'Add spinach and cook until wilted',
          'Add cream and parmesan, stir until combined',
          'Add cooked pasta and toss to coat',
          'Season with salt and pepper',
          'Serve hot with extra parmesan'
        ]
      },
      {
        id: 'recipe-6',
        title: 'Chicken Curry',
        description: 'Aromatic chicken curry with coconut milk and warm spices.',
        image: '/images/recipes/chicken-curry.jpg',
        cookingTime: 45,
        difficulty: 'medium',
        ingredients: [
          '500g chicken thighs, cut into pieces',
          '1 onion, diced',
          '3 cloves garlic, minced',
          '1 tbsp ginger, grated',
          '2 tbsp curry powder',
          '1 can coconut milk',
          '2 tomatoes, diced',
          '2 tbsp vegetable oil',
          'Salt to taste',
          'Fresh cilantro for garnish'
        ],
        instructions: [
          'Heat oil in a large pot over medium heat',
          'Add onion and cook until golden',
          'Add garlic, ginger, and curry powder, cook for 1 minute',
          'Add chicken and cook until browned',
          'Add tomatoes and cook until softened',
          'Add coconut milk and bring to a simmer',
          'Cover and cook for 25-30 minutes',
          'Season with salt',
          'Garnish with cilantro and serve over rice'
        ]
      }
    ];
  }

  static getSampleIngredients(): Ingredient[] {
    return [
      {
        name: 'chicken',
        normalizedName: 'chicken',
        category: 'protein',
        variations: ['chicken breast', 'chicken thigh', 'chicken drumstick'],
        synonyms: ['poultry', 'fowl']
      },
      {
        name: 'beef',
        normalizedName: 'beef',
        category: 'protein',
        variations: ['ground beef', 'beef steak', 'beef roast'],
        synonyms: ['cattle', 'red meat']
      },
      {
        name: 'salmon',
        normalizedName: 'salmon',
        category: 'protein',
        variations: ['salmon fillet', 'salmon steak'],
        synonyms: ['fish', 'seafood']
      },
      {
        name: 'onion',
        normalizedName: 'onion',
        category: 'vegetable',
        variations: ['yellow onion', 'red onion', 'white onion'],
        synonyms: ['bulb onion', 'allium']
      },
      {
        name: 'garlic',
        normalizedName: 'garlic',
        category: 'vegetable',
        variations: ['garlic cloves', 'garlic powder'],
        synonyms: ['allium sativum']
      },
      {
        name: 'tomato',
        normalizedName: 'tomato',
        category: 'vegetable',
        variations: ['cherry tomato', 'roma tomato', 'beefsteak tomato'],
        synonyms: ['tomatoes', 'lycopersicon']
      },
      {
        name: 'bell pepper',
        normalizedName: 'bell pepper',
        category: 'vegetable',
        variations: ['red bell pepper', 'green bell pepper', 'yellow bell pepper'],
        synonyms: ['sweet pepper', 'capsicum']
      },
      {
        name: 'mushroom',
        normalizedName: 'mushroom',
        category: 'vegetable',
        variations: ['button mushroom', 'portobello mushroom', 'shiitake mushroom'],
        synonyms: ['fungi', 'mushrooms']
      },
      {
        name: 'spinach',
        normalizedName: 'spinach',
        category: 'vegetable',
        variations: ['baby spinach', 'fresh spinach'],
        synonyms: ['leafy greens', 'spinacia oleracea']
      },
      {
        name: 'broccoli',
        normalizedName: 'broccoli',
        category: 'vegetable',
        variations: ['broccoli florets', 'broccoli stems'],
        synonyms: ['cruciferous vegetable']
      },
      {
        name: 'pasta',
        normalizedName: 'pasta',
        category: 'grain',
        variations: ['spaghetti', 'penne', 'fettuccine', 'linguine'],
        synonyms: ['noodles', 'pasta noodles']
      },
      {
        name: 'rice',
        normalizedName: 'rice',
        category: 'grain',
        variations: ['white rice', 'brown rice', 'jasmine rice'],
        synonyms: ['grain', 'cereal']
      },
      {
        name: 'olive oil',
        normalizedName: 'olive oil',
        category: 'fat',
        variations: ['extra virgin olive oil', 'light olive oil'],
        synonyms: ['oil', 'cooking oil']
      },
      {
        name: 'soy sauce',
        normalizedName: 'soy sauce',
        category: 'condiment',
        variations: ['light soy sauce', 'dark soy sauce', 'tamari'],
        synonyms: ['soya sauce', 'shoyu']
      },
      {
        name: 'cheese',
        normalizedName: 'cheese',
        category: 'dairy',
        variations: ['cheddar cheese', 'parmesan cheese', 'mozzarella cheese'],
        synonyms: ['dairy product', 'fromage']
      }
    ];
  }
}
