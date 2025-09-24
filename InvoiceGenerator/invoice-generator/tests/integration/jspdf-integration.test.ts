import { describe, it, expect, beforeEach } from '@jest/globals';
import jsPDF from 'jspdf';
import { Invoice } from '../../src/types/invoice';

/**
 * Integration Tests for jsPDF Library
 * 
 * These tests verify that jsPDF library integration works correctly
 * with real PDF generation functionality.
 */

describe('jsPDF Integration Tests', () => {
  let mockInvoice: Invoice;

  beforeEach(() => {
    mockInvoice = {
      id: 'INV-001',
      invoiceNumber: 'INV-001',
      client: {
        name: 'John Doe',
        address: '123 Main St, City, State 12345',
        email: 'john@example.com',
        phone: '+1-555-123-4567'
      },
      items: [
        {
          id: '1',
          description: 'Web Development',
          quantity: 10,
          unitPrice: 100.00,
          lineTotal: 1000.00
        },
        {
          id: '2',
          description: 'Design Services',
          quantity: 5,
          unitPrice: 75.00,
          lineTotal: 375.00
        }
      ],
      subtotal: 1375.00,
      taxAmount: 137.50,
      total: 1512.50,
      taxRate: 10,
      date: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'draft'
    };
  });

  describe('Basic jsPDF Functionality', () => {
    it('should create a new PDF document', () => {
      const doc = new jsPDF();
      
      expect(doc).toBeDefined();
      expect(doc.internal).toBeDefined();
      expect(doc.internal.pageSize).toBeDefined();
    });

    it('should add text to PDF document', () => {
      const doc = new jsPDF();
      
      doc.text('Invoice Header', 20, 20);
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should set font properties', () => {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Title', 20, 20);
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should add multiple pages', () => {
      const doc = new jsPDF();
      
      doc.text('Page 1', 20, 20);
      doc.addPage();
      doc.text('Page 2', 20, 20);
      
      expect(doc.getNumberOfPages()).toBe(2);
    });
  });

  describe('PDF Layout Integration', () => {
    it('should create invoice header layout', () => {
      const doc = new jsPDF();
      
      // Invoice header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 20, 30);
      
      // Client information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${mockInvoice.client.name}`, 20, 50);
      doc.text(`Address: ${mockInvoice.client.address}`, 20, 60);
      doc.text(`Email: ${mockInvoice.client.email}`, 20, 70);
      doc.text(`Phone: ${mockInvoice.client.phone}`, 20, 80);
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should create line items table', () => {
      const doc = new jsPDF();
      
      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, 100);
      doc.text('Qty', 120, 100);
      doc.text('Unit Price', 140, 100);
      doc.text('Total', 180, 100);
      
      // Table rows
      let yPosition = 110;
      mockInvoice.items.forEach(item => {
        doc.setFont('helvetica', 'normal');
        doc.text(item.description, 20, yPosition);
        doc.text(item.quantity.toString(), 120, yPosition);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition);
        doc.text(`$${item.lineTotal.toFixed(2)}`, 180, yPosition);
        yPosition += 10;
      });
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should create totals section', () => {
      const doc = new jsPDF();
      
      const totalsY = 200;
      
      // Subtotal
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 150, totalsY);
      doc.text(`$${mockInvoice.subtotal.toFixed(2)}`, 180, totalsY);
      
      // Tax
      doc.text('Tax:', 150, totalsY + 10);
      doc.text(`$${mockInvoice.taxAmount.toFixed(2)}`, 180, totalsY + 10);
      
      // Total
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 150, totalsY + 20);
      doc.text(`$${mockInvoice.total.toFixed(2)}`, 180, totalsY + 20);
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });
  });

  describe('PDF Styling Integration', () => {
    it('should apply professional styling', () => {
      const doc = new jsPDF();
      
      // Header styling
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 20, 20);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should create bordered table', () => {
      const doc = new jsPDF();
      
      const tableStartX = 20;
      const tableStartY = 100;
      const tableWidth = 170;
      const rowHeight = 10;
      
      // Table border
      doc.setDrawColor(200, 200, 200);
      doc.rect(tableStartX, tableStartY, tableWidth, rowHeight * (mockInvoice.items.length + 1));
      
      // Header row background
      doc.setFillColor(240, 240, 240);
      doc.rect(tableStartX, tableStartY, tableWidth, rowHeight, 'F');
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });

    it('should add page numbers', () => {
      const doc = new jsPDF();
      
      doc.text('Content', 20, 20);
      doc.addPage();
      doc.text('More content', 20, 20);
      
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 190, 290);
      }
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });
  });

  describe('PDF Output Integration', () => {
    it('should generate data URI string', () => {
      const doc = new jsPDF();
      doc.text('Test PDF', 20, 20);
      
      const dataUri = doc.output('datauristring');
      
      expect(dataUri).toContain('data:application/pdf;base64,');
      expect(dataUri.length).toBeGreaterThan(99);
    });

    it('should generate array buffer', () => {
      const doc = new jsPDF();
      doc.text('Test PDF', 20, 20);
      
      const arrayBuffer = doc.output('arraybuffer');
      
      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
      expect(arrayBuffer.byteLength).toBeGreaterThan(0);
    });

    it('should generate blob', () => {
      const doc = new jsPDF();
      doc.text('Test PDF', 20, 20);
      
      const blob = doc.output('blob');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid text positioning', () => {
      const doc = new jsPDF();
      
      // Mock implementation should handle invalid positioning gracefully
      expect(() => {
        doc.text('Test', -10, 20); // Invalid x position
      }).not.toThrow();
    });

    it('should handle invalid font settings', () => {
      const doc = new jsPDF();
      
      // Mock implementation should handle invalid fonts gracefully
      expect(() => {
        doc.setFont('invalid-font', 'bold');
      }).not.toThrow();
    });

    it('should handle page overflow gracefully', () => {
      const doc = new jsPDF();
      
      // Add content that might overflow
      for (let i = 0; i < 50; i++) {
        doc.text(`Line ${i + 1}`, 20, 20 + (i * 10));
      }
      
      const output = doc.output('datauristring');
      expect(output).toContain('data:application/pdf;base64,');
    });
  });

  describe('Performance Integration', () => {
    it('should generate PDF within acceptable time', () => {
      const startTime = Date.now();
      
      const doc = new jsPDF();
      
      // Add substantial content
      doc.text('Invoice Header', 20, 20);
      doc.text('Client Information', 20, 40);
      
      // Add line items
      mockInvoice.items.forEach((item, index) => {
        doc.text(item.description, 20, 60 + (index * 10));
        doc.text(`$${item.unitPrice.toFixed(2)}`, 120, 60 + (index * 10));
      });
      
      // Add totals
      doc.text(`Total: $${mockInvoice.total.toFixed(2)}`, 20, 200);
      
      const output = doc.output('datauristring');
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(output).toContain('data:application/pdf;base64,');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large documents efficiently', () => {
      const startTime = Date.now();
      
      const doc = new jsPDF();
      
      // Add many line items
      for (let i = 0; i < 100; i++) {
        doc.text(`Item ${i + 1}`, 20, 20 + (i * 5));
        if ((i + 1) % 20 === 0) {
          doc.addPage();
        }
      }
      
      const output = doc.output('datauristring');
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(output).toContain('data:application/pdf;base64,');
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Memory Management Integration', () => {
    it('should not leak memory with multiple PDF generations', () => {
      const initialMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
      
      // Generate multiple PDFs
      for (let i = 0; i < 10; i++) {
        const doc = new jsPDF();
        doc.text(`PDF ${i + 1}`, 20, 20);
        doc.output('datauristring');
      }
      
      // Force garbage collection if available
           if ((globalThis as { gc?: () => void }).gc) {
             (globalThis as { gc: () => void }).gc();
      }
      
      const finalMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });
});
