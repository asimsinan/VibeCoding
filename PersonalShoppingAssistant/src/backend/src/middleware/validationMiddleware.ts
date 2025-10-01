/**
 * Validation Middleware
 * TASK-017: Error Handling - FR-001 through FR-007
 * 
 * This middleware provides request validation using JSON schemas
 * and custom validation functions for API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { validationError } from './errorHandler';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Validate request body against JSON schema
 * @param schema - JSON schema to validate against
 * @returns Express middleware function
 */
export const validateBody = (schema: object) => {
  const validate = ajv.compile(schema);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const isValid = validate(req.body);
    
    if (!isValid) {
      const errors = validate.errors?.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      })) || [];
      
      throw validationError(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }
    
    next();
  };
};

/**
 * Validate request query parameters against JSON schema
 * @param schema - JSON schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: object) => {
  const validate = ajv.compile(schema);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const isValid = validate(req.query);
    
    if (!isValid) {
      const errors = validate.errors?.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      })) || [];
      
      throw validationError(`Query validation failed: ${errors.map(e => e.message).join(', ')}`);
    }
    
    next();
  };
};

/**
 * Validate request parameters against JSON schema
 * @param schema - JSON schema to validate against
 * @returns Express middleware function
 */
export const validateParams = (schema: object) => {
  const validate = ajv.compile(schema);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const isValid = validate(req.params);
    
    if (!isValid) {
      const errors = validate.errors?.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      })) || [];
      
      throw validationError(`Parameter validation failed: ${errors.map(e => e.message).join(', ')}`);
    }
    
    next();
  };
};

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password string to validate
 * @returns object with validation result and errors
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 * @returns object with validation result and errors
 */
export const validatePagination = (page: string | undefined, limit: string | undefined): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push('Limit must be a positive integer between 1 and 1000');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns object with validation result and errors
 */
export const validatePriceRange = (minPrice: string | undefined, maxPrice: string | undefined): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (minPrice !== undefined) {
    const min = parseFloat(minPrice);
    if (isNaN(min) || min < 0) {
      errors.push('Minimum price must be a non-negative number');
    }
  }
  
  if (maxPrice !== undefined) {
    const max = parseFloat(maxPrice);
    if (isNaN(max) || max < 0) {
      errors.push('Maximum price must be a non-negative number');
    }
  }
  
  if (minPrice !== undefined && maxPrice !== undefined) {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.push('Minimum price must be less than or equal to maximum price');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @returns sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate and sanitize search query
 * @param query - Search query string
 * @returns object with validation result and sanitized query
 */
export const validateSearchQuery = (query: string): { isValid: boolean; sanitizedQuery: string; errors: string[] } => {
  const errors: string[] = [];
  
  if (!query || typeof query !== 'string') {
    errors.push('Search query is required');
    return { isValid: false, sanitizedQuery: '', errors };
  }
  
  const sanitized = sanitizeString(query);
  
  if (sanitized.length < 2) {
    errors.push('Search query must be at least 2 characters long');
  }
  
  if (sanitized.length > 100) {
    errors.push('Search query must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedQuery: sanitized,
    errors
  };
};

/**
 * Validate file upload
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns object with validation result and errors
 */
export const validateFileUpload = (file: any, allowedTypes: string[], maxSize: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @returns boolean indicating if UUID is valid
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate date format
 * @param date - Date string to validate
 * @param format - Expected date format (ISO, YYYY-MM-DD, etc.)
 * @returns boolean indicating if date is valid
 */
export const isValidDate = (date: string, format: 'ISO' | 'YYYY-MM-DD' = 'ISO'): boolean => {
  if (format === 'ISO') {
    return !isNaN(Date.parse(date));
  } else if (format === 'YYYY-MM-DD') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }
  return false;
};

/**
 * Validate phone number format
 * @param phone - Phone number string to validate
 * @returns boolean indicating if phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns object with validation result and parsed data
 */
export const validateJSON = (jsonString: string): { isValid: boolean; data: any; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data, errors };
  } catch (error) {
    errors.push('Invalid JSON format');
    return { isValid: false, data: null, errors };
  }
};
