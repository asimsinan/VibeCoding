import { describe, it, expect } from '@jest/globals';
import { Client } from '../../src/types/client';
import { LineItem } from '../../src/types/lineItem';
import {
  validateClient,
  validateLineItem,
  isValidEmail,
  validateRequiredFields
} from '../../src/lib/invoice-validator';

/**
 * Unit Tests for InvoiceValidator
 * 
 * These tests verify the validation logic for client and line item data.
 * They test individual validation functions with various inputs.
 */

describe('InvoiceValidator Unit Tests', () => {
  describe('validateClient', () => {
    it('should validate correct client data', () => {
      const validClient: Client = {
        name: 'John Doe',
        address: '123 Main St, City, State 12345',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567'
      };
      
      const result = validateClient(validClient);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate client without phone number', () => {
      const validClient: Client = {
        name: 'Jane Smith',
        address: '456 Oak Ave, City, State 54321',
        email: 'jane.smith@example.com'
      };
      
      const result = validateClient(validClient);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty client name', () => {
      const invalidClient: Client = {
        name: '',
        address: '123 Main St',
        email: 'test@example.com'
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject client name with only whitespace', () => {
      const invalidClient: Client = {
        name: '   ',
        address: '123 Main St',
        email: 'test@example.com'
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject client name that is too long', () => {
      const longName = 'A'.repeat(101);
      const invalidClient: Client = {
        name: longName,
        address: '123 Main St',
        email: 'test@example.com'
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.name',
        message: 'Client name must be 100 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    it('should reject empty client address', () => {
      const invalidClient: Client = {
        name: 'John Doe',
        address: '',
        email: 'test@example.com'
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.address',
        message: 'Client address is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject client address that is too long', () => {
      const longAddress = 'A'.repeat(201);
      const invalidClient: Client = {
        name: 'John Doe',
        address: longAddress,
        email: 'test@example.com'
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.address',
        message: 'Client address must be 200 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    it('should reject empty client email', () => {
      const invalidClient: Client = {
        name: 'John Doe',
        address: '123 Main St',
        email: ''
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.email',
        message: 'Client email is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example..com',
        'test@.com',
        'test@example.',
        'test@.example.com'
      ];
      
      invalidEmails.forEach(email => {
        const invalidClient: Client = {
          name: 'John Doe',
          address: '123 Main St',
          email
        };
        
        const result = validateClient(invalidClient);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'client.email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];
      
      validEmails.forEach(email => {
        const validClient: Client = {
          name: 'John Doe',
          address: '123 Main St',
          email
        };
        
        const result = validateClient(validClient);
        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain('Invalid email format');
      });
    });

    it('should reject phone number that is too long', () => {
      const longPhone = '1'.repeat(21);
      const invalidClient: Client = {
        name: 'John Doe',
        address: '123 Main St',
        email: 'test@example.com',
        phone: longPhone
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'client.phone',
        message: 'Client phone must be 20 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    it('should handle multiple validation errors', () => {
      const invalidClient: Client = {
        name: '',
        address: '',
        email: 'invalid-email',
        phone: '1'.repeat(21)
      };
      
      const result = validateClient(invalidClient);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContainEqual({
        field: 'client.name',
        message: 'Client name is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'client.address',
        message: 'Client address is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'client.email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
      expect(result.errors).toContainEqual({
        field: 'client.phone',
        message: 'Client phone must be 20 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });
  });

  describe('validateLineItem', () => {
    it('should validate correct line item data', () => {
      const validLineItem: LineItem = {
        id: '1',
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };
      
      const result = validateLineItem(validLineItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty description', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: '',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject description with only whitespace', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: '   ',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject description that is too long', () => {
      const longDescription = 'A'.repeat(201);
      const invalidLineItem: LineItem = {
        id: '1',
        description: longDescription,
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.description',
        message: 'Description must be 200 characters or less',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    });

    it('should reject zero quantity', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: 'Test Service',
        quantity: 0,
        unitPrice: 75.00,
        lineTotal: 0
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      });
    });

    it('should reject negative quantity', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: 'Test Service',
        quantity: -5,
        unitPrice: 75.00,
        lineTotal: -375.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      });
    });

    it('should accept decimal quantities', () => {
      const validLineItem: LineItem = {
        id: '1',
        description: 'Test Service',
        quantity: 2.5,
        unitPrice: 40.00,
        lineTotal: 100.00
      };
      
      const result = validateLineItem(validLineItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative unit price', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: 'Test Service',
        quantity: 10,
        unitPrice: -75.00,
        lineTotal: -750.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items.unitPrice',
        message: 'Unit price cannot be negative',
        code: 'INVALID_VALUE'
      });
    });

    it('should accept zero unit price', () => {
      const validLineItem: LineItem = {
        id: '1',
        description: 'Free Service',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0
      };
      
      const result = validateLineItem(validLineItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple validation errors', () => {
      const invalidLineItem: LineItem = {
        id: '1',
        description: '',
        quantity: -5,
        unitPrice: -75.00,
        lineTotal: 375.00
      };
      
      const result = validateLineItem(invalidLineItem);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContainEqual({
        field: 'items.description',
        message: 'Description is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'items.quantity',
        message: 'Quantity must be positive',
        code: 'INVALID_VALUE'
      });
      expect(result.errors).toContainEqual({
        field: 'items.unitPrice',
        message: 'Unit price cannot be negative',
        code: 'INVALID_VALUE'
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];
      
      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example..com',
        'test@.com',
        'test@example.',
        'test@.example.com',
        '',
        ' ',
        'test @example.com',
        'test@ example.com'
      ];
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate when all required fields are present', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St'
      };
      const requiredFields = ['name', 'email', 'address'];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when required fields are missing', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const requiredFields = ['name', 'email', 'address'];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'address',
        message: 'address is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject when required fields are empty strings', () => {
      const data = {
        name: 'John Doe',
        email: '',
        address: '123 Main St'
      };
      const requiredFields = ['name', 'email', 'address'];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'email is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject when required fields are null or undefined', () => {
      const data = {
        name: 'John Doe',
        email: null,
        address: undefined
      };
      const requiredFields = ['name', 'email', 'address'];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'email is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'address',
        message: 'address is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should handle multiple missing required fields', () => {
      const data = {
        name: 'John Doe'
      };
      const requiredFields = ['name', 'email', 'address', 'phone'];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'email is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'address',
        message: 'address is required',
        code: 'REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'phone is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should handle empty required fields array', () => {
      const data = { name: 'John Doe' };
      const requiredFields: string[] = [];
      
      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
