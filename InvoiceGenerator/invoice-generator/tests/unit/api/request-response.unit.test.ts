#!/usr/bin/env node
/**
 * API Request/Response Unit Tests
 * 
 * Tests the API request validation and response formatting
 */

import { describe, test, expect } from '@jest/globals';

// Mock API request/response utilities
interface APIRequest {
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
}

interface APIResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Mock API utilities
class APIRequestValidator {
  validateInvoiceRequest(request: APIRequest): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!request.body) {
      errors.push({ field: 'body', message: 'Request body is required', code: 'REQUIRED_FIELD' });
      return { isValid: false, errors };
    }
    
    const { client, items, taxRate } = request.body;
    
    // Validate client
    if (!client) {
      errors.push({ field: 'client', message: 'Client information is required', code: 'REQUIRED_FIELD' });
    } else {
      if (!client.name) {
        errors.push({ field: 'client.name', message: 'Client name is required', code: 'REQUIRED_FIELD' });
      }
      if (!client.email) {
        errors.push({ field: 'client.email', message: 'Client email is required', code: 'REQUIRED_FIELD' });
      }
    }
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push({ field: 'items', message: 'At least one line item is required', code: 'REQUIRED_FIELD' });
    } else {
      items.forEach((item: any, index: number) => {
        if (!item.description) {
          errors.push({ field: `items[${index}].description`, message: 'Item description is required', code: 'REQUIRED_FIELD' });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({ field: `items[${index}].quantity`, message: 'Item quantity must be positive', code: 'INVALID_VALUE' });
        }
        if (item.unitPrice === undefined || item.unitPrice < 0) {
          errors.push({ field: `items[${index}].unitPrice`, message: 'Item unit price must be non-negative', code: 'INVALID_VALUE' });
        }
      });
    }
    
    // Validate tax rate
    if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
      errors.push({ field: 'taxRate', message: 'Tax rate must be between 0 and 100', code: 'INVALID_VALUE' });
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  validateInvoiceId(id: string): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!id || id.trim().length === 0) {
      errors.push({ field: 'id', message: 'Invoice ID is required', code: 'REQUIRED_FIELD' });
    } else if (!/^inv_[a-zA-Z0-9_-]+$/.test(id)) {
      errors.push({ field: 'id', message: 'Invalid invoice ID format', code: 'INVALID_FORMAT' });
    }
    
    return { isValid: errors.length === 0, errors };
  }
}

