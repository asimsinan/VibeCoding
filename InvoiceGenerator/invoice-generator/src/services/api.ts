/**
 * API Service for Invoice Generator
 * 
 * Handles all API communication with the backend server
 */

import { Invoice, InvoiceRequest } from '../types/invoice';

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:3000/api/v1';

export class ApiService {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Create a new invoice
  static async createInvoice(invoiceData: InvoiceRequest): Promise<Invoice> {
    const response = await this.request<{ success: boolean; data: Invoice; message: string }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
    return response.data;
  }

  // Get invoice by ID
  static async getInvoice(id: string): Promise<Invoice> {
    const response = await this.request<{ success: boolean; data: Invoice }>(`/invoices/${id}`);
    return response.data;
  }

  // Update invoice
  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const response = await this.request<{ success: boolean; data: Invoice }>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  // Generate PDF for invoice
  static async generatePDF(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invoice not found. The invoice may have been deleted or does not exist.');
      }
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    return response.blob();
  }

  // Download PDF
  static async downloadPDF(id: string, filename?: string): Promise<void> {
    const blob = await this.generatePDF(id);
    const url = URL.createObjectURL(blob);
    
    // If no filename provided, fetch invoice data to get proper invoice number
    let downloadFilename = filename;
    if (!downloadFilename) {
      try {
        const invoice = await this.getInvoice(id);
        downloadFilename = `${invoice.invoiceNumber}.pdf`;
      } catch (error) {
        console.warn('Failed to fetch invoice data for filename, using fallback:', error);
        downloadFilename = `invoice-${id}.pdf`;
      }
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Invoice numbering configuration methods
  static async getNumberingConfig(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any; message: string }>('/invoices/numbering/config', {
      method: 'GET',
    });
    return response.data;
  }

  static async updateNumberingConfig(config: any): Promise<void> {
    await this.request<{ success: boolean; message: string }>('/invoices/numbering/config', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  static async getNumberingStats(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any; message: string }>('/invoices/numbering/stats', {
      method: 'GET',
    });
    return response.data;
  }

  static async resetNumbering(): Promise<void> {
    await this.request<{ success: boolean; message: string }>('/invoices/numbering/reset', {
      method: 'POST',
    });
  }
}
