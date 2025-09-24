import { Client } from './client';
import { LineItem } from './lineItem';

export interface Invoice {
  id: string;
  client: Client;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface InvoiceRequest {
  client: Client;
  items: {
    description: string;
    quantity: number;
    price: number;  // API expects 'price', not 'unitPrice'
  }[];
  taxRate?: number;
}

export interface InvoiceResponse {
  id: string;
  client: Client;
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  field?: string;
  code: string;
}

// Component prop types
export interface InvoicePreviewProps {
  invoice: Invoice;
  isPrintMode?: boolean;
  className?: string;
}

export interface PDFDownloadButtonProps {
  invoice: Invoice;
  onDownload: (invoice: Invoice) => Promise<void>;
  disabled?: boolean;
  className?: string;
  style?: Record<string, any>;
}
