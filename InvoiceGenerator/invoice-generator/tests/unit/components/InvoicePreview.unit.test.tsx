import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { InvoicePreview } from '../../../src/components/InvoicePreview/InvoicePreview';
import { Invoice } from '../../../src/types/invoice';

/**
 * Unit Tests for InvoicePreview Component
 * 
 * These tests verify the InvoicePreview component functionality including:
 * - Live preview updates
 * - Responsive design
 * - Print-friendly styling
 * - Mobile optimization
 */

// Mock the core library functions
jest.mock('../../../src/lib/index', () => ({
  formatCurrency: jest.fn((value: number) => `$${value.toFixed(2)}`),
  formatDate: jest.fn((date: string) => new Date(date).toLocaleDateString())
}));

describe('InvoicePreview Component Unit Tests', () => {
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

  describe('Component Rendering', () => {
    it('should render invoice header', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('INVOICE')).toBeTruthy();
      expect(screen.getByText('INV-001')).toBeTruthy();
    });

    it('should render client information', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('123 Main St, City, State 12345')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
      expect(screen.getByText('+1-555-123-4567')).toBeTruthy();
    });

    it('should render line items table', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Quantity')).toBeTruthy();
      expect(screen.getByText('Unit Price')).toBeTruthy();
      expect(screen.getByText('Total')).toBeTruthy();
    });

    it('should render all line items', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('Web Development')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
      expect(screen.getByText('$100.00')).toBeTruthy();
      expect(screen.getByText('$1000.00')).toBeTruthy();

      expect(screen.getByText('Design Services')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('$75.00')).toBeTruthy();
      expect(screen.getByText('$375.00')).toBeTruthy();
    });

    it('should render totals section', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('Subtotal:')).toBeTruthy();
      expect(screen.getByText('$1375.00')).toBeTruthy();
      expect(screen.getByText('Tax (10%):')).toBeTruthy();
      expect(screen.getByText('$137.50')).toBeTruthy();
      expect(screen.getByText('Total:')).toBeTruthy();
      expect(screen.getByText('$1512.50')).toBeTruthy();
    });

    it('should render invoice dates', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText(/invoice date/i)).toBeTruthy();
      expect(screen.getByText(/due date/i)).toBeTruthy();
    });
  });

  describe('Live Preview Updates', () => {
    it('should update when invoice prop changes', () => {
      const { rerender } = render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('John Doe')).toBeTruthy();

      const updatedInvoice = {
        ...mockInvoice,
        client: {
          ...mockInvoice.client,
          name: 'Jane Smith'
        }
      };

      rerender(<InvoicePreview invoice={updatedInvoice} />);

      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.queryByText('John Doe')).not.toBeTruthy();
    });

    it('should update line items when they change', () => {
      const { rerender } = render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('Web Development')).toBeTruthy();

      const updatedInvoice = {
        ...mockInvoice,
        items: [
          {
            ...mockInvoice.items[0],
            description: 'Updated Service'
          },
          ...mockInvoice.items.slice(1)
        ]
      };

      rerender(<InvoicePreview invoice={updatedInvoice} />);

      expect(screen.getByText('Updated Service')).toBeTruthy();
      expect(screen.queryByText('Web Development')).not.toBeTruthy();
    });

    it('should update totals when they change', () => {
      const { rerender } = render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('$1512.50')).toBeTruthy();

      const updatedInvoice = {
        ...mockInvoice,
        total: 2000.00
      };

      rerender(<InvoicePreview invoice={updatedInvoice} />);

      expect(screen.getByText('$2000.00')).toBeTruthy();
      expect(screen.queryByText('$1512.50')).not.toBeTruthy();
    });
  });

  describe('Print Mode', () => {
    it('should apply print styles when in print mode', () => {
      render(<InvoicePreview invoice={mockInvoice} isPrintMode={true} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('print-mode'));
    });

    it('should not apply print styles when not in print mode', () => {
      render(<InvoicePreview invoice={mockInvoice} isPrintMode={false} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).not.toHaveProperty('className', expect.stringContaining('print-mode'));
    });

    it('should hide interactive elements in print mode', () => {
      render(<InvoicePreview invoice={mockInvoice} isPrintMode={true} />);

      // Should not render any buttons or interactive elements
      expect(screen.queryByRole('button')).not.toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive container', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('responsive'));
    });

    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('mobile'));
    });

    it('should adapt to tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('tablet'));
    });

    it('should adapt to desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('desktop'));
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty invoice', () => {
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
        date: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'draft'
      };

      render(<InvoicePreview invoice={emptyInvoice} />);

      expect(screen.getByText('INVOICE')).toBeTruthy();
      expect(screen.getByText('No items')).toBeTruthy();
      expect(screen.getAllByText('$0.00')).toHaveLength(2);
    });

    it('should handle missing client information', () => {
      const invoiceWithMissingClient = {
        ...mockInvoice,
        client: {
          name: '',
          address: '',
          email: '',
          phone: ''
        }
      };

      render(<InvoicePreview invoice={invoiceWithMissingClient} />);

      expect(screen.getByText('INVOICE')).toBeTruthy();
      // Should still render the structure even with missing client info
      expect(screen.getByText('Description')).toBeTruthy();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper heading structure', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveProperty('textContent', 'INVOICE');
    });

    it('should have proper table structure', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      const table = screen.getByRole('table');
      expect(table).toBeTruthy();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(4);
    });

    it('should have proper ARIA labels', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveAttribute('aria-label', 'Invoice Preview');
    });

    it('should be screen reader friendly', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      // Check for proper semantic structure
      expect(screen.getByRole('table')).toBeTruthy();
      expect(screen.getAllByRole('heading')).toHaveLength(2);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large number of line items efficiently', () => {
      const largeInvoice = {
        ...mockInvoice,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          description: `Service Item ${i + 1}`,
          quantity: 1,
          unitPrice: 10.00,
          lineTotal: 10.00
        }))
      };

      render(<InvoicePreview invoice={largeInvoice} />);

      // Should render without performance issues
      expect(screen.getByText('Service Item 1')).toBeTruthy();
      expect(screen.getByText('Service Item 100')).toBeTruthy();
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<InvoicePreview invoice={mockInvoice} />);

      const initialRender = screen.getByText('INVOICE');

      // Re-render with same props
      rerender(<InvoicePreview invoice={mockInvoice} />);

      // Should maintain the same element
      expect(screen.getByText('INVOICE')).toBe(initialRender);
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<InvoicePreview invoice={mockInvoice} />);

      // Simulate rapid changes
      for (let i = 0; i < 10; i++) {
        const updatedInvoice = {
          ...mockInvoice,
          total: mockInvoice.total + i
        };
        rerender(<InvoicePreview invoice={updatedInvoice} />);
      }

      // Should handle rapid changes without errors
      expect(screen.getByText('INVOICE')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<InvoicePreview invoice={mockInvoice} className="custom-preview" />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('custom-preview'));
    });

    it('should apply default styling when no className provided', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      const previewContainer = screen.getByTestId('invoice-preview');
      expect(previewContainer).toHaveProperty('className', expect.stringContaining('invoice-preview'));
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      // Should display formatted dates
      expect(screen.getByText(/1\/15\/2024/)).toBeTruthy();
      expect(screen.getByText(/2\/15\/2024/)).toBeTruthy();
    });

    it('should handle invalid dates gracefully', () => {
      const invoiceWithInvalidDate = {
        ...mockInvoice,
        date: 'invalid-date',
        dueDate: 'invalid-date'
      };

      render(<InvoicePreview invoice={invoiceWithInvalidDate} />);

      // Should not crash with invalid dates
      expect(screen.getByText('INVOICE')).toBeTruthy();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency values correctly', () => {
      render(<InvoicePreview invoice={mockInvoice} />);

      expect(screen.getByText('$100.00')).toBeTruthy();
      expect(screen.getByText('$1000.00')).toBeTruthy();
      expect(screen.getByText('$1375.00')).toBeTruthy();
      expect(screen.getByText('$137.50')).toBeTruthy();
      expect(screen.getByText('$1512.50')).toBeTruthy();
    });

    it('should handle zero values', () => {
      const zeroInvoice = {
        ...mockInvoice,
        subtotal: 0,
        taxAmount: 0,
        total: 0
      };

      render(<InvoicePreview invoice={zeroInvoice} />);

      expect(screen.getAllByText('$0.00')).toHaveLength(3);
    });
  });
});
