/**
 * Schema Validation Utilities
 * Provides schema-based validation for data structures
 */

import { ValidationError } from './errors';

export interface ValidationSchema<T> {
  validate(data: unknown): T;
}

export interface ValidationRule<T> {
  (value: T): boolean;
  message?: string;
}

export class SchemaValidator {
  /**
   * Validate object against schema
   */
  public static validateObject<T extends Record<string, any>>(
    data: unknown,
    schema: Record<keyof T, ValidationRule<any>>
  ): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationError('Expected object');
    }

    const validated: Partial<T> = {};

    for (const [key, rule] of Object.entries(schema)) {
      const value = (data as any)[key];

      try {
        const isValid = rule(value);
        if (!isValid) {
          throw new ValidationError(
            rule.message || `Validation failed for field: ${key}`
          );
        }
        validated[key as keyof T] = value;
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(`Validation error for field ${key}: ${error}`);
      }
    }

    return validated as T;
  }

  /**
   * Validate array against schema
   */
  public static validateArray<T>(
    data: unknown,
    itemValidator: (item: unknown) => T,
    minLength?: number,
    maxLength?: number
  ): T[] {
    if (!Array.isArray(data)) {
      throw new ValidationError('Expected array');
    }

    if (minLength !== undefined && data.length < minLength) {
      throw new ValidationError(`Array must have at least ${minLength} items`);
    }

    if (maxLength !== undefined && data.length > maxLength) {
      throw new ValidationError(`Array must have at most ${maxLength} items`);
    }

    return data.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(
          `Array item at index ${index} is invalid: ${error}`
        );
      }
    });
  }

  /**
   * Create validation rule for required field
   */
  public static required<T>(message?: string): ValidationRule<T> {
    const rule = (value: T): boolean => {
      return value !== null && value !== undefined && value !== '';
    };
    rule.message = message || 'Field is required';
    return rule;
  }

  /**
   * Create validation rule for string length
   */
  public static stringLength(
    min: number,
    max: number,
    message?: string
  ): ValidationRule<string> {
    const rule = (value: string): boolean => {
      return typeof value === 'string' && value.length >= min && value.length <= max;
    };
    rule.message = message || `String length must be between ${min} and ${max} characters`;
    return rule;
  }

  /**
   * Create validation rule for number range
   */
  public static numberRange(
    min: number,
    max: number,
    message?: string
  ): ValidationRule<number> {
    const rule = (value: number): boolean => {
      return typeof value === 'number' && value >= min && value <= max;
    };
    rule.message = message || `Number must be between ${min} and ${max}`;
    return rule;
  }

  /**
   * Create validation rule for email
   */
  public static email(message?: string): ValidationRule<string> {
    const rule = (value: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    };
    rule.message = message || 'Invalid email format';
    return rule;
  }

  /**
   * Create validation rule for enum
   */
  public static enum<T extends string>(
    values: T[],
    message?: string
  ): ValidationRule<T> {
    const rule = (value: T): boolean => {
      return values.includes(value);
    };
    rule.message = message || `Value must be one of: ${values.join(', ')}`;
    return rule;
  }
}

/**
 * Predefined schemas for common data structures
 */
export const Schemas = {
  registerRequest: {
    email: SchemaValidator.email('Invalid email address'),
    password: SchemaValidator.stringLength(6, 128, 'Password must be between 6 and 128 characters'),
    displayName: SchemaValidator.stringLength(2, 50, 'Display name must be between 2 and 50 characters'),
  },

  loginRequest: {
    email: SchemaValidator.email('Invalid email address'),
    password: SchemaValidator.required('Password is required'),
  },

  scanRequest: {
    image: SchemaValidator.required('Image is required'),
    language: SchemaValidator.enum(['en', 'tr'], 'Language must be "en" or "tr"'),
  },

  scanId: {
    scanId: SchemaValidator.stringLength(1, 100, 'Scan ID is required'),
  },
};

