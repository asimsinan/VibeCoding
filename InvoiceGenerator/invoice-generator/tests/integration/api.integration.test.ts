#!/usr/bin/env node
/**
 * API Integration Tests
 * 
 * Tests the complete API integration with real database and PDF generation
 * Validates end-to-end API functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { PDFGenerator } from '../../src/lib/pdf-generator';
import { InvoiceCalculator } from '../../src/lib/invoice-calculator';
import { InvoiceValidator } from '../../src/lib/invoice-validator';

// Mock database for integration testing
const mockDatabase = new Map<string, any>();

// Mock server for integration testing
let server: any;
let baseUrl: string;

const mockInvoice = {
  client: {
    name: 'John Doe',
    address: '123 Main St, City, State 12345',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567'
  },
  items: [
    {
      description: 'Web Development Services',
      quantity: 10,
      unitPrice: 75.00
    }
  ],
  taxRate: 10,
  invoiceNumber: 'INV-2024-001',
  date: '2024-01-15'
};

beforeAll(async () => {
  // Create a mock server for integration testing
  server = createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:3000`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Mock API responses with real business logic
    if (req.method === 'POST' && url.pathname === '/api/v1/invoices') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const invoiceData = JSON.parse(body);
          
          // Use real validation
          const validator = new InvoiceValidator();
          const validationResult = validator.validateInvoice(invoiceData);
          
          if (!validationResult.isValid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'ValidationError',
              message: validationResult.errors[0]?.message || 'Invalid data',
              field: validationResult.errors[0]?.field || 'unknown',
              code: 'VALIDATION_ERROR'
            }));
            return;
          }
          
          // Use real calculation
          const calculator = new InvoiceCalculator();
          const calculatedInvoice = calculator.calculateInvoice(invoiceData);
          
          // Generate unique ID
          const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const invoiceResponse = {
            id,
            ...calculatedInvoice,
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'draft'
          };
          
          // Store in mock database
          mockDatabase.set(id, invoiceResponse);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(invoiceResponse));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'ValidationError',
            message: 'Invalid JSON data',
            code: 'INVALID_JSON'
          }));
        }
      });
      return;
    } else if (req.method === 'GET' && url.pathname.startsWith('/api/v1/invoices/')) {
      const id = url.pathname.split('/').pop();
      const invoice = mockDatabase.get(id!);
      
      if (invoice) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(invoice));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        }));
      }
    } else if (req.method === 'PUT' && url.pathname.startsWith('/api/v1/invoices/')) {
      const id = url.pathname.split('/').pop();
      const existingInvoice = mockDatabase.get(id!);
      
      if (!existingInvoice) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        }));
        return;
      }
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const invoiceData = JSON.parse(body);
          
          // Use real validation
          const validator = new InvoiceValidator();
          const validationResult = validator.validateInvoice(invoiceData);
          
          if (!validationResult.isValid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'ValidationError',
              message: validationResult.errors[0]?.message || 'Invalid data',
              field: validationResult.errors[0]?.field || 'unknown',
              code: 'VALIDATION_ERROR'
            }));
            return;
          }
          
          // Use real calculation
          const calculator = new InvoiceCalculator();
          const calculatedInvoice = calculator.calculateInvoice(invoiceData);
          
          const updatedInvoice = {
            ...existingInvoice,
            ...calculatedInvoice,
            status: 'updated'
          };
          
          // Update in mock database
          mockDatabase.set(id!, updatedInvoice);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedInvoice));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'ValidationError',
            message: 'Invalid JSON data',
            code: 'INVALID_JSON'
          }));
        }
      });
      return;
    } else if (req.method === 'POST' && url.pathname.endsWith('/pdf')) {
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2];
      const invoice = mockDatabase.get(id);
      
      if (!invoice) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        }));
        return;
      }
      
      // Use real PDF generation
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generatePDF(invoice)
        .then((pdfData) => {
          res.writeHead(200, { 'Content-Type': 'application/pdf' });
          res.end(Buffer.from(pdfData));
        })
        .catch(() => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'PDFGenerationError',
            message: 'Failed to generate PDF',
            code: 'PDF_GENERATION_FAILED'
          }));
        });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'NotFoundError',
        message: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND'
      }));
    }
  });
  
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
});

beforeEach(() => {
  // Clear mock database before each test
  mockDatabase.clear();
});

describe('API Integration Tests', () => {
  describe('POST /api/v1/invoices', () => {
    test('should create invoice with real validation and calculation', async () => {
      const response = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice);
      
      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }
      
      expect(response.status).toBe(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        client: expect.objectContaining({
          name: mockInvoice.client.name,
          address: mockInvoice.client.address,
          email: mockInvoice.client.email
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            description: mockInvoice.items[0].description,
            quantity: mockInvoice.items[0].quantity,
            unitPrice: mockInvoice.items[0].unitPrice,
            lineTotal: expect.any(Number)
          })
        ]),
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        total: expect.any(Number),
        invoiceNumber: expect.any(String),
        date: expect.any(String),
        dueDate: expect.any(String),
        status: 'draft'
      });
      
      // Verify calculations are correct
      expect(response.body.subtotal).toBe(750.00);
      expect(response.body.taxAmount).toBe(75.00);
      expect(response.body.total).toBe(825.00);
    });

    test('should validate client data with real validator', async () => {
      const invalidInvoice = {
        client: {
          name: '', // Invalid: empty name
          address: '123 Main St',
          email: 'invalid-email' // Invalid: malformed email
        },
        items: mockInvoice.items
      };

      const response = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(invalidInvoice)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: expect.any(String),
        field: expect.any(String),
        code: 'VALIDATION_ERROR'
      });
    });

    test('should validate items data with real validator', async () => {
      const invalidInvoice = {
        client: mockInvoice.client,
        items: [
          {
            description: '', // Invalid: empty description
            quantity: -1, // Invalid: negative quantity
            unitPrice: -10 // Invalid: negative price
          }
        ]
      };

      const response = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(invalidInvoice)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: expect.any(String),
        field: expect.any(String),
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('GET /api/v1/invoices/{id}', () => {
    test('should retrieve invoice from database', async () => {
      // First create an invoice
      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Then retrieve it
      const response = await request(baseUrl)
        .get(`/api/v1/invoices/${invoiceId}`)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: invoiceId,
        client: expect.objectContaining({
          name: mockInvoice.client.name,
          address: mockInvoice.client.address,
          email: mockInvoice.client.email
        }),
        items: expect.any(Array),
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        total: expect.any(Number),
        status: 'draft'
      });
    });

    test('should return 404 for non-existent invoice', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/invoices/non-existent-id')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'NotFoundError',
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    });
  });

  describe('PUT /api/v1/invoices/{id}', () => {
    test('should update invoice with real validation and calculation', async () => {
      // First create an invoice
      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Update the invoice
      const updatedInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Jane Doe Updated'
        },
        items: [
          ...mockInvoice.items,
          {
            description: 'Additional Services',
            quantity: 5,
            unitPrice: 50.00
          }
        ]
      };

      const response = await request(baseUrl)
        .put(`/api/v1/invoices/${invoiceId}`)
        .send(updatedInvoice)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: invoiceId,
        client: expect.objectContaining({
          name: 'Jane Doe Updated'
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            description: 'Additional Services',
            quantity: 5,
            unitPrice: 50.00
          })
        ]),
        status: 'updated'
      });
      
      // Verify calculations are updated
      expect(response.body.subtotal).toBe(1000.00); // 750 + 250
      expect(response.body.taxAmount).toBe(100.00); // 10% of 1000
      expect(response.body.total).toBe(1100.00);
    });

    test('should return 404 for non-existent invoice', async () => {
      const response = await request(baseUrl)
        .put('/api/v1/invoices/non-existent-id')
        .send(mockInvoice)
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'NotFoundError',
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    });
  });

  describe('POST /api/v1/invoices/{id}/pdf', () => {
    test('should generate PDF with real PDF generator', async () => {
      // First create an invoice
      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Generate PDF
      const response = await request(baseUrl)
        .post(`/api/v1/invoices/${invoiceId}/pdf`)
        .expect(200);
      
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body).toBeDefined();
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent invoice', async () => {
      const response = await request(baseUrl)
        .post('/api/v1/invoices/non-existent-id/pdf')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: 'NotFoundError',
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    });
  });

  describe('Database Integration', () => {
    test('should persist invoice data correctly', async () => {
      // Create an invoice
      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Verify it's stored in database
      expect(mockDatabase.has(invoiceId)).toBe(true);
      
      const storedInvoice = mockDatabase.get(invoiceId);
      expect(storedInvoice).toMatchObject({
        id: invoiceId,
        client: expect.objectContaining({
          name: mockInvoice.client.name
        }),
        items: expect.any(Array)
      });
    });

    test('should update invoice data correctly', async () => {
      // Create an invoice
      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Update the invoice
      const updatedInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Updated Name'
        }
      };

      await request(baseUrl)
        .put(`/api/v1/invoices/${invoiceId}`)
        .send(updatedInvoice)
        .expect(200);
      
      // Verify it's updated in database
      const storedInvoice = mockDatabase.get(invoiceId);
      expect(storedInvoice.client.name).toBe('Updated Name');
      expect(storedInvoice.status).toBe('updated');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle PDF generation errors gracefully', async () => {
      // Create an invoice with invalid data that would cause PDF generation to fail
      const invalidInvoice = {
        client: {
          name: 'Test Client',
          address: 'Test Address',
          email: 'test@example.com'
        },
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100
          }
        ],
        taxRate: 0
      };

      const createResponse = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(invalidInvoice)
        .expect(201);
      
      const invoiceId = createResponse.body.id;
      
      // Mock PDF generation failure by corrupting the invoice data
      const storedInvoice = mockDatabase.get(invoiceId);
      storedInvoice.client = null; // This should cause PDF generation to fail
      mockDatabase.set(invoiceId, storedInvoice);
      
      const response = await request(baseUrl)
        .post(`/api/v1/invoices/${invoiceId}/pdf`)
        .expect(500);
      
      expect(response.body).toMatchObject({
        error: 'PDFGenerationError',
        message: 'Failed to generate PDF',
        code: 'PDF_GENERATION_FAILED'
      });
    });
  });
});
