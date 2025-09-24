/**
 * Invoice Generator Core Library
 * 
 * Main export file for all core library functionality.
 * This provides a clean API for the invoice generation system.
 */

// Calculator functions
export {
  calculateLineTotal,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateInvoiceTotals,
  formatCurrency,
  formatCurrencyWithSeparators,
  type LineItem as CalculatorLineItem
} from './invoice-calculator';

// Validator functions
export {
  validateClient,
  validateLineItem,
  isValidEmail,
  validateRequiredFields,
  validateTaxRate,
  validateInvoiceNumber,
  validateDate,
  validateInvoice,
  type ValidationResult
} from './invoice-validator';

// Serializer functions
export {
  serializeInvoice,
  deserializeInvoice,
  serializeInvoiceRequest,
  deserializeInvoiceRequest,
  serializeInvoiceResponse,
  deserializeInvoiceResponse,
  invoiceToResponse,
  requestToInvoice,
  generateInvoiceId,
  generateInvoiceNumber,
  formatInvoiceForDisplay
} from './invoice-serializer';

// PDF Generator functions
export {
  PDFGenerator,
  PDFStyler,
  PDFDownloader,
  generateAndDownloadPDF,
  generatePDF,
  downloadPDF,
  generateFilename,
  type PDFStylingOptions,
  type PDFLayoutOptions
} from './pdf-generator';

// Re-export types from the main types file
export type {
  Invoice,
  InvoiceRequest,
  InvoiceResponse,
  ValidationError,
  ErrorResponse
} from '@/types/invoice';

// Re-export Client and LineItem types from their own files
export type { Client } from '@/types/client';
export type { LineItem } from '@/types/lineItem';
