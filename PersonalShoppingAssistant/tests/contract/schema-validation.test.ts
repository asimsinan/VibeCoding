/**
 * Schema Validation Tests - JSON Schema validation
 * TASK-002: Create Contract Tests - FR-001 through FR-007
 * 
 * These tests validate JSON schemas and will fail initially (RED phase)
 * until the actual validation logic is implemented.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import schemas
const productSchema = JSON.parse(
  readFileSync(join(__dirname, '../../src/contracts/schemas/Product.json'), 'utf8')
);
const userSchema = JSON.parse(
  readFileSync(join(__dirname, '../../src/contracts/schemas/User.json'), 'utf8')
);
const recommendationSchema = JSON.parse(
  readFileSync(join(__dirname, '../../src/contracts/schemas/Recommendation.json'), 'utf8')
);

describe('Schema Validation Tests', () => {
  let ajv: Ajv;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
  });

  describe('Product Schema Validation', () => {
    const validateProduct = ajv.compile(productSchema);

    it('should validate valid product', () => {
      const validProduct = {
        id: 1,
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones',
        price: 99.99,
        category: 'Electronics',
        brand: 'TechBrand',
        imageUrl: 'https://example.com/image.jpg',
        availability: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      const isValid = validateProduct(validProduct);
      expect(isValid).toBe(true);
      if (!isValid) {
        console.log('Validation errors:', validateProduct.errors);
      }
    });

    it('should reject product with missing required fields', () => {
      const invalidProduct = {
        name: 'Wireless Headphones',
        price: 99.99
        // Missing required fields: id, category, brand, availability
      };

      const isValid = validateProduct(invalidProduct);
      expect(isValid).toBe(false);
      expect(validateProduct.errors).toBeDefined();
      expect(validateProduct.errors?.length).toBeGreaterThan(0);
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = {
        id: 1,
        name: 'Wireless Headphones',
        price: -10, // Invalid: negative price
        category: 'Electronics',
        brand: 'TechBrand',
        availability: true
      };

      const isValid = validateProduct(invalidProduct);
      expect(isValid).toBe(false);
    });

    it('should reject product with invalid email format in imageUrl', () => {
      const invalidProduct = {
        id: 1,
        name: 'Wireless Headphones',
        price: 99.99,
        category: 'Electronics',
        brand: 'TechBrand',
        availability: true,
        imageUrl: 'not-a-valid-url'
      };

      const isValid = validateProduct(invalidProduct);
      expect(isValid).toBe(false);
    });

    it('should reject product with invalid data types', () => {
      const invalidProduct = {
        id: 'not-a-number',
        name: 123, // Should be string
        price: 'not-a-number',
        category: 'Electronics',
        brand: 'TechBrand',
        availability: 'yes' // Should be boolean
      };

      const isValid = validateProduct(invalidProduct);
      expect(isValid).toBe(false);
    });

    it('should validate product with minimal required fields', () => {
      const minimalProduct = {
        id: 1,
        name: 'Product',
        price: 0,
        category: 'Category',
        brand: 'Brand',
        availability: false
      };

      const isValid = validateProduct(minimalProduct);
      expect(isValid).toBe(true);
    });
  });

  describe('User Schema Validation', () => {
    const validateUser = ajv.compile(userSchema);

    it('should validate valid user', () => {
      const validUser = {
        id: 1,
        email: 'user@example.com',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: {
            min: 10.00,
            max: 500.00
          },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern', 'Minimalist']
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      const isValid = validateUser(validUser);
      expect(isValid).toBe(true);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = {
        id: 1,
        email: 'not-an-email',
        preferences: {
          categories: ['Electronics']
        }
      };

      const isValid = validateUser(invalidUser);
      expect(isValid).toBe(false);
    });

    it('should reject user with invalid preferences structure', () => {
      const invalidUser = {
        id: 1,
        email: 'user@example.com',
        preferences: {
          categories: 'not-an-array',
          priceRange: {
            min: 'not-a-number',
            max: 500
          }
        }
      };

      const isValid = validateUser(invalidUser);
      expect(isValid).toBe(false);
    });

    it('should validate user with empty preferences', () => {
      const userWithEmptyPreferences = {
        id: 1,
        email: 'user@example.com',
        preferences: {}
      };

      const isValid = validateUser(userWithEmptyPreferences);
      expect(isValid).toBe(true);
    });

    it('should reject user with invalid price range', () => {
      const invalidUser = {
        id: 1,
        email: 'user@example.com',
        preferences: {
          priceRange: {
            min: 500,
            max: 100 // min > max should be invalid
          }
        }
      };

      const isValid = validateUser(invalidUser);
      expect(isValid).toBe(false);
    });
  });

  describe('Recommendation Schema Validation', () => {
    const validateRecommendation = ajv.compile(recommendationSchema);

    it('should validate valid recommendation response', () => {
      const validRecommendation = {
        recommendations: [
          {
            id: 1,
            name: 'Product 1',
            price: 99.99,
            category: 'Electronics',
            brand: 'Brand1',
            availability: true,
            score: 0.95,
            reasons: ['Based on your preferences', 'Similar users liked this']
          },
          {
            id: 2,
            name: 'Product 2',
            price: 149.99,
            category: 'Electronics',
            brand: 'Brand2',
            availability: true,
            score: 0.87,
            reasons: ['Popular in your category']
          }
        ],
        algorithm: 'hybrid',
        metadata: {
          totalProducts: 1000,
          processingTime: 150.5,
          userPreferences: {
            categories: ['Electronics']
          }
        }
      };

      const isValid = validateRecommendation(validRecommendation);
      expect(isValid).toBe(true);
    });

    it('should reject recommendation with invalid algorithm', () => {
      const invalidRecommendation = {
        recommendations: [],
        algorithm: 'invalid-algorithm'
      };

      const isValid = validateRecommendation(invalidRecommendation);
      expect(isValid).toBe(false);
    });

    it('should reject recommendation with invalid product scores', () => {
      const invalidRecommendation = {
        recommendations: [
          {
            id: 1,
            name: 'Product 1',
            price: 99.99,
            category: 'Electronics',
            brand: 'Brand1',
            availability: true,
            score: 1.5 // Invalid: score > 1
          }
        ],
        algorithm: 'hybrid'
      };

      const isValid = validateRecommendation(invalidRecommendation);
      expect(isValid).toBe(false);
    });

    it('should validate recommendation with minimal data', () => {
      const minimalRecommendation = {
        recommendations: [],
        algorithm: 'collaborative'
      };

      const isValid = validateRecommendation(minimalRecommendation);
      expect(isValid).toBe(true);
    });
  });

  describe('API Request/Response Schema Validation', () => {
    it('should validate API response structure', () => {
      const apiResponseSchema = {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      };

      const validateApiResponse = ajv.compile(apiResponseSchema);

      const validResponse = {
        success: true,
        data: { products: [] },
        message: 'Success',
        timestamp: '2023-01-01T00:00:00Z'
      };

      const isValid = validateApiResponse(validResponse);
      expect(isValid).toBe(true);
    });

    it('should validate error response structure', () => {
      const errorResponseSchema = {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      };

      const validateErrorResponse = ajv.compile(errorResponseSchema);

      const validErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: [
            {
              field: 'email',
              message: 'Invalid email format'
            }
          ]
        },
        timestamp: '2023-01-01T00:00:00Z'
      };

      const isValid = validateErrorResponse(validErrorResponse);
      expect(isValid).toBe(true);
    });
  });

  describe('Edge Case Schema Validation', () => {
    it('should handle empty arrays in preferences', () => {
      const userWithEmptyArrays = {
        id: 1,
        email: 'user@example.com',
        preferences: {
          categories: [],
          brands: [],
          stylePreferences: []
        }
      };

      const validateUser = ajv.compile(userSchema);
      const isValid = validateUser(userWithEmptyArrays);
      expect(isValid).toBe(true);
    });

    it('should handle very long strings within limits', () => {
      const productWithLongStrings = {
        id: 1,
        name: 'A'.repeat(255), // Max length
        description: 'B'.repeat(1000), // Max length
        price: 99.99,
        category: 'C'.repeat(100), // Max length
        brand: 'D'.repeat(100), // Max length
        availability: true
      };

      const validateProduct = ajv.compile(productSchema);
      const isValid = validateProduct(productWithLongStrings);
      expect(isValid).toBe(true);
    });

    it('should reject strings exceeding maximum length', () => {
      const productWithTooLongStrings = {
        id: 1,
        name: 'A'.repeat(256), // Exceeds max length
        price: 99.99,
        category: 'Electronics',
        brand: 'Brand',
        availability: true
      };

      const validateProduct = ajv.compile(productSchema);
      const isValid = validateProduct(productWithTooLongStrings);
      expect(isValid).toBe(false);
    });

    it('should handle decimal prices correctly', () => {
      const productWithDecimalPrice = {
        id: 1,
        name: 'Product',
        price: 99.99,
        category: 'Electronics',
        brand: 'Brand',
        availability: true
      };

      const validateProduct = ajv.compile(productSchema);
      const isValid = validateProduct(productWithDecimalPrice);
      expect(isValid).toBe(true);
    });
  });
});
