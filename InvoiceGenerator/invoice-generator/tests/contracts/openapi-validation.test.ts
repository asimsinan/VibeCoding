#!/usr/bin/env node
/**
 * OpenAPI Specification Validation Tests
 * 
 * Validates the OpenAPI 3.0 specification file
 * Ensures schema compliance and completeness
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

describe('OpenAPI Specification Validation', () => {
  let apiSpec: any;

  beforeAll(() => {
    const specPath = join(process.cwd(), 'api-spec.yaml');
    const specContent = readFileSync(specPath, 'utf8');
    apiSpec = YAML.parse(specContent);
  });

  test('should have valid OpenAPI 3.0 structure', () => {
    expect(apiSpec).toHaveProperty('openapi');
    expect(apiSpec.openapi).toMatch(/^3\.\d+\.\d+$/);
    expect(apiSpec).toHaveProperty('info');
    expect(apiSpec).toHaveProperty('paths');
    expect(apiSpec).toHaveProperty('components');
  });

  test('should have complete info section', () => {
    expect(apiSpec.info).toHaveProperty('title');
    expect(apiSpec.info).toHaveProperty('version');
    expect(apiSpec.info).toHaveProperty('description');
    expect(apiSpec.info.title).toBe('Invoice Generator API');
    expect(apiSpec.info.version).toBe('1.0.0');
  });

  test('should have all required endpoints', () => {
    const paths = apiSpec.paths;
    
    expect(paths).toHaveProperty('/invoices');
    expect(paths).toHaveProperty('/invoices/{id}');
    expect(paths).toHaveProperty('/invoices/{id}/pdf');
    
    // POST /invoices
    expect(paths['/invoices']).toHaveProperty('post');
    expect(paths['/invoices'].post).toHaveProperty('requestBody');
    expect(paths['/invoices'].post).toHaveProperty('responses');
    expect(paths['/invoices'].post.responses).toHaveProperty('201');
    expect(paths['/invoices'].post.responses).toHaveProperty('400');
    
    // GET /invoices/{id}
    expect(paths['/invoices/{id}']).toHaveProperty('get');
    expect(paths['/invoices/{id}'].get).toHaveProperty('parameters');
    expect(paths['/invoices/{id}'].get).toHaveProperty('responses');
    expect(paths['/invoices/{id}'].get.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}'].get.responses).toHaveProperty('404');
    
    // PUT /invoices/{id}
    expect(paths['/invoices/{id}']).toHaveProperty('put');
    expect(paths['/invoices/{id}'].put).toHaveProperty('parameters');
    expect(paths['/invoices/{id}'].put).toHaveProperty('requestBody');
    expect(paths['/invoices/{id}'].put).toHaveProperty('responses');
    expect(paths['/invoices/{id}'].put.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}'].put.responses).toHaveProperty('404');
    
    // POST /invoices/{id}/pdf
    expect(paths['/invoices/{id}/pdf']).toHaveProperty('post');
    expect(paths['/invoices/{id}/pdf'].post).toHaveProperty('parameters');
    expect(paths['/invoices/{id}/pdf'].post).toHaveProperty('responses');
    expect(paths['/invoices/{id}/pdf'].post.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}/pdf'].post.responses).toHaveProperty('404');
  });

  test('should have complete schema definitions', () => {
    const schemas = apiSpec.components.schemas;
    
    expect(schemas).toHaveProperty('InvoiceRequest');
    expect(schemas).toHaveProperty('InvoiceResponse');
    expect(schemas).toHaveProperty('Client');
    expect(schemas).toHaveProperty('LineItem');
    expect(schemas).toHaveProperty('ErrorResponse');
  });

  test('should have valid InvoiceRequest schema', () => {
    const invoiceRequest = apiSpec.components.schemas.InvoiceRequest;
    
    expect(invoiceRequest.type).toBe('object');
    expect(invoiceRequest.required).toContain('client');
    expect(invoiceRequest.required).toContain('items');
    expect(invoiceRequest.properties).toHaveProperty('client');
    expect(invoiceRequest.properties).toHaveProperty('items');
    expect(invoiceRequest.properties).toHaveProperty('taxRate');
  });

  test('should have valid Client schema', () => {
    const client = apiSpec.components.schemas.Client;
    
    expect(client.type).toBe('object');
    expect(client.required).toContain('name');
    expect(client.required).toContain('address');
    expect(client.required).toContain('email');
    expect(client.properties).toHaveProperty('name');
    expect(client.properties).toHaveProperty('address');
    expect(client.properties).toHaveProperty('email');
    expect(client.properties).toHaveProperty('phone');
    
    // Validate email format
    expect(client.properties.email.format).toBe('email');
  });

  test('should have valid LineItem schema', () => {
    const lineItem = apiSpec.components.schemas.LineItem;
    
    expect(lineItem.type).toBe('object');
    expect(lineItem.required).toContain('description');
    expect(lineItem.required).toContain('quantity');
    expect(lineItem.required).toContain('unitPrice');
    expect(lineItem.properties).toHaveProperty('description');
    expect(lineItem.properties).toHaveProperty('quantity');
    expect(lineItem.properties).toHaveProperty('unitPrice');
    
    // Validate numeric constraints
    expect(lineItem.properties.quantity.minimum).toBe(0.01);
    expect(lineItem.properties.unitPrice.minimum).toBe(0);
  });

  test('should have valid InvoiceResponse schema', () => {
    const invoiceResponse = apiSpec.components.schemas.InvoiceResponse;
    
    expect(invoiceResponse.type).toBe('object');
    expect(invoiceResponse.properties).toHaveProperty('id');
    expect(invoiceResponse.properties).toHaveProperty('client');
    expect(invoiceResponse.properties).toHaveProperty('items');
    expect(invoiceResponse.properties).toHaveProperty('subtotal');
    expect(invoiceResponse.properties).toHaveProperty('taxAmount');
    expect(invoiceResponse.properties).toHaveProperty('total');
    expect(invoiceResponse.properties).toHaveProperty('invoiceNumber');
    expect(invoiceResponse.properties).toHaveProperty('date');
    expect(invoiceResponse.properties).toHaveProperty('dueDate');
    expect(invoiceResponse.properties).toHaveProperty('status');
  });

  test('should have valid ErrorResponse schema', () => {
    const errorResponse = apiSpec.components.schemas.ErrorResponse;
    
    expect(errorResponse.type).toBe('object');
    expect(errorResponse.properties).toHaveProperty('error');
    expect(errorResponse.properties).toHaveProperty('message');
    expect(errorResponse.properties).toHaveProperty('field');
    expect(errorResponse.properties).toHaveProperty('code');
  });

  test('should have proper HTTP status codes', () => {
    const paths = apiSpec.paths;
    
    // POST /invoices
    expect(paths['/invoices'].post.responses).toHaveProperty('201');
    expect(paths['/invoices'].post.responses).toHaveProperty('400');
    
    // GET /invoices/{id}
    expect(paths['/invoices/{id}'].get.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}'].get.responses).toHaveProperty('404');
    
    // PUT /invoices/{id}
    expect(paths['/invoices/{id}'].put.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}'].put.responses).toHaveProperty('404');
    
    // POST /invoices/{id}/pdf
    expect(paths['/invoices/{id}/pdf'].post.responses).toHaveProperty('200');
    expect(paths['/invoices/{id}/pdf'].post.responses).toHaveProperty('404');
  });

  test('should have proper content types', () => {
    const paths = apiSpec.paths;
    
    // JSON responses
    expect(paths['/invoices'].post.responses['201'].content).toHaveProperty('application/json');
    expect(paths['/invoices/{id}'].get.responses['200'].content).toHaveProperty('application/json');
    expect(paths['/invoices/{id}'].put.responses['200'].content).toHaveProperty('application/json');
    
    // PDF response
    expect(paths['/invoices/{id}/pdf'].post.responses['200'].content).toHaveProperty('application/pdf');
    
    // Error responses
    expect(paths['/invoices'].post.responses['400'].content).toHaveProperty('application/json');
    expect(paths['/invoices/{id}'].get.responses['404'].content).toHaveProperty('application/json');
  });

  test('should have proper parameter definitions', () => {
    const paths = apiSpec.paths;
    
    // GET /invoices/{id} parameters
    const getParams = paths['/invoices/{id}'].get.parameters;
    expect(getParams).toHaveLength(1);
    expect(getParams[0].name).toBe('id');
    expect(getParams[0].in).toBe('path');
    expect(getParams[0].required).toBe(true);
    expect(getParams[0].schema.type).toBe('string');
    
    // PUT /invoices/{id} parameters
    const putParams = paths['/invoices/{id}'].put.parameters;
    expect(putParams).toHaveLength(1);
    expect(putParams[0].name).toBe('id');
    expect(putParams[0].in).toBe('path');
    expect(putParams[0].required).toBe(true);
    expect(putParams[0].schema.type).toBe('string');
    
    // POST /invoices/{id}/pdf parameters
    const pdfParams = paths['/invoices/{id}/pdf'].post.parameters;
    expect(pdfParams).toHaveLength(1);
    expect(pdfParams[0].name).toBe('id');
    expect(pdfParams[0].in).toBe('path');
    expect(pdfParams[0].required).toBe(true);
    expect(pdfParams[0].schema.type).toBe('string');
  });
});
