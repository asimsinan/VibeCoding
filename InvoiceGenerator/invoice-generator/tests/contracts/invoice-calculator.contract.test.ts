import { describe, it, expect } from '@jest/globals';
import { LineItem } from '../../src/types/lineItem';
import { 
  calculateLineTotal, 
  calculateSubtotal, 
  calculateTax, 
  calculateTotal 
} from '../../src/lib/invoice-calculator';

/**
 * Contract Tests for InvoiceCalculator
 * 
 * These tests define the contract that InvoiceCalculator must fulfill.
 * They test the input/output contracts without implementation details.
 */

describe('InvoiceCalculator Contract Tests', () => {
  describe('calculateLineTotal', () => {
    it('should accept quantity and unitPrice and return lineTotal', () => {
      // Contract: (quantity: number, unitPrice: number) => number
      const quantity = 5;
      const unitPrice = 10.50;
      
      // Function is now implemented
      const result = calculateLineTotal(quantity, unitPrice);
      expect(typeof result).toBe('number');
      expect(result).toBe(52.50);
    });

    it('should handle decimal quantities correctly', () => {
      const quantity = 2.5;
      const unitPrice = 4.00;
      
      const result = calculateLineTotal(quantity, unitPrice);
      expect(result).toBe(10.00);
    });

    it('should handle zero quantity', () => {
      const quantity = 0;
      const unitPrice = 10.00;
      
      const result = calculateLineTotal(quantity, unitPrice);
      expect(result).toBe(0);
    });
  });

  describe('calculateSubtotal', () => {
    it('should accept array of line items and return subtotal', () => {
      const lineItems = [
        { quantity: 2, unitPrice: 10.00, lineTotal: 20.00 },
        { quantity: 1, unitPrice: 15.50, lineTotal: 15.50 }
      ];
      
      const result = calculateSubtotal(lineItems);
      expect(typeof result).toBe('number');
      expect(result).toBe(35.50);
    });

    it('should handle empty array', () => {
      const lineItems: LineItem[] = [];
      
      const result = calculateSubtotal(lineItems);
      expect(result).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should accept subtotal and taxRate and return tax amount', () => {
      const subtotal = 100.00;
      const taxRate = 10;
      
      const result = calculateTax(subtotal, taxRate);
      expect(typeof result).toBe('number');
      expect(result).toBe(10.00);
    });

    it('should handle zero tax rate', () => {
      const subtotal = 100.00;
      const taxRate = 0;
      
      const result = calculateTax(subtotal, taxRate);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should accept subtotal and taxAmount and return total', () => {
      const subtotal = 100.00;
      const taxAmount = 10.00;
      
      const result = calculateTotal(subtotal, taxAmount);
      expect(typeof result).toBe('number');
      expect(result).toBe(110.00);
    });
  });
});

