import { describe, it, expect } from '@jest/globals';
import { 
  serializeInvoice, 
  deserializeInvoice,
  serializeInvoiceRequest,
  deserializeInvoiceRequest,
  serializeInvoiceResponse
} from '../../src/lib/invoice-serializer';
import { Invoice, InvoiceRequest, InvoiceResponse } from '../../src/types/invoice';

/**
 * Contract Tests for InvoiceSerializer
 * 
 * These tests define the contract that InvoiceSerializer must fulfill.
 * They test the input/output contracts for serialization functions.
 */

describe('InvoiceSerializer Contract Tests', () => {
  describe('serializeInvoice', () => {
    it('should accept Invoice object and return JSON string', () => {
      const invoice: Invoice = {
        id: 'inv_123',
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [{
          id: '1',
          description: 'Web Development',
          quantity: 10,
          unitPrice: 75.00,
          lineTotal: 750.00
        }],
        subtotal: 750.00,
        taxRate: 10,
        taxAmount: 75.00,
        total: 825.00,
        invoiceNumber: 'INV-001',
        date: '2024-01-15',
        status: 'draft'
      };
      
      const result = serializeInvoice(invoice);
        expect(typeof result).toBe('string');
        expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('deserializeInvoice', () => {
    it('should accept JSON string and return Invoice object', () => {
      const jsonString = JSON.stringify({
        id: 'inv_123',
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [{
          id: '1',
          description: 'Web Development',
          quantity: 10,
          unitPrice: 75.00,
          lineTotal: 750.00
        }],
        subtotal: 750.00,
        taxRate: 10,
        taxAmount: 75.00,
        total: 825.00,
        invoiceNumber: 'INV-001',
        date: '2024-01-15',
        status: 'draft'
      });
      
      const result = deserializeInvoice(jsonString);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('client');
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('subtotal');
        expect(result).toHaveProperty('total');
    });
  });

  describe('serializeInvoiceRequest', () => {
    it('should accept InvoiceRequest object and return JSON string', () => {
      const request: InvoiceRequest = {
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [{
          description: 'Web Development',
          quantity: 10,
          unitPrice: 75.00
        }],
        taxRate: 10
      };
      
      const result = serializeInvoiceRequest(request);
        expect(typeof result).toBe('string');
        expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('serializeInvoiceResponse', () => {
    it('should accept InvoiceResponse object and return JSON string', () => {
      const response: InvoiceResponse = {
        id: 'inv_123',
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [{
          id: '1',
          description: 'Web Development',
          quantity: 10,
          unitPrice: 75.00,
          lineTotal: 750.00
        }],
        subtotal: 750.00,
        taxAmount: 75.00,
        total: 825.00,
        invoiceNumber: 'INV-001',
        date: '2024-01-15',
        status: 'draft'
      };
      
      const result = serializeInvoiceResponse(response);
        expect(typeof result).toBe('string');
        expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('deserializeInvoiceRequest', () => {
    it('should accept JSON string and return InvoiceRequest object', () => {
      const jsonString = JSON.stringify({
        client: {
          name: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com'
        },
        items: [{
          description: 'Web Development',
          quantity: 10,
          unitPrice: 75.00
        }],
        taxRate: 10
      });
      
      const result = deserializeInvoiceRequest(jsonString);
        expect(result).toHaveProperty('client');
        expect(result).toHaveProperty('items');
        expect(Array.isArray(result.items)).toBe(true);
    });
  });
});

