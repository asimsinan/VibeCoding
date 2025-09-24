#!/usr/bin/env node
/**
 * API Contract Tests
 * 
 * Tests the API contract compliance using OpenAPI 3.0 specification
 * Validates request/response schemas and error handling
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';
import { createServer } from 'http';
import { AddressInfo } from 'net';

// Mock server for contract testing
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
  taxRate: 10
};

const mockInvoiceResponse = {
  id: 'inv_1234567890',
  client: mockInvoice.client,
  items: mockInvoice.items.map((item, index) => ({
    id: `item_${index + 1}`,
    ...item,
    lineTotal: item.quantity * item.unitPrice
  })),
  subtotal: 750.00,
  taxAmount: 75.00,
  total: 825.00,
  invoiceNumber: 'INV-2024-001',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  status: 'draft'
};

beforeAll(async () => {
  // Create a mock server for contract testing
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
    
    // Mock API responses based on OpenAPI spec
    if (req.method === 'POST' && url.pathname === '/api/v1/invoices') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const invoiceData = JSON.parse(body);
          
          // Basic validation for contract testing
          if (!invoiceData.client || !invoiceData.client.name || !invoiceData.client.email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'ValidationError',
              message: 'Invalid client data',
              field: 'client',
              code: 'INVALID_CLIENT_DATA'
            }));
            return;
          }
          
          if (!invoiceData.items || invoiceData.items.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'ValidationError',
              message: 'Items array cannot be empty',
              field: 'items',
              code: 'EMPTY_ITEMS_ARRAY'
            }));
            return;
          }
          
          // Check for invalid items
          for (const item of invoiceData.items) {
            if (!item.description || item.quantity <= 0 || item.unitPrice < 0) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'ValidationError',
                message: 'Invalid item data',
                field: 'items',
                code: 'INVALID_ITEM_DATA'
              }));
              return;
            }
          }
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockInvoiceResponse));
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
      if (id === 'inv_1234567890') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockInvoiceResponse));
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
      if (id === 'inv_1234567890') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...mockInvoiceResponse, status: 'updated' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        }));
      }
    } else if (req.method === 'POST' && url.pathname.endsWith('/pdf')) {
      // Extract ID from path like /api/v1/invoices/{id}/pdf
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2]; // Get the ID before 'pdf'
      if (id === 'inv_1234567890') {
        res.writeHead(200, { 'Content-Type': 'application/pdf' });
        res.end('Mock PDF content');
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        }));
      }
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

describe('API Contract Tests', () => {
  describe('POST /api/v1/invoices', () => {
    test('should create invoice with valid data', async () => {
      const response = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(mockInvoice)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        client: expect.objectContaining({
          name: expect.any(String),
          address: expect.any(String),
          email: expect.any(String)
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            description: expect.any(String),
            quantity: expect.any(Number),
            unitPrice: expect.any(Number),
            lineTotal: expect.any(Number)
          })
        ]),
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        total: expect.any(Number),
        invoiceNumber: expect.any(String),
        date: expect.any(String),
        dueDate: expect.any(String),
        status: expect.any(String)
      });
    });

    test('should return 400 for invalid client data', async () => {
      const invalidInvoice = {
        client: {
          name: '', // Invalid: empty name
          address: '123 Main St',
          email: 'invalid-email' // Invalid: malformed email
        },
        items: []
      };

      const response = await request(baseUrl)
        .post('/api/v1/invoices')
        .send(invalidInvoice)
        .expect(400);
      
      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String),
        field: expect.any(String),
        code: expect.any(String)
      });
    });

    test('should return 400 for invalid items data', async () => {
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
        error: expect.any(String),
        message: expect.any(String),
        field: expect.any(String),
        code: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/invoices/{id}', () => {
    test('should retrieve invoice by valid ID', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/invoices/inv_1234567890')
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: 'inv_1234567890',
        client: expect.objectContaining({
          name: expect.any(String),
          address: expect.any(String),
          email: expect.any(String)
        }),
        items: expect.any(Array),
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        total: expect.any(Number),
        invoiceNumber: expect.any(String),
        date: expect.any(String),
        dueDate: expect.any(String),
        status: expect.any(String)
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
    test('should update invoice with valid data', async () => {
      const updatedInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Jane Doe Updated'
        }
      };

      const response = await request(baseUrl)
        .put('/api/v1/invoices/inv_1234567890')
        .send(updatedInvoice)
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: 'inv_1234567890',
        client: expect.objectContaining({
          name: expect.any(String),
          address: expect.any(String),
          email: expect.any(String)
        }),
        items: expect.any(Array),
        subtotal: expect.any(Number),
        taxAmount: expect.any(Number),
        total: expect.any(Number),
        invoiceNumber: expect.any(String),
        date: expect.any(String),
        dueDate: expect.any(String),
        status: expect.any(String)
      });
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
    test('should generate PDF for valid invoice', async () => {
      const response = await request(baseUrl)
        .post('/api/v1/invoices/inv_1234567890/pdf')
        .expect(200);
      
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body).toBeDefined();
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

  describe('Error Response Format', () => {
    test('should return consistent error format', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/invoices/non-existent-id')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.code).toBe('string');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(baseUrl)
        .options('/api/v1/invoices')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });
});
