/**
 * Validation System Tests
 * Comprehensive tests for data validation, schema validation, and business rules
 */

import { SchemaValidator, Schemas } from '../../../src/lib/food-label-scanner/utils/schemaValidation';
import { BusinessRules } from '../../../src/lib/food-label-scanner/utils/businessRules';
import { Sanitizers } from '../../../src/lib/food-label-scanner/utils/sanitization';
import { ValidationError } from '../../../src/lib/food-label-scanner/utils/errors';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';
import { FoodScan, ImageMetadata } from '../../../src/lib/food-label-scanner/models/FoodScan';

describe('Validation System - Schema Validation', () => {
  describe('validateObject', () => {
    it('should validate object against schema', () => {
      const schema = {
        email: SchemaValidator.email('Invalid email'),
        name: SchemaValidator.stringLength(2, 50, 'Name must be 2-50 chars'),
        age: SchemaValidator.numberRange(0, 120, 'Age must be 0-120'),
      };

      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25,
      };

      const result = SchemaValidator.validateObject(validData, schema);
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(25);
    });

    it('should throw ValidationError for invalid email', () => {
      const schema = {
        email: SchemaValidator.email('Invalid email'),
      };

      const invalidData = {
        email: 'invalid-email',
      };

      expect(() => {
        SchemaValidator.validateObject(invalidData, schema);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid string length', () => {
      const schema = {
        name: SchemaValidator.stringLength(2, 50, 'Name must be 2-50 chars'),
      };

      const invalidData = {
        name: 'A', // Too short
      };

      expect(() => {
        SchemaValidator.validateObject(invalidData, schema);
      }).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should validate array with item validator', () => {
      const validator = (item: unknown): number => {
        if (typeof item !== 'number') {
          throw new ValidationError('Item must be a number');
        }
        return item;
      };

      const validArray = [1, 2, 3];
      const result = SchemaValidator.validateArray(validArray, validator);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should validate array with min/max length', () => {
      const validator = (item: unknown): string => String(item);

      expect(() => {
        SchemaValidator.validateArray([], validator, 1);
      }).toThrow(ValidationError);

      expect(() => {
        SchemaValidator.validateArray([1, 2, 3, 4, 5], validator, 1, 3);
      }).toThrow(ValidationError);
    });
  });

  describe('Predefined Schemas', () => {
    it('should validate register request schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      expect(() => {
        SchemaValidator.validateObject(validData, Schemas.registerRequest);
      }).not.toThrow();
    });

    it('should reject invalid register request', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        displayName: 'A', // Too short
      };

      expect(() => {
        SchemaValidator.validateObject(invalidData, Schemas.registerRequest);
      }).toThrow(ValidationError);
    });
  });
});

describe('Validation System - Business Rules', () => {
  it('should validate image size', () => {
    const smallImage = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
    expect(() => BusinessRules.validateImageSize(smallImage)).not.toThrow();

    const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024);
    expect(() => BusinessRules.validateImageSize(largeImage)).toThrow(ValidationError);
  });

  it('should validate nutrition data ranges', () => {
    const validNutrition = new NutritionInfo('Food', '100g', 500, {
      protein: 20,
      carbs: 50,
      fat: 10,
      fiber: 5,
      sodium: 500,
      sugar: 15,
      saturatedFat: 3,
      transFat: 0,
    });

    expect(() => BusinessRules.validateNutritionData(validNutrition)).not.toThrow();

    const invalidNutrition = new NutritionInfo('Food', '100g', 15000, {
      protein: 600, // Too high
      carbs: 50,
      fat: 10,
      fiber: 5,
      sodium: 500,
      sugar: 15,
      saturatedFat: 3,
      transFat: 0,
    });

    expect(() => BusinessRules.validateNutritionData(invalidNutrition)).toThrow(ValidationError);
  });

  it('should validate scan status transitions', () => {
    expect(() => {
      BusinessRules.validateScanStatusTransition('pending', 'processing');
    }).not.toThrow();

    expect(() => {
      BusinessRules.validateScanStatusTransition('pending', 'completed');
    }).toThrow(ValidationError);

    expect(() => {
      BusinessRules.validateScanStatusTransition('completed', 'pending');
    }).toThrow(ValidationError);
  });

  it('should validate scan limits', () => {
    expect(() => {
      BusinessRules.validateScanLimit(10, false, 50);
    }).not.toThrow();

    expect(() => {
      BusinessRules.validateScanLimit(50, false, 50);
    }).toThrow(ValidationError);

    // Premium users have no limit
    expect(() => {
      BusinessRules.validateScanLimit(1000, true, 50);
    }).not.toThrow();
  });

  it('should validate pagination parameters', () => {
    expect(() => {
      BusinessRules.validatePagination(1, 20);
    }).not.toThrow();

    expect(() => {
      BusinessRules.validatePagination(0, 20);
    }).toThrow(ValidationError);

    expect(() => {
      BusinessRules.validatePagination(1, 0);
    }).toThrow(ValidationError);

    expect(() => {
      BusinessRules.validatePagination(1, 150, 100);
    }).toThrow(ValidationError);
  });
});

describe('Validation System - Input Sanitization', () => {
  it('should sanitize string input', () => {
    const input = '  Test String  \0';
    const sanitized = Sanitizers.string(input);
    expect(sanitized).toBe('Test String');
    expect(sanitized).not.toContain('\0');
  });

  it('should sanitize email input', () => {
    const email = '  TEST@EXAMPLE.COM  ';
    const sanitized = Sanitizers.email(email);
    expect(sanitized).toBe('test@example.com');
  });

  it('should sanitize object recursively', () => {
    const obj = {
      name: '  Test  \0',
      nested: {
        value: '  Nested  ',
      },
    };

    const sanitized = Sanitizers.object(obj);
    expect(sanitized.name).toBe('Test');
    expect(sanitized.nested.value).toBe('Nested');
  });
});

