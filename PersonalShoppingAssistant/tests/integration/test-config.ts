/**
 * Test Configuration - Integration test configuration
 * TASK-003: Create Integration Test Scenarios - FR-001 through FR-007
 * 
 * This file provides configuration for integration tests including
 * database setup, test data, and environment configuration.
 */

export interface TestConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  server: {
    port: number;
    host: string;
  };
  testData: {
    users: TestUser[];
    products: TestProduct[];
    interactions: TestInteraction[];
  };
  timeouts: {
    database: number;
    api: number;
    recommendation: number;
  };
}

export interface TestUser {
  id: number;
  email: string;
  passwordHash: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
    stylePreferences: string[];
  };
}

export interface TestProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
}

export interface TestInteraction {
  id: number;
  userId: number;
  productId: number;
  type: 'view' | 'like' | 'dislike' | 'purchase';
  metadata?: Record<string, any>;
}

export const testConfig: TestConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'test_shopping_assistant',
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost',
  },
  testData: {
    users: [
      {
        id: 1,
        email: 'testuser1@example.com',
        passwordHash: '$2b$10$testhash1',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 500 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern'],
        },
      },
      {
        id: 2,
        email: 'testuser2@example.com',
        passwordHash: '$2b$10$testhash2',
        preferences: {
          categories: ['Electronics', 'Clothing'],
          priceRange: { min: 20, max: 300 },
          brands: ['Nike', 'Adidas'],
          stylePreferences: ['Sporty'],
        },
      },
      {
        id: 3,
        email: 'testuser3@example.com',
        passwordHash: '$2b$10$testhash3',
        preferences: {
          categories: ['Books', 'Home'],
          priceRange: { min: 5, max: 100 },
          brands: ['IKEA'],
          stylePreferences: ['Minimalist'],
        },
      },
      {
        id: 4,
        email: 'admin@example.com',
        passwordHash: '$2b$10$adminhash',
        preferences: {
          categories: ['Electronics', 'Books', 'Clothing'],
          priceRange: { min: 0, max: 1000 },
          brands: ['Apple', 'Nike', 'Samsung'],
          stylePreferences: ['Modern', 'Sporty'],
        },
      },
    ],
    products: [
      {
        id: 1,
        name: 'iPhone 15',
        description: 'Latest Apple iPhone with advanced features',
        price: 999.99,
        category: 'Electronics',
        brand: 'Apple',
        imageUrl: 'https://example.com/iphone15.jpg',
        availability: true,
      },
      {
        id: 2,
        name: 'Samsung Galaxy S24',
        description: 'Samsung flagship smartphone',
        price: 899.99,
        category: 'Electronics',
        brand: 'Samsung',
        imageUrl: 'https://example.com/galaxy-s24.jpg',
        availability: true,
      },
      {
        id: 3,
        name: 'MacBook Pro',
        description: 'Apple MacBook Pro laptop',
        price: 1999.99,
        category: 'Electronics',
        brand: 'Apple',
        imageUrl: 'https://example.com/macbook-pro.jpg',
        availability: true,
      },
      {
        id: 4,
        name: 'iPad Air',
        description: 'Apple iPad Air tablet',
        price: 599.99,
        category: 'Electronics',
        brand: 'Apple',
        imageUrl: 'https://example.com/ipad-air.jpg',
        availability: true,
      },
      {
        id: 5,
        name: 'Nike Air Max',
        description: 'Comfortable running shoes',
        price: 129.99,
        category: 'Clothing',
        brand: 'Nike',
        imageUrl: 'https://example.com/nike-air-max.jpg',
        availability: true,
      },
      {
        id: 6,
        name: 'Adidas Ultraboost',
        description: 'High-performance running shoes',
        price: 149.99,
        category: 'Clothing',
        brand: 'Adidas',
        imageUrl: 'https://example.com/adidas-ultraboost.jpg',
        availability: true,
      },
      {
        id: 7,
        name: 'TypeScript Handbook',
        description: 'Complete guide to TypeScript',
        price: 49.99,
        category: 'Books',
        brand: 'TechBooks',
        imageUrl: 'https://example.com/typescript-handbook.jpg',
        availability: true,
      },
      {
        id: 8,
        name: 'React Guide',
        description: 'Learn React development',
        price: 39.99,
        category: 'Books',
        brand: 'TechBooks',
        imageUrl: 'https://example.com/react-guide.jpg',
        availability: true,
      },
      {
        id: 9,
        name: 'IKEA Desk',
        description: 'Modern minimalist desk',
        price: 199.99,
        category: 'Home',
        brand: 'IKEA',
        imageUrl: 'https://example.com/ikea-desk.jpg',
        availability: true,
      },
      {
        id: 10,
        name: 'IKEA Chair',
        description: 'Ergonomic office chair',
        price: 149.99,
        category: 'Home',
        brand: 'IKEA',
        imageUrl: 'https://example.com/ikea-chair.jpg',
        availability: true,
      },
    ],
    interactions: [
      {
        id: 1,
        userId: 1,
        productId: 1,
        type: 'view',
        metadata: { source: 'search' },
      },
      {
        id: 2,
        userId: 1,
        productId: 1,
        type: 'like',
        metadata: { source: 'recommendation' },
      },
      {
        id: 3,
        userId: 1,
        productId: 3,
        type: 'view',
        metadata: { source: 'browse' },
      },
      {
        id: 4,
        userId: 1,
        productId: 3,
        type: 'purchase',
        metadata: { source: 'recommendation', amount: 1999.99 },
      },
      {
        id: 5,
        userId: 1,
        productId: 7,
        type: 'view',
        metadata: { source: 'search' },
      },
      {
        id: 6,
        userId: 1,
        productId: 7,
        type: 'like',
        metadata: { source: 'recommendation' },
      },
      {
        id: 7,
        userId: 2,
        productId: 2,
        type: 'view',
        metadata: { source: 'search' },
      },
      {
        id: 8,
        userId: 2,
        productId: 2,
        type: 'like',
        metadata: { source: 'recommendation' },
      },
      {
        id: 9,
        userId: 2,
        productId: 5,
        type: 'view',
        metadata: { source: 'browse' },
      },
      {
        id: 10,
        userId: 2,
        productId: 5,
        type: 'purchase',
        metadata: { source: 'recommendation', amount: 129.99 },
      },
    ],
  },
  timeouts: {
    database: 10000, // 10 seconds
    api: 5000, // 5 seconds
    recommendation: 2000, // 2 seconds
  },
};

