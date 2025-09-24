#!/usr/bin/env node
/**
 * Invoice Service
 * 
 * Business logic for invoice operations
 */

import { InvoiceCalculator } from '../../lib/invoice-calculator';
import { InvoiceValidator } from '../../lib/invoice-validator';
import { invoiceNumberingService } from '../../lib/invoice-numbering';
import * as archiver from 'archiver';
import { Invoice } from '../../types/invoice';

// Mock database for demonstration
// In a real application, this would be a proper database
const mockDatabase = new Map<string, Invoice>();

export interface ListInvoicesOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListInvoicesResult {
  invoices: Invoice[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export class InvoiceService {
  private calculator: InvoiceCalculator;
  private validator: InvoiceValidator;

  constructor() {
    this.calculator = new InvoiceCalculator();
    this.validator = new InvoiceValidator();
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: any): Promise<Invoice> {
    // Validate the invoice data
    const validationResult = this.validator.validateInvoice(invoiceData);
    
    if (!validationResult.isValid) {
      const error = validationResult.errors[0];
      throw new Error(`Validation failed: ${error.message} (${error.field})`);
    }

    // Calculate invoice totals
    const calculatedInvoice = this.calculator.calculateInvoice(invoiceData);

    // Generate unique ID and invoice number
    const id = this.generateInvoiceId();
    const invoiceNumber = invoiceNumberingService.generateInvoiceNumber();

    // Create the complete invoice
    const invoice: Invoice = {
      id,
      invoiceNumber,
      ...calculatedInvoice,
      date: new Date().toISOString().split('T')[0],
      dueDate: this.calculateDueDate(30), // 30 days from now
      status: 'draft'
    };

    // Store in mock database
    mockDatabase.set(id, invoice);

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice | null> {
    return mockDatabase.get(id) || null;
  }

  /**
   * Update invoice by ID
   */
  async updateInvoice(id: string, invoiceData: any): Promise<Invoice | null> {
    const existingInvoice = mockDatabase.get(id);
    
    if (!existingInvoice) {
      return null;
    }

    // Validate the updated invoice data
    const validationResult = this.validator.validateInvoice(invoiceData);
    
    if (!validationResult.isValid) {
      const error = validationResult.errors[0];
      throw new Error(`Validation failed: ${error.message} (${error.field})`);
    }

    // Calculate updated totals
    const calculatedInvoice = this.calculator.calculateInvoice(invoiceData);

    // Update the invoice
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...calculatedInvoice,
      status: 'updated'
    };

    // Store updated invoice
    mockDatabase.set(id, updatedInvoice);

    return updatedInvoice;
  }

  /**
   * Delete invoice by ID
   */
  async deleteInvoice(id: string): Promise<boolean> {
    return mockDatabase.delete(id);
  }

  /**
   * Bulk delete invoices
   */
  async bulkDeleteInvoices(ids: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        if (mockDatabase.has(id)) {
          mockDatabase.delete(id);
          deleted++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error deleting invoice ${id}:`, error);
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id: string, status: string): Promise<Invoice | null> {
    const invoice = mockDatabase.get(id);
    
    if (!invoice) {
      return null;
    }

    const updatedInvoice = {
      ...invoice,
      status: status as 'draft' | 'sent' | 'paid' | 'overdue'
    };

    mockDatabase.set(id, updatedInvoice);
    return updatedInvoice;
  }

  /**
   * Bulk download PDFs (returns a zip file)
   */
  async bulkDownloadPDFs(ids: string[]): Promise<Buffer> {
    const invoices = ids.map(id => mockDatabase.get(id)).filter((invoice): invoice is Invoice => invoice !== undefined);
    
    if (invoices.length === 0) {
      throw new Error('No valid invoices found for bulk download');
    }

    // Create a zip archive
    const archive = archiver.create('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks);
        resolve(zipBuffer);
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      // Generate PDF for each invoice and add to zip
      const PDFService = require('./PDFService.cjs').PDFService;
      const pdfService = new PDFService();
      
      // Process invoices sequentially to avoid race conditions
      const processInvoices = async () => {
        try {
          for (const invoice of invoices) {
            try {
              const pdfData = await pdfService.generatePDF(invoice);
              const pdfBuffer = Buffer.from(pdfData);
              const filename = `invoice-${invoice.invoiceNumber}-${invoice.client.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
              archive.append(pdfBuffer, { name: filename });
            } catch (error) {
              console.error(`Error generating PDF for invoice ${invoice.id}:`, error);
              // Add a text file with error info instead
              const errorContent = `Error generating PDF for ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              archive.append(errorContent, { name: `error-${invoice.invoiceNumber}.txt` });
            }
          }
          
          // Add a summary file
          const summaryContent = `Bulk PDF Download Summary\n\n` +
            `Generated: ${new Date().toISOString()}\n` +
            `Total Invoices: ${invoices.length}\n\n` +
            `Invoices included:\n` +
            invoices.map(invoice => 
              `- ${invoice.invoiceNumber} - ${invoice.client.name} - $${invoice.total.toFixed(2)}`
            ).join('\n');
          
          archive.append(summaryContent, { name: 'download-summary.txt' });

          // Finalize the archive
          archive.finalize();
        } catch (error) {
          console.error('Error processing invoices:', error);
          reject(error);
        }
      };

      processInvoices();
    });
  }

  /**
   * Export invoices to CSV
   */
  async exportToCSV(options: { search?: string; status?: string; sortBy?: string; sortOrder?: string } = {}): Promise<Buffer> {
    let invoices = Array.from(mockDatabase.values());
    
    // Apply filters
    if (options.status) {
      invoices = invoices.filter(invoice => invoice.status === options.status);
    }
    
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      invoices = invoices.filter(invoice => 
        invoice.client.name.toLowerCase().includes(searchTerm) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.client.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (options.sortBy) {
      invoices.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (options.sortBy) {
          case 'client.name':
            aValue = a.client?.name || '';
            bValue = b.client?.name || '';
            break;
          case 'invoiceNumber':
            aValue = a.invoiceNumber || '';
            bValue = b.invoiceNumber || '';
            break;
          case 'total':
            aValue = a.total || 0;
            bValue = b.total || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'date':
          default:
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return options.sortOrder === 'asc' ? comparison : -comparison;
        }
        
        return options.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    // Generate CSV content
    const headers = ['Invoice Number', 'Client Name', 'Client Email', 'Date', 'Due Date', 'Status', 'Subtotal', 'Tax Amount', 'Total'];
    const csvRows = [headers.join(',')];
    
    invoices.forEach(invoice => {
      const row = [
        invoice.invoiceNumber,
        `"${invoice.client.name}"`,
        invoice.client.email,
        invoice.date,
        invoice.dueDate || '',
        invoice.status,
        invoice.subtotal.toFixed(2),
        invoice.taxAmount.toFixed(2),
        invoice.total.toFixed(2)
      ];
      csvRows.push(row.join(','));
    });
    
    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }

  /**
   * Export invoices to JSON
   */
  async exportToJSON(options: { search?: string; status?: string; sortBy?: string; sortOrder?: string } = {}): Promise<Buffer> {
    let invoices = Array.from(mockDatabase.values());
    
    // Apply filters
    if (options.status) {
      invoices = invoices.filter(invoice => invoice.status === options.status);
    }
    
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      invoices = invoices.filter(invoice => 
        invoice.client.name.toLowerCase().includes(searchTerm) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.client.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (options.sortBy) {
      invoices.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (options.sortBy) {
          case 'client.name':
            aValue = a.client?.name || '';
            bValue = b.client?.name || '';
            break;
          case 'invoiceNumber':
            aValue = a.invoiceNumber || '';
            bValue = b.invoiceNumber || '';
            break;
          case 'total':
            aValue = a.total || 0;
            bValue = b.total || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'date':
          default:
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return options.sortOrder === 'asc' ? comparison : -comparison;
        }
        
        return options.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalInvoices: invoices.length,
      filters: {
        search: options.search || null,
        status: options.status || null,
        sortBy: options.sortBy || 'date',
        sortOrder: options.sortOrder || 'desc'
      },
      invoices: invoices
    };
    
    return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
  }

  /**
   * List invoices with pagination
   */
  async listInvoices(options: ListInvoicesOptions): Promise<ListInvoicesResult> {
    const { page, limit, search, status, sortBy = 'date', sortOrder = 'desc' } = options;
    
    // Get all invoices
    let invoices = Array.from(mockDatabase.values());
    
    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      invoices = invoices.filter(invoice => 
        invoice.client.name.toLowerCase().includes(searchTerm) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.client.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by status if provided
    if (status) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }
    
    // Sort invoices based on sortBy parameter
    invoices.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'client.name':
          aValue = a.client?.name || '';
          bValue = b.client?.name || '';
          break;
        case 'invoiceNumber':
          aValue = a.invoiceNumber || '';
          bValue = b.invoiceNumber || '';
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      // Handle numeric comparison
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    
    // Calculate pagination
    const total = invoices.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated results
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    
    return {
      invoices: paginatedInvoices,
      page,
      limit,
      total,
      pages
    };
  }

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `inv_${timestamp}_${random}`;
  }


  /**
   * Get invoice numbering configuration
   */
  async getNumberingConfig(): Promise<any> {
    return invoiceNumberingService.getConfig();
  }

  /**
   * Update invoice numbering configuration
   */
  async updateNumberingConfig(config: any): Promise<void> {
    invoiceNumberingService.updateConfig(config);
  }

  /**
   * Get invoice numbering stats
   */
  async getNumberingStats(): Promise<any> {
    return invoiceNumberingService.getStats();
  }

  /**
   * Reset invoice numbering
   */
  async resetNumbering(): Promise<void> {
    invoiceNumberingService.resetNumbering();
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(daysFromNow: number): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Get invoice statistics
   */
  async getStats(): Promise<{
    total: number;
    totalRevenue: number;
    paid: number;
    overdue: number;
    draft: number;
    sent: number;
  }> {
    const invoices = Array.from(mockDatabase.values());
    
    const total = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    const paid = invoices.filter(invoice => invoice.status === 'paid').length;
    const draft = invoices.filter(invoice => invoice.status === 'draft').length;
    const sent = invoices.filter(invoice => invoice.status === 'sent').length;
    
    // Calculate overdue invoices
    const today = new Date();
    const overdue = invoices.filter(invoice => {
      // If status is already marked as overdue, count it
      if (invoice.status === 'overdue') {
        return true;
      }
      // If status is sent and due date is past, count as overdue
      if (invoice.status === 'sent' && invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today;
      }
      return false;
    }).length;

    return {
      total,
      totalRevenue,
      paid,
      overdue,
      draft,
      sent
    };
  }
}
