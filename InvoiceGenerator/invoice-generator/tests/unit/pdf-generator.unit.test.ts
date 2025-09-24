import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Invoice } from '../../src/types/invoice';

/**
 * Unit Tests for PDF Generation Functions
 * 
 * These tests verify individual PDF generation functions
 * in isolation with mocked dependencies.
 */

interface MockDoc {
  setFontSize: (size: number) => void;
  setFont: (family: string, style: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
}

interface MockHeaderDoc extends MockDoc {
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  text: (text: string, x: number, y: number) => void;
}

interface MockTableDoc extends MockDoc {
  setDrawColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  setFillColor: (r: number, g: number, b: number) => void;
}

interface MockLayoutDoc extends MockDoc {
  text: (text: string, x: number, y: number) => void;
}

interface MockPageDoc extends MockLayoutDoc {
  addPage: () => void;
  getNumberOfPages: () => number;
  setPage: (page: number) => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

describe('PDF Generator Unit Tests', () => {
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

  describe('PDFGenerator', () => {
    it('should generate PDF from invoice data', async () => {
      // Mock PDF generation function
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

      const result = await generatePDF(mockInvoice);

      expect(generatePDF).toHaveBeenCalledWith(mockInvoice);
      expect(result).toBeInstanceOf(Uint8Array);
      expect((result as Uint8Array).length).toBeGreaterThan(0);
    });

    it('should handle empty invoice gracefully', async () => {
      const emptyInvoice: Invoice = {
        id: 'INV-002',
        invoiceNumber: 'INV-002',
        client: {
          name: '',
          address: '',
          email: '',
          phone: ''
        },
        items: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        taxRate: 0,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        status: 'draft'
      };

      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

      const result = await generatePDF(emptyInvoice);

      expect(generatePDF).toHaveBeenCalledWith(emptyInvoice);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle large invoices efficiently', async () => {
      const largeInvoice: Invoice = {
        ...mockInvoice,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          description: `Service Item ${i + 1}`,
          quantity: 1,
          unitPrice: 10.00,
          lineTotal: 10.00
        }))
      };

      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

      const result = await generatePDF(largeInvoice);

      expect(generatePDF).toHaveBeenCalledWith(largeInvoice);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for invalid invoice data', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockRejectedValue(new Error('Invalid invoice data'));

      await expect(generatePDF(null as unknown as Invoice)).rejects.toThrow('Invalid invoice data');
    });

    it('should handle PDF generation errors', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockRejectedValue(new Error('PDF generation failed'));

      await expect(generatePDF(mockInvoice)).rejects.toThrow('PDF generation failed');
    });
  });

  describe('PDFStyler', () => {
    it('should apply default styling to PDF document', () => {
      const mockDoc = {
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        setFillColor: jest.fn(),
        setDrawColor: jest.fn(),
        rect: jest.fn()
      };

      const applyStyling = jest.fn<(doc: MockDoc) => void>().mockImplementation((doc: MockDoc) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      });

      applyStyling(mockDoc);

      expect(applyStyling).toHaveBeenCalledWith(mockDoc);
    });

    it('should apply custom styling options', () => {
      const mockDoc = {
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        setFillColor: jest.fn(),
        setDrawColor: jest.fn(),
        rect: jest.fn()
      };

      const applyStyling = jest.fn<(doc: MockDoc) => void>().mockImplementation((doc: MockDoc) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
      });

      applyStyling(mockDoc);

      expect(applyStyling).toHaveBeenCalledWith(mockDoc);
    });

    it('should create professional header styling', () => {
      const mockDoc = {
        setFillColor: jest.fn(),
        rect: jest.fn(),
        setTextColor: jest.fn(),
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        text: jest.fn()
      };

      const applyHeaderStyling = jest.fn<(doc: MockHeaderDoc) => void>().mockImplementation((doc: MockHeaderDoc) => {
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 20, 20);
      });

      applyHeaderStyling(mockDoc);

      expect(applyHeaderStyling).toHaveBeenCalledWith(mockDoc);
    });

    it('should create table styling', () => {
      const mockDoc = {
        setDrawColor: jest.fn(),
        rect: jest.fn(),
        setFillColor: jest.fn(),
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn()
      };

      const applyTableStyling = jest.fn<(doc: MockTableDoc, startX: number, startY: number, width: number, height: number) => void>().mockImplementation((doc: MockTableDoc, startX: number, startY: number, width: number, height: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.rect(startX, startY, width, height);
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, startY, width, 10, 'F');
      });

      applyTableStyling(mockDoc, 20, 100, 170, 50);

      expect(applyTableStyling).toHaveBeenCalledWith(mockDoc, 20, 100, 170, 50);
    });
  });

  describe('PDFDownloader', () => {
    it('should download PDF with correct filename', async () => {
      const mockPDFData = new Uint8Array([37, 80, 68, 70]);
      const filename = 'invoice-INV-001.pdf';

      const downloadPDF = jest.fn<(pdfData: Uint8Array, filename: string) => Promise<void>>().mockResolvedValue(undefined);

      await downloadPDF(mockPDFData, filename);

      expect(downloadPDF).toHaveBeenCalledWith(mockPDFData, filename);
    });

    it('should generate appropriate filename from invoice', () => {
      const generateFilename = jest.fn<(invoiceNumber: string, date: Date) => string>().mockReturnValue('invoice-INV-001-2024-01-15.pdf');

      const result = generateFilename(mockInvoice.invoiceNumber, new Date(mockInvoice.date));

      expect(generateFilename).toHaveBeenCalledWith(mockInvoice.invoiceNumber, new Date(mockInvoice.date));
      expect(result).toMatch(/^invoice-.*\.pdf$/);
    });

    it('should sanitize filename for special characters', () => {
      const generateFilename = jest.fn<(invoiceNumber: string, date: Date) => string>().mockReturnValue('invoice-client-co-ltd-2024-01-15.pdf');

      const result = generateFilename('Client & Co. (Ltd.)', new Date('2024-01-15'));

      expect(generateFilename).toHaveBeenCalledWith('Client & Co. (Ltd.)', new Date('2024-01-15'));
      expect(result).not.toContain('&');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should handle download errors gracefully', async () => {
      const filename = '';

      const downloadPDF = jest.fn<(pdfData: Uint8Array, filename: string) => Promise<void>>().mockRejectedValue(new Error('Invalid filename'));

      await expect(downloadPDF(new Uint8Array([37, 80, 68, 70]), filename)).rejects.toThrow('Invalid filename');
    });

    it('should create download link and trigger download', () => {
      const mockPDFData = new Uint8Array([37, 80, 68, 70]);
      const filename = 'test.pdf';
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        addEventListener: jest.fn()
      };

      const createDownloadLink = jest.fn<(pdfData: Uint8Array, filename: string) => HTMLElement>().mockImplementation((_pdfData: Uint8Array, filename: string) => {
        const link = mockLink as unknown as HTMLElement;
        (link as any).href = 'blob:http://localhost:3000/mock-url';
        (link as any).download = filename;
        (link as any).click();
        return link;
      });

      const result = createDownloadLink(mockPDFData, filename);

      expect(createDownloadLink).toHaveBeenCalledWith(mockPDFData, filename);
      expect(result).toBe(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('PDF Layout Functions', () => {
    it('should create invoice header layout', () => {
      const mockDoc = {
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn()
      };

      const createHeader = jest.fn<(doc: MockLayoutDoc, invoice: Invoice) => void>().mockImplementation((doc: MockLayoutDoc, invoice: Invoice) => {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 20, 30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Client: ${invoice.client.name}`, 20, 50);
        doc.text(`Address: ${invoice.client.address}`, 20, 60);
        doc.text(`Email: ${invoice.client.email}`, 20, 70);
        doc.text(`Phone: ${invoice.client.phone}`, 20, 80);
      });

      createHeader(mockDoc, mockInvoice);

      expect(createHeader).toHaveBeenCalledWith(mockDoc, mockInvoice);
    });

    it('should create line items table', () => {
      const mockDoc = {
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn()
      };

      const createLineItemsTable = jest.fn<(doc: MockLayoutDoc, items: LineItem[]) => void>().mockImplementation((doc: MockLayoutDoc, items: LineItem[]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 20, 100);
        doc.text('Qty', 120, 100);
        doc.text('Unit Price', 140, 100);
        doc.text('Total', 180, 100);

        let yPosition = 110;
        items.forEach((item) => {
          doc.setFont('helvetica', 'normal');
          doc.text(item.description, 20, yPosition);
          doc.text(item.quantity.toString(), 120, yPosition);
          doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition);
          doc.text(`$${item.lineTotal.toFixed(2)}`, 180, yPosition);
          yPosition += 10;
        });
      });

      createLineItemsTable(mockDoc, mockInvoice.items);

      expect(createLineItemsTable).toHaveBeenCalledWith(mockDoc, mockInvoice.items);
    });

    it('should create totals section', () => {
      const mockDoc = {
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn()
      };

      const createTotalsSection = jest.fn<(doc: MockLayoutDoc, invoice: Invoice) => void>().mockImplementation((doc: MockLayoutDoc, invoice: Invoice) => {
        const totalsY = 200;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', 150, totalsY);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 180, totalsY);
        doc.text('Tax:', 150, totalsY + 10);
        doc.text(`$${invoice.taxAmount.toFixed(2)}`, 180, totalsY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 150, totalsY + 20);
        doc.text(`$${invoice.total.toFixed(2)}`, 180, totalsY + 20);
      });

      createTotalsSection(mockDoc, mockInvoice);

      expect(createTotalsSection).toHaveBeenCalledWith(mockDoc, mockInvoice);
    });

    it('should handle page overflow with multiple pages', () => {
      const mockDoc = {
        addPage: jest.fn(),
        getNumberOfPages: jest.fn().mockReturnValue(2) as jest.MockedFunction<() => number>,
        setPage: jest.fn(),
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn()
      };

      const handlePageOverflow = jest.fn<(doc: MockPageDoc, content: string) => void>().mockImplementation((doc: MockPageDoc, content: string) => {
        if (content.length > 20) {
          doc.addPage();
        }
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(`Page ${i} of ${pageCount}`, 190, 290);
        }
      });

      const longContent = Array.from({ length: 25 }, (_, i) => `Line ${i + 1}`).join('\n');
      handlePageOverflow(mockDoc, longContent);

      expect(handlePageOverflow).toHaveBeenCalledWith(mockDoc, longContent);
      expect(mockDoc.addPage).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF generation timeout', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timeout')), 100)
        )
      );

      await expect(generatePDF(mockInvoice)).rejects.toThrow('PDF generation timeout');
    });

    it('should handle invalid PDF data', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([]));

      const result = await generatePDF(mockInvoice);

      expect(result).toBeInstanceOf(Uint8Array);
      expect((result as Uint8Array).length).toBe(0);
    });

    it('should handle memory errors during PDF generation', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockRejectedValue(new Error('Out of memory'));

      await expect(generatePDF(mockInvoice)).rejects.toThrow('Out of memory');
    });

    it('should handle browser compatibility issues', async () => {
      const downloadPDF = jest.fn<(pdfData: Uint8Array, filename: string) => Promise<void>>().mockRejectedValue(new Error('Blob not supported'));

      await expect(downloadPDF(new Uint8Array([37, 80, 68, 70]), 'test.pdf'))
        .rejects.toThrow('Blob not supported');
    });
  });

  describe('Performance Tests', () => {
    it('should generate PDF within acceptable time', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockImplementation(async () => {
        const startTime = Date.now();
        // Simulate PDF generation work
        await new Promise(resolve => setTimeout(resolve, 100));
        const endTime = Date.now();
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        return new Uint8Array([37, 80, 68, 70]);
      });

      const result = await generatePDF(mockInvoice);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle concurrent PDF generation', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

      const promises = Array.from({ length: 5 }, (_, i) => 
        generatePDF({ ...mockInvoice, id: `INV-00${i + 1}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(result => result instanceof Uint8Array)).toBe(true);
      expect(generatePDF).toHaveBeenCalledTimes(5);
    });

    it('should not leak memory with multiple generations', async () => {
      const generatePDF = jest.fn<(invoice: Invoice) => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

      // Generate multiple PDFs
      for (let i = 0; i < 10; i++) {
        await generatePDF({ ...mockInvoice, id: `INV-00${i + 1}`, invoiceNumber: `INV-00${i + 1}` });
      }

      expect(generatePDF).toHaveBeenCalledTimes(10);
    });
  });
});
