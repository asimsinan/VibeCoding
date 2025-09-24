/**
 * Invoice Serializer Library
 * 
 * Core serialization logic for converting invoice data to/from JSON
 * and other formats for storage and transmission.
 */

import { Invoice, InvoiceRequest, InvoiceResponse } from '@/types/invoice';

/**
 * Serialize an invoice to JSON string
 * @param invoice - Invoice object to serialize
 * @returns JSON string representation
 */
export function serializeInvoice(invoice: Invoice): string {
  return JSON.stringify(invoice, null, 2);
}

/**
 * Deserialize an invoice from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice object
 */
export function deserializeInvoice(jsonString: string): Invoice {
  const parsed = JSON.parse(jsonString);
  
  // Validate required fields
  if (!parsed.id || !parsed.client || !parsed.items || 
      !parsed.subtotal || !parsed.total || !parsed.invoiceNumber || 
      !parsed.date || !parsed.status) {
    throw new Error('Invalid invoice data: missing required fields');
  }
  
  return parsed as Invoice;
}

/**
 * Serialize an invoice request to JSON string
 * @param request - Invoice request object to serialize
 * @returns JSON string representation
 */
export function serializeInvoiceRequest(request: InvoiceRequest): string {
  return JSON.stringify(request, null, 2);
}

/**
 * Deserialize an invoice request from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice request object
 */
export function deserializeInvoiceRequest(jsonString: string): InvoiceRequest {
  const parsed = JSON.parse(jsonString);
  
  // Validate required fields
  if (!parsed.client || !parsed.items) {
    throw new Error('Invalid invoice request data: missing required fields');
  }
  
  return parsed as InvoiceRequest;
}

/**
 * Serialize an invoice response to JSON string
 * @param response - Invoice response object to serialize
 * @returns JSON string representation
 */
export function serializeInvoiceResponse(response: InvoiceResponse): string {
  return JSON.stringify(response, null, 2);
}

/**
 * Deserialize an invoice response from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice response object
 */
export function deserializeInvoiceResponse(jsonString: string): InvoiceResponse {
  const parsed = JSON.parse(jsonString);
  
  // Validate required fields
  if (!parsed.id || !parsed.client || !parsed.items || 
      !parsed.subtotal || !parsed.total || !parsed.invoiceNumber || 
      !parsed.date || !parsed.status) {
    throw new Error('Invalid invoice response data: missing required fields');
  }
  
  return parsed as InvoiceResponse;
}

/**
 * Convert an invoice to an invoice response
 * @param invoice - Invoice object to convert
 * @returns Invoice response object
 */
export function invoiceToResponse(invoice: Invoice): InvoiceResponse {
  return {
    id: invoice.id,
    client: invoice.client,
    items: invoice.items,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    dueDate: invoice.dueDate,
    status: invoice.status
  };
}

/**
 * Convert an invoice request to an invoice
 * @param request - Invoice request object to convert
 * @param id - Invoice ID to assign
 * @param invoiceNumber - Invoice number to assign
 * @param date - Invoice date to assign
 * @param status - Invoice status to assign
 * @returns Invoice object
 */
export function requestToInvoice(
  request: InvoiceRequest,
  id: string,
  invoiceNumber: string,
  date: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' = 'draft'
): Invoice {
  // Calculate line totals
  const items = request.items.map(item => ({
    id: Math.random().toString(36).substr(2, 9), // Generate random ID
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.price,  // Map price back to unitPrice for internal use
    lineTotal: item.quantity * item.price
  }));
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxRate = request.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  return {
    id,
    client: request.client,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    invoiceNumber,
    date,
    status
  };
}

/**
 * Generate a unique invoice ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique invoice ID
 */
export function generateInvoiceId(prefix: string = 'inv'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a unique invoice number
 * @param prefix - Optional prefix for the number
 * @param year - Year for the invoice number
 * @param sequence - Sequence number
 * @returns Unique invoice number
 */
export function generateInvoiceNumber(
  prefix: string = 'INV',
  year: number = new Date().getFullYear(),
  sequence: number = 1
): string {
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Format invoice data for display
 * @param invoice - Invoice object to format
 * @returns Formatted invoice data
 */
export function formatInvoiceForDisplay(invoice: Invoice): {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: string;
  date: string;
  status: string;
} {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.client.name,
    clientEmail: invoice.client.email,
    total: `$${invoice.total.toFixed(2)}`,
    date: new Date(invoice.date).toLocaleDateString(),
    status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  };
}
