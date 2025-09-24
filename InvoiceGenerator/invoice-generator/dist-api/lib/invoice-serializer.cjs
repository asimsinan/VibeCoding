"use strict";
/**
 * Invoice Serializer Library
 *
 * Core serialization logic for converting invoice data to/from JSON
 * and other formats for storage and transmission.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeInvoice = serializeInvoice;
exports.deserializeInvoice = deserializeInvoice;
exports.serializeInvoiceRequest = serializeInvoiceRequest;
exports.deserializeInvoiceRequest = deserializeInvoiceRequest;
exports.serializeInvoiceResponse = serializeInvoiceResponse;
exports.deserializeInvoiceResponse = deserializeInvoiceResponse;
exports.invoiceToResponse = invoiceToResponse;
exports.requestToInvoice = requestToInvoice;
exports.generateInvoiceId = generateInvoiceId;
exports.generateInvoiceNumber = generateInvoiceNumber;
exports.formatInvoiceForDisplay = formatInvoiceForDisplay;
/**
 * Serialize an invoice to JSON string
 * @param invoice - Invoice object to serialize
 * @returns JSON string representation
 */
function serializeInvoice(invoice) {
    return JSON.stringify(invoice, null, 2);
}
/**
 * Deserialize an invoice from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice object
 */
function deserializeInvoice(jsonString) {
    const parsed = JSON.parse(jsonString);
    // Validate required fields
    if (!parsed.id || !parsed.client || !parsed.items ||
        !parsed.subtotal || !parsed.total || !parsed.invoiceNumber ||
        !parsed.date || !parsed.status) {
        throw new Error('Invalid invoice data: missing required fields');
    }
    return parsed;
}
/**
 * Serialize an invoice request to JSON string
 * @param request - Invoice request object to serialize
 * @returns JSON string representation
 */
function serializeInvoiceRequest(request) {
    return JSON.stringify(request, null, 2);
}
/**
 * Deserialize an invoice request from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice request object
 */
function deserializeInvoiceRequest(jsonString) {
    const parsed = JSON.parse(jsonString);
    // Validate required fields
    if (!parsed.client || !parsed.items) {
        throw new Error('Invalid invoice request data: missing required fields');
    }
    return parsed;
}
/**
 * Serialize an invoice response to JSON string
 * @param response - Invoice response object to serialize
 * @returns JSON string representation
 */
function serializeInvoiceResponse(response) {
    return JSON.stringify(response, null, 2);
}
/**
 * Deserialize an invoice response from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Invoice response object
 */
function deserializeInvoiceResponse(jsonString) {
    const parsed = JSON.parse(jsonString);
    // Validate required fields
    if (!parsed.id || !parsed.client || !parsed.items ||
        !parsed.subtotal || !parsed.total || !parsed.invoiceNumber ||
        !parsed.date || !parsed.status) {
        throw new Error('Invalid invoice response data: missing required fields');
    }
    return parsed;
}
/**
 * Convert an invoice to an invoice response
 * @param invoice - Invoice object to convert
 * @returns Invoice response object
 */
function invoiceToResponse(invoice) {
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
function requestToInvoice(request, id, invoiceNumber, date, status = 'draft') {
    // Calculate line totals
    const items = request.items.map(item => ({
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice
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
function generateInvoiceId(prefix = 'inv') {
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
function generateInvoiceNumber(prefix = 'INV', year = new Date().getFullYear(), sequence = 1) {
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `${prefix}-${year}-${paddedSequence}`;
}
/**
 * Format invoice data for display
 * @param invoice - Invoice object to format
 * @returns Formatted invoice data
 */
function formatInvoiceForDisplay(invoice) {
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
