#!/usr/bin/env node
/**
 * Simple API Integration Tests
 * 
 * Simplified integration tests to debug the basic API functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';
import { createServer } from 'http';
import { AddressInfo } from 'net';

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
  taxRate: 10
};

beforeAll(async () => {
  // Create a simple mock server
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
    
    // Simple POST /api/v1/invoices handler
    if (req.method === 'POST' && url.pathname === '/api/v1/invoices') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        console.log('Received body:', body);
        console.log('Body length:', body.length);
        console.log('Body type:', typeof body);
        
        try {
          const invoiceData = JSON.parse(body);
          console.log('Parsed invoice data:', invoiceData);
          
          // Simple response
          const response = {
            id: 'inv_1234567890',
            ...invoiceData,
            subtotal: 750.00,
            taxAmount: 75.00,
            total: 825.00,
            invoiceNumber: 'INV-2024-001',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'draft'
          };
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          console.log('JSON parse error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'ValidationError',
            message: 'Invalid JSON data',
            code: 'INVALID_JSON'
          }));
        }
      });
      return;
    }
    
    // Default 404 response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'NotFoundError',
      message: 'Endpoint not found',
      code: 'ENDPOINT_NOT_FOUND'
    }));
  });
  
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://localhost:${address.port}`;
      console.log('Mock server started on:', baseUrl);
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

describe('Simple API Integration Tests', () => {
  test('should create invoice with simple mock server', async () => {
    console.log('Sending request with data:', mockInvoice);
    
    const response = await request(baseUrl)
      .post('/api/v1/invoices')
      .send(mockInvoice);
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      client: expect.objectContaining({
        name: mockInvoice.client.name,
        address: mockInvoice.client.address,
        email: mockInvoice.client.email
      }),
      items: expect.any(Array),
      subtotal: expect.any(Number),
      taxAmount: expect.any(Number),
      total: expect.any(Number),
      invoiceNumber: expect.any(String),
      date: expect.any(String),
      dueDate: expect.any(String),
      status: 'draft'
    });
  });
});
