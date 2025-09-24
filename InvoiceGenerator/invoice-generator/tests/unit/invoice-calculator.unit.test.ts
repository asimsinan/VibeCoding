import { describe, it, expect } from '@jest/globals';
import { 
  calculateLineTotal, 
  calculateSubtotal, 
  calculateTax, 
  calculateTotal
} from '../../src/lib/invoice-calculator';

/**
 * Unit Tests for InvoiceCalculator
 * 
 * These tests verify the business logic for invoice calculations.
 * They test individual functions in isolation with various inputs.
 */

describe('InvoiceCalculator Unit Tests', () => {
  describe('calculateLineTotal', () => {
    it('should calculate line total correctly for positive values', () => {
      expect(calculateLineTotal(5, 10.50)).toBe(52.50);
      expect(calculateLineTotal(2, 25.00)).toBe(50.00);
      expect(calculateLineTotal(1, 100.00)).toBe(100.00);
    });

    it('should handle decimal quantities correctly', () => {
      expect(calculateLineTotal(2.5, 4.00)).toBe(10.00);
      expect(calculateLineTotal(0.5, 20.00)).toBe(10.00);
      expect(calculateLineTotal(1.25, 8.00)).toBe(10.00);
    });

    it('should handle zero quantity', () => {
      expect(calculateLineTotal(0, 10.00)).toBe(0);
      expect(calculateLineTotal(0, 0)).toBe(0);
    });

    it('should handle zero unit price', () => {
      expect(calculateLineTotal(5, 0)).toBe(0);
      expect(calculateLineTotal(10, 0)).toBe(0);
    });

    it('should handle very small decimal values', () => {
      expect(calculateLineTotal(0.01, 100.00)).toBe(1.00);
      expect(calculateLineTotal(1, 0.01)).toBe(0.01);
    });

    it('should handle large numbers', () => {
      expect(calculateLineTotal(1000, 50.00)).toBe(50000.00);
      expect(calculateLineTotal(1, 999999.99)).toBe(999999.99);
    });

    it('should handle negative quantities', () => {
      expect(calculateLineTotal(-5, 10.00)).toBe(-50.00);
      expect(calculateLineTotal(-1, 25.00)).toBe(-25.00);
    });

    it('should handle negative unit prices', () => {
      expect(calculateLineTotal(5, -10.00)).toBe(-50.00);
      expect(calculateLineTotal(2, -25.00)).toBe(-50.00);
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for multiple line items', () => {
      const lineItems = [
        { lineTotal: 50.00 },
        { lineTotal: 25.50 },
        { lineTotal: 100.00 }
      ];
      expect(calculateSubtotal(lineItems)).toBe(175.50);
    });

    it('should handle empty array', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('should handle single line item', () => {
      const lineItems = [{ lineTotal: 75.25 }];
      expect(calculateSubtotal(lineItems)).toBe(75.25);
    });

    it('should handle zero values', () => {
      const lineItems = [
        { lineTotal: 0 },
        { lineTotal: 50.00 },
        { lineTotal: 0 }
      ];
      expect(calculateSubtotal(lineItems)).toBe(50.00);
    });

    it('should handle negative values', () => {
      const lineItems = [
        { lineTotal: 100.00 },
        { lineTotal: -25.00 },
        { lineTotal: 50.00 }
      ];
      expect(calculateSubtotal(lineItems)).toBe(125.00);
    });

    it('should handle decimal values', () => {
      const lineItems = [
        { lineTotal: 10.99 },
        { lineTotal: 25.50 },
        { lineTotal: 0.01 }
      ];
      expect(calculateSubtotal(lineItems)).toBe(36.50);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly for standard rates', () => {
      expect(calculateTax(100.00, 10)).toBe(10.00);
      expect(calculateTax(200.00, 15)).toBe(30.00);
      expect(calculateTax(50.00, 8.5)).toBe(4.25);
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(100.00, 0)).toBe(0);
      expect(calculateTax(500.00, 0)).toBe(0);
    });

    it('should handle zero subtotal', () => {
      expect(calculateTax(0, 10)).toBe(0);
      expect(calculateTax(0, 15.5)).toBe(0);
    });

    it('should handle decimal tax rates', () => {
      expect(calculateTax(100.00, 8.25)).toBe(8.25);
      expect(calculateTax(200.00, 6.75)).toBe(13.50);
    });

    it('should handle very small amounts', () => {
      expect(calculateTax(0.01, 10)).toBe(0.001);
      expect(calculateTax(1.00, 0.1)).toBe(0.001);
    });

    it('should handle large amounts', () => {
      expect(calculateTax(10000.00, 10)).toBe(1000.00);
      expect(calculateTax(50000.00, 15.5)).toBe(7750.00);
    });

    it('should handle 100% tax rate', () => {
      expect(calculateTax(100.00, 100)).toBe(100.00);
      expect(calculateTax(50.00, 100)).toBe(50.00);
    });

    it('should handle negative subtotal', () => {
      expect(calculateTax(-100.00, 10)).toBe(-10.00);
      expect(calculateTax(-50.00, 15)).toBe(-7.50);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      expect(calculateTotal(100.00, 10.00)).toBe(110.00);
      expect(calculateTotal(200.00, 30.00)).toBe(230.00);
      expect(calculateTotal(50.00, 5.00)).toBe(55.00);
    });

    it('should handle zero tax amount', () => {
      expect(calculateTotal(100.00, 0)).toBe(100.00);
      expect(calculateTotal(500.00, 0)).toBe(500.00);
    });

    it('should handle zero subtotal', () => {
      expect(calculateTotal(0, 10.00)).toBe(10.00);
      expect(calculateTotal(0, 0)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(calculateTotal(99.99, 9.99)).toBeCloseTo(109.98, 2);
      expect(calculateTotal(50.25, 5.03)).toBeCloseTo(55.28, 2);
    });

    it('should handle negative values', () => {
      expect(calculateTotal(-100.00, 10.00)).toBe(-90.00);
      expect(calculateTotal(100.00, -10.00)).toBe(90.00);
      expect(calculateTotal(-100.00, -10.00)).toBe(-110.00);
    });

    it('should handle very small amounts', () => {
      expect(calculateTotal(0.01, 0.01)).toBe(0.02);
      expect(calculateTotal(1.00, 0.01)).toBe(1.01);
    });

    it('should handle large amounts', () => {
      expect(calculateTotal(10000.00, 1000.00)).toBe(11000.00);
      expect(calculateTotal(50000.00, 7500.00)).toBe(57500.00);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete invoice calculation', () => {
      const lineItems = [
        { lineTotal: 100.00 },
        { lineTotal: 50.00 },
        { lineTotal: 25.00 }
      ];
      
      const subtotal = calculateSubtotal(lineItems);
      const taxAmount = calculateTax(subtotal, 10);
      const total = calculateTotal(subtotal, taxAmount);
      
      expect(subtotal).toBe(175.00);
      expect(taxAmount).toBe(17.50);
      expect(total).toBe(192.50);
    });

    it('should handle invoice with zero tax', () => {
      const lineItems = [
        { lineTotal: 200.00 },
        { lineTotal: 100.00 }
      ];
      
      const subtotal = calculateSubtotal(lineItems);
      const taxAmount = calculateTax(subtotal, 0);
      const total = calculateTotal(subtotal, taxAmount);
      
      expect(subtotal).toBe(300.00);
      expect(taxAmount).toBe(0);
      expect(total).toBe(300.00);
    });

    it('should handle invoice with refunds (negative line items)', () => {
      const lineItems = [
        { lineTotal: 200.00 },
        { lineTotal: -50.00 },
        { lineTotal: 100.00 }
      ];
      
      const subtotal = calculateSubtotal(lineItems);
      const taxAmount = calculateTax(subtotal, 10);
      const total = calculateTotal(subtotal, taxAmount);
      
      expect(subtotal).toBe(250.00);
      expect(taxAmount).toBe(25.00);
      expect(total).toBe(275.00);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large numbers without overflow', () => {
      const largeNumber = 999999999.99;
      expect(calculateLineTotal(largeNumber, 1)).toBe(largeNumber);
      expect(calculateLineTotal(1, largeNumber)).toBe(largeNumber);
    });

    it('should handle very small decimal precision', () => {
      expect(calculateLineTotal(0.001, 1000)).toBe(1);
      expect(calculateTax(0.01, 0.1)).toBe(0.00001);
    });

    it('should maintain precision in calculations', () => {
      const result = calculateLineTotal(3, 0.1);
      expect(result).toBeCloseTo(0.3, 2);
      
      const subtotal = calculateSubtotal([{ lineTotal: 0.1 }, { lineTotal: 0.2 }]);
      expect(subtotal).toBeCloseTo(0.3, 2);
    });
  });
});
