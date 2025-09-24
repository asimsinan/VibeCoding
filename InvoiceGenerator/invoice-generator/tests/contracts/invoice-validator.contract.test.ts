import { describe, it, expect } from '@jest/globals';
import { 
  validateClient, 
  validateLineItem, 
  validateRequiredFields,
  isValidEmail
} from '../../src/lib/invoice-validator';
import { Client } from '../../src/types/client';
import { LineItem } from '../../src/types/lineItem';

/**
 * Contract Tests for InvoiceValidator
 * 
 * These tests define the contract that InvoiceValidator must fulfill.
 * They test the input/output contracts for validation functions.
 */

describe('InvoiceValidator Contract Tests', () => {
  describe('validateClient', () => {
    it('should accept Client object and return validation result', () => {
      const validClient: Client = {
        name: 'John Doe',
        address: '123 Main St',
        email: 'john@example.com',
        phone: '+1-555-123-4567'
      };
      
      const result = validateClient(validClient);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return errors for invalid client data', () => {
      const invalidClient: Client = {
        name: '',
        address: '',
        email: 'invalid-email',
        phone: ''
      };
      
      const result = validateClient(invalidClient);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLineItem', () => {
    it('should accept LineItem object and return validation result', () => {
      const validLineItem: LineItem = {
        id: '1',
        description: 'Web Development',
        quantity: 10,
        unitPrice: 75.00,
        lineTotal: 750.00
      };
      
      const result = validateLineItem(validLineItem);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return errors for invalid line item data', () => {
      const invalidLineItem: LineItem = {
        id: '',
        description: '',
        quantity: -1,
        unitPrice: -10.00,
        lineTotal: 0
      };
      
      const result = validateLineItem(invalidLineItem);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateEmail', () => {
    it('should accept email string and return boolean', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      
      const validResult = isValidEmail(validEmail);
      const invalidResult = isValidEmail(invalidEmail);
      expect(typeof validResult).toBe('boolean');
      expect(typeof invalidResult).toBe('boolean');
      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should accept object and required fields array and return validation result', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const requiredFields = ['name', 'email'];
      
      const result = validateRequiredFields(data, requiredFields);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});

// Contract function signatures (to be implemented)