export const testCategories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home',
  'Sports',
  'Beauty',
  'Automotive',
  'Garden',
  'Toys',
  'Health',
];

export const testBrands = [
  'Apple',
  'Samsung',
  'Nike',
  'Adidas',
  'IKEA',
  'TechBooks',
  'Sony',
  'Microsoft',
  'Google',
  'Amazon',
];

export const testPriceRanges = [
  { min: 0, max: 50, label: 'Budget' },
  { min: 50, max: 200, label: 'Mid-range' },
  { min: 200, max: 500, label: 'Premium' },
  { min: 500, max: 1000, label: 'Luxury' },
  { min: 1000, max: 10000, label: 'Ultra-luxury' },
];

export const testInteractionTypes = ['view', 'like', 'dislike', 'purchase'] as const;

export const testAlgorithms = ['collaborative', 'content-based', 'hybrid'] as const;

export const testUserScenarios = {
  newUser: {
    email: 'newuser@example.com',
    preferences: {
      categories: [],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
    },
  },
  electronicsLover: {
    email: 'electronics@example.com',
    preferences: {
      categories: ['Electronics'],
      priceRange: { min: 100, max: 2000 },
      brands: ['Apple', 'Samsung', 'Sony'],
      stylePreferences: ['Modern', 'Minimalist'],
    },
  },
  budgetShopper: {
    email: 'budget@example.com',
    preferences: {
      categories: ['Books', 'Clothing'],
      priceRange: { min: 0, max: 100 },
      brands: ['TechBooks', 'Generic'],
      stylePreferences: ['Simple', 'Practical'],
    },
  },
  luxuryShopper: {
    email: 'luxury@example.com',
    preferences: {
      categories: ['Electronics', 'Clothing', 'Home'],
      priceRange: { min: 500, max: 10000 },
      brands: ['Apple', 'Nike', 'IKEA'],
      stylePreferences: ['Premium', 'Designer'],
    },
  },
};

export const testProductScenarios = {
  popularElectronics: {
    name: 'Popular Electronics Product',
    description: 'A very popular electronics item',
    price: 299.99,
    category: 'Electronics',
    brand: 'PopularBrand',
    availability: true,
  },
  expensiveLuxury: {
    name: 'Luxury Item',
    description: 'An expensive luxury product',
    price: 2999.99,
    category: 'Electronics',
    brand: 'LuxuryBrand',
    availability: true,
  },
  budgetFriendly: {
    name: 'Budget Product',
    description: 'An affordable product',
    price: 19.99,
    category: 'Books',
    brand: 'BudgetBrand',
    availability: true,
  },
  outOfStock: {
    name: 'Out of Stock Product',
    description: 'A product that is not available',
    price: 99.99,
    category: 'Electronics',
    brand: 'TestBrand',
    availability: false,
  },
};

export const testRecommendationScenarios = {
  coldStart: {
    description: 'New user with no interaction history',
    userPreferences: {
      categories: ['Electronics'],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
    },
    expectedBehavior: 'Should recommend popular products in preferred categories',
  },
  similarUsers: {
    description: 'User with similar preferences to other users',
    userPreferences: {
      categories: ['Electronics', 'Books'],
      priceRange: { min: 50, max: 500 },
      brands: ['Apple', 'TechBooks'],
      stylePreferences: ['Modern'],
    },
    expectedBehavior: 'Should recommend products liked by similar users',
  },
  diversePreferences: {
    description: 'User with diverse and conflicting preferences',
    userPreferences: {
      categories: ['Electronics', 'Clothing', 'Books', 'Home'],
      priceRange: { min: 10, max: 2000 },
      brands: ['Apple', 'Nike', 'IKEA', 'TechBooks'],
      stylePreferences: ['Modern', 'Sporty', 'Minimalist'],
    },
    expectedBehavior: 'Should handle conflicting preferences gracefully',
  },
  noInteractions: {
    description: 'User who never interacts with recommendations',
    userPreferences: {
      categories: ['Electronics'],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
    },
    expectedBehavior: 'Should continue providing general recommendations',
  },
  sparseData: {
    description: 'Limited product catalog in user preferred categories',
    userPreferences: {
      categories: ['RareCategory'],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
    },
    expectedBehavior: 'Should gracefully handle limited data availability',
  },
};

export default testConfig;