class APIResponseFormatter {
  formatSuccessResponse(data: any, statusCode: number = 200): APIResponse {
    return {
      status: statusCode,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
  
  formatErrorResponse(error: ValidationError, statusCode: number = 400): APIResponse {
    return {
      status: statusCode,
      body: {
        error: 'ValidationError',
        message: error.message,
        field: error.field,
        code: error.code
      },
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
  
  formatNotFoundResponse(resource: string): APIResponse {
    return {
      status: 404,
      body: {
        error: 'NotFoundError',
        message: `${resource} not found`,
        code: 'RESOURCE_NOT_FOUND'
      },
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
  
  formatServerErrorResponse(message: string): APIResponse {
    return {
      status: 500,
      body: {
        error: 'ServerError',
        message: message,
        code: 'INTERNAL_SERVER_ERROR'
      },
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}

describe('API Request/Response Unit Tests', () => {
  let validator: APIRequestValidator;
  let formatter: APIResponseFormatter;

  beforeEach(() => {
    validator = new APIRequestValidator();
    formatter = new APIResponseFormatter();
  });

  describe('Request Validation', () => {
    test('should validate valid invoice request', () => {
      const validRequest: APIRequest = {
        body: {
          client: {
            name: 'John Doe',
            address: '123 Main St',
            email: 'john@example.com'
          },
          items: [
            {
              description: 'Web Development',
              quantity: 10,
              unitPrice: 75.00
            }
          ],
          taxRate: 10
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(validRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject request with missing body', () => {
      const invalidRequest: APIRequest = {
        body: null,
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'body',
        message: 'Request body is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject request with missing client', () => {
      const invalidRequest: APIRequest = {
        body: {
          items: [
            {
              description: 'Web Development',
              quantity: 10,
              unitPrice: 75.00
            }
          ]
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client',
        message: 'Client information is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject request with missing client name', () => {
      const invalidRequest: APIRequest = {
        body: {
          client: {
            address: '123 Main St',
            email: 'john@example.com'
          },
          items: [
            {
              description: 'Web Development',
              quantity: 10,
              unitPrice: 75.00
            }
          ]
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject request with empty items array', () => {
      const invalidRequest: APIRequest = {
        body: {
          client: {
            name: 'John Doe',
            address: '123 Main St',
            email: 'john@example.com'
          },
          items: []
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items',
        message: 'At least one line item is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject request with invalid line items', () => {
      const invalidRequest: APIRequest = {
        body: {
          client: {
            name: 'John Doe',
            address: '123 Main St',
            email: 'john@example.com'
          },
          items: [
            {
              description: '', // Invalid: empty description
              quantity: -1, // Invalid: negative quantity
              unitPrice: -50.00 // Invalid: negative price
            }
          ]
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      
      expect(result.errors[0]).toMatchObject({
        field: 'items[0].description',
        message: 'Item description is required',
        code: 'REQUIRED_FIELD'
      });
      
      expect(result.errors[1]).toMatchObject({
        field: 'items[0].quantity',
        message: 'Item quantity must be positive',
        code: 'INVALID_VALUE'
      });
      
      expect(result.errors[2]).toMatchObject({
        field: 'items[0].unitPrice',
        message: 'Item unit price must be non-negative',
        code: 'INVALID_VALUE'
      });
    });

    test('should reject request with invalid tax rate', () => {
      const invalidRequest: APIRequest = {
        body: {
          client: {
            name: 'John Doe',
            address: '123 Main St',
            email: 'john@example.com'
          },
          items: [
            {
              description: 'Web Development',
              quantity: 10,
              unitPrice: 75.00
            }
          ],
          taxRate: 150 // Invalid: over 100%
        },
        params: {},
        query: {},
        headers: {}
      };

      const result = validator.validateInvoiceRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'taxRate',
        message: 'Tax rate must be between 0 and 100',
        code: 'INVALID_VALUE'
      });
    });
  });

  describe('Invoice ID Validation', () => {
    test('should validate valid invoice ID', () => {
      const validId = 'inv_1234567890';
      const result = validator.validateInvoiceId(validId);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty invoice ID', () => {
      const invalidId = '';
      const result = validator.validateInvoiceId(invalidId);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'id',
        message: 'Invoice ID is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject invalid invoice ID format', () => {
      const invalidId = 'invalid-id-format';
      const result = validator.validateInvoiceId(invalidId);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'id',
        message: 'Invalid invoice ID format',
        code: 'INVALID_FORMAT'
      });
    });
  });

  describe('Response Formatting', () => {
    test('should format success response', () => {
      const data = { id: 'inv_123', status: 'created' };
      const response = formatter.formatSuccessResponse(data, 201);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(data);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    test('should format validation error response', () => {
      const error: ValidationError = {
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      };
      
      const response = formatter.formatErrorResponse(error, 400);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'ValidationError',
        message: 'Client name is required',
        field: 'client.name',
        code: 'REQUIRED_FIELD'
      });
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    test('should format not found response', () => {
      const response = formatter.formatNotFoundResponse('Invoice');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'NotFoundError',
        message: 'Invoice not found',
        code: 'RESOURCE_NOT_FOUND'
      });
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    test('should format server error response', () => {
      const response = formatter.formatServerErrorResponse('Database connection failed');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'ServerError',
        message: 'Database connection failed',
        code: 'INTERNAL_SERVER_ERROR'
      });
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error Response Consistency', () => {
    test('should maintain consistent error response format', () => {
      const error: ValidationError = {
        field: 'items[0].quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      };
      
      const response = formatter.formatErrorResponse(error);
      
      // Check all required fields are present
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('field');
      expect(response.body).toHaveProperty('code');
      
      // Check field types
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.field).toBe('string');
      expect(typeof response.body.code).toBe('string');
    });
  });
});
