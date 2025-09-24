#!/usr/bin/env node
/**
 * API Validation Unit Tests
 * 
 * Tests the API validation logic and error handling
 */

import { describe, test, expect } from '@jest/globals';
import { InvoiceValidator } from '../../../src/lib/invoice-validator';

describe('API Validation Unit Tests', () => {
  let validator: InvoiceValidator;

  beforeEach(() => {
    validator = new InvoiceValidator();
  });

  describe('Client Validation', () => {
    test('should validate valid client data', () => {
      const validClient = {
        name: 'John Doe',
        address: '123 Main St, City, State 12345',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567'
      };

      const result = validator.validateClient(validClient);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject client with missing name', () => {
      const invalidClient = {
        name: '',
        address: '123 Main St',
        email: 'john@example.com'
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject client with invalid email', () => {
      const invalidClient = {
        name: 'John Doe',
        address: '123 Main St',
        email: 'invalid-email'
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    });

    test('should reject client with name too long', () => {
      const invalidClient = {
        name: 'A'.repeat(101), // 101 characters
        address: '123 Main St',
        email: 'john@example.com'
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.name',
        message: 'Client name must be 100 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    test('should reject client with address too long', () => {
      const invalidClient = {
        name: 'John Doe',
        address: 'A'.repeat(201), // 201 characters
        email: 'john@example.com'
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.address',
        message: 'Client address must be 200 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    test('should reject client with phone too long', () => {
      const invalidClient = {
        name: 'John Doe',
        address: '123 Main St',
        email: 'john@example.com',
        phone: 'A'.repeat(21) // 21 characters
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'client.phone',
        message: 'Client phone must be 20 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });
  });

  describe('Line Item Validation', () => {
    test('should validate valid line item', () => {
      const validItem = {
        id: '1',
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };

      const result = validator.validateLineItem(validItem);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject line item with empty description', () => {
      const invalidItem = {
        id: '1',
        description: '',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };

      const result = validator.validateLineItem(invalidItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items.description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject line item with negative quantity', () => {
      const invalidItem = {
        id: '1',
        description: 'Web Development Services',
        quantity: -1,
        unitPrice: 75.00,
        lineTotal: -75.00
      };

      const result = validator.validateLineItem(invalidItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items.quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      });
    });

    test('should reject line item with negative unit price', () => {
      const invalidItem = {
        id: '1',
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: -75.00,
        lineTotal: -750.00
      };

      const result = validator.validateLineItem(invalidItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items.unitPrice',
        message: 'Unit price cannot be negative',
        code: 'INVALID_VALUE'
      });
    });

    test('should reject line item with description too long', () => {
      const invalidItem = {
        id: '1',
        description: 'A'.repeat(201), // 201 characters
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };

      const result = validator.validateLineItem(invalidItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items.description',
        message: 'Description must be 200 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });
  });

  describe('Invoice Validation', () => {
    test('should validate complete valid invoice', () => {
      const validInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St, City, State 12345',
          email: 'john.doe@example.com',
          phone: '+1-555-123-4567'
        },
        items: [
          {
            id: '1',
            description: 'Web Development Services',
            quantity: 10,
            unitPrice: 75.00,
            lineTotal: 750.00
          }
        ],
        taxRate: 10
      };

      const result = validator.validateInvoice(validInvoice);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invoice with empty items array', () => {
      const invalidInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: []
      };

      const result = validator.validateInvoice(invalidInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items',
        message: 'At least one line item is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject invoice with missing items', () => {
      const invalidInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        }
        // Missing items property
      };

      const result = validator.validateInvoice(invalidInvoice as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'items',
        message: 'At least one line item is required',
        code: 'REQUIRED_FIELD'
      });
    });

    test('should reject invoice with invalid tax rate', () => {
      const invalidInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [
          {
            id: '1',
            description: 'Web Development Services',
            quantity: 10,
            unitPrice: 75.00,
            lineTotal: 750.00
          }
        ],
        taxRate: 150 // Invalid: over 100%
      };

      const result = validator.validateInvoice(invalidInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'taxRate',
        message: 'Tax rate cannot exceed 100%',
        code: 'INVALID_VALUE'
      });
    });

    test('should reject invoice with negative tax rate', () => {
      const invalidInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [
          {
            id: '1',
            description: 'Web Development Services',
            quantity: 10,
            unitPrice: 75.00,
            lineTotal: 750.00
          }
        ],
        taxRate: -10 // Invalid: negative
      };

      const result = validator.validateInvoice(invalidInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'taxRate',
        message: 'Tax rate cannot be negative',
        code: 'INVALID_VALUE'
      });
    });

    test('should validate multiple line items with errors', () => {
      const invalidInvoice = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [
          {
            id: '1',
            description: '', // Invalid: empty description
            quantity: -1, // Invalid: negative quantity
            unitPrice: 75.00,
            lineTotal: -75.00
          },
          {
            id: '2',
            description: 'Valid Item',
            quantity: 5,
            unitPrice: -50.00, // Invalid: negative price
            lineTotal: -250.00
          }
        ]
      };

      const result = validator.validateInvoice(invalidInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      
      // Check that errors are properly indexed
      expect(result.errors[0]).toMatchObject({
        field: 'items[0].description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD'
      });
      
      expect(result.errors[1]).toMatchObject({
        field: 'items[0].quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      });
      
      expect(result.errors[2]).toMatchObject({
        field: 'items[1].unitPrice',
        message: 'Unit price cannot be negative',
        code: 'INVALID_VALUE'
      });
    });
  });

  describe('Error Format Validation', () => {
    test('should return consistent error format', () => {
      const invalidClient = {
        name: '',
        address: '123 Main St',
        email: 'invalid-email'
      };

      const result = validator.validateClient(invalidClient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      
      // Check error structure
      result.errors.forEach(error => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(typeof error.code).toBe('string');
      });
    });
  });
});
