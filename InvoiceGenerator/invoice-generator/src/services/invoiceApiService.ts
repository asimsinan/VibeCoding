import { Invoice, InvoiceRequest } from '../types/invoice';

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class InvoiceApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get list of invoices with pagination and filtering
   */
  async getInvoices(params: InvoiceListParams = {}): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${this.baseUrl}/invoices?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw new Error('Failed to fetch invoice');
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: InvoiceRequest): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, invoiceData: Partial<InvoiceRequest>): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw new Error('Failed to update invoice status');
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  }

  /**
   * Get invoice statistics for dashboard
   */
  async getInvoiceStats(): Promise<{
    total: number;
    totalRevenue: number;
    paid: number;
    overdue: number;
    draft: number;
    sent: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw new Error('Failed to fetch invoice statistics');
    }
  }

  /**
   * Download PDF for an invoice
   */
  async downloadPDF(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${id}/pdf`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invoice not found. The invoice may have been deleted or does not exist.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get invoice data to use proper invoice number for filename
      let filename = `invoice-${id}.pdf`; // Fallback filename
      try {
        const invoice = await this.getInvoice(id);
        filename = `${invoice.invoiceNumber}.pdf`;
      } catch (error) {
        console.warn('Failed to fetch invoice data for filename, using fallback:', error);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error instanceof Error) {
        throw error; // Re-throw the specific error message
      }
      throw new Error('Failed to download PDF');
    }
  }

  /**
   * Bulk delete invoices
   */
  async bulkDeleteInvoices(ids: string[]): Promise<{ deleted: number; failed: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      throw new Error('Failed to bulk delete invoices');
    }
  }

  /**
   * Bulk update invoice status
   */
  async bulkUpdateStatus(ids: string[], status: string): Promise<{ updated: number; failed: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/bulk-update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, status }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw new Error('Failed to bulk update status');
    }
  }

  /**
   * Export invoices to CSV
   */
  async exportToCSV(params: InvoiceListParams = {}): Promise<void> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseUrl}/invoices/export/csv?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObj;
      link.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObj);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export to CSV');
    }
  }

  /**
   * Export invoices to JSON
   */
  async exportToJSON(params: InvoiceListParams = {}): Promise<void> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseUrl}/invoices/export/json?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObj;
      link.download = `invoices-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObj);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export to JSON');
    }
  }

  /**
   * Bulk download PDFs
   */
  async bulkDownloadPDFs(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/bulk-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObj;
      link.download = `invoices-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObj);
    } catch (error) {
      console.error('Error bulk downloading PDFs:', error);
      throw new Error('Failed to bulk download PDFs');
    }
  }
}

// Export singleton instance with environment-based URL
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const invoiceApiService = new InvoiceApiService(`${apiUrl}/api/v1`);
