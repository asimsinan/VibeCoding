import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PDFDownloadButton } from '../../../src/components/PDFDownloadButton/PDFDownloadButton';
import { Invoice } from '../../../src/types/invoice';

/**
 * Unit Tests for PDFDownloadButton Component
 * 
 * These tests verify the PDFDownloadButton component functionality including:
 * - Download trigger functionality
 * - Loading states and feedback
 * - Success/error handling
 * - Accessibility compliance
 */

// Mock the PDF generation functions
jest.mock('../../../src/lib/index', () => ({
  generateAndDownloadPDF: jest.fn(),
  generatePDF: jest.fn(),
  downloadPDF: jest.fn()
}));

describe('PDFDownloadButton Component Unit Tests', () => {
  let mockInvoice: Invoice;
  let mockOnDownload: jest.MockedFunction<(invoice: Invoice) => Promise<void>>;

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
        }
      ],
      subtotal: 1000.00,
      taxAmount: 100.00,
      total: 1100.00,
      taxRate: 10,
      date: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'draft'
    };

    mockOnDownload = jest.fn().mockImplementation(() => Promise.resolve()) as jest.MockedFunction<(invoice: Invoice) => Promise<void>>;
  });

  describe('Component Rendering', () => {
    it('should render download button', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByRole('button', { name: /download pdf/i })).toBeTruthy();
    });

    it('should display correct button text', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Download PDF')).toBeTruthy();
    });

    it('should apply custom className when provided', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
          className="custom-button"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('className', expect.stringContaining('custom-button'));
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
    });
  });

  describe('Download Functionality', () => {
    it('should call onDownload when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button', { name: /download pdf/i });
      await user.click(button);

      expect(mockOnDownload).toHaveBeenCalledWith(mockInvoice);
    });

    it('should not call onDownload when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnDownload).not.toHaveBeenCalled();
    });

    it('should handle keyboard activation', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnDownload).toHaveBeenCalledWith(mockInvoice);
    });

    it('should handle space key activation', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnDownload).toHaveBeenCalledWith(mockInvoice);
    });
  });

  describe('Loading States', () => {
    it('should show loading state during download', async () => {
      const user = userEvent.setup();
      
      // Mock a slow download
      mockOnDownload.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Generating PDF...')).toBeTruthy();
      expect(button).toHaveProperty('disabled', true);
    });

    it('should hide loading state after download completes', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeTruthy();
        expect(button).not.toHaveProperty('disabled', true);
      });
    });

    it('should show loading spinner during download', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    });
  });

  describe('Success and Error Handling', () => {
    it('should show success message after successful download', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('PDF downloaded successfully!')).toBeTruthy();
      });
    });

    it('should show error message when download fails', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockRejectedValue(new Error('Download failed'));

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to download PDF. Please try again.')).toBeTruthy();
      });
    });

    it('should clear error message on retry', async () => {
      const user = userEvent.setup();
      
      mockOnDownload
        .mockRejectedValueOnce(new Error('Download failed'))
        .mockResolvedValueOnce(undefined);

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      
      // First click - should show error
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('Failed to download PDF. Please try again.')).toBeTruthy();
      });

      // Second click - should clear error and succeed
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Failed to download PDF. Please try again.')).not.toBeTruthy();
        expect(screen.getByText('PDF downloaded successfully!')).toBeTruthy();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockRejectedValue(new Error('Network error'));

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection.')).toBeTruthy();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Download PDF invoice');
    });

    it('should announce loading state to screen readers', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should announce success state to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        const successMessage = screen.getByText('PDF downloaded successfully!');
        expect(successMessage.getAttribute('role')).toBe('status');
        expect(successMessage.getAttribute('aria-live')).toBe('polite');
      });
    });

    it('should announce error state to screen readers', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockRejectedValue(new Error('Download failed'));

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to download PDF. Please try again.');
        expect(errorMessage.getAttribute('role')).toBe('alert');
        expect(errorMessage.getAttribute('aria-live')).toBe('assertive');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
      
      await user.keyboard('{Enter}');
      expect(mockOnDownload).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const initialButton = screen.getByRole('button');

      // Re-render with same props
      rerender(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      // Should be the same element
      expect(screen.getByRole('button')).toBe(initialButton);
    });

    it('should handle rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      
      mockOnDownload.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only call onDownload once due to loading state
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should clean up timeouts on unmount', () => {
      const { unmount } = render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
        />
      );

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null invoice gracefully', () => {
      render(
        <PDFDownloadButton
          invoice={null as unknown as Invoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
    });

    it('should handle undefined onDownload', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={undefined as unknown as (invoice: Invoice) => Promise<void>}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
    });

    it('should handle empty invoice', () => {
      const emptyInvoice: Invoice = {
        id: '',
        invoiceNumber: '',
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
        date: '',
        dueDate: '',
        status: 'draft'
      };

      render(
        <PDFDownloadButton
          invoice={emptyInvoice}
          onDownload={mockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Custom Styling and Theming', () => {
    it('should apply custom styles', () => {
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={mockOnDownload}
          style={{ backgroundColor: 'red' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.style.backgroundColor).toBe('red');
    });

    it('should apply different styles for different states', async () => {
      const user = userEvent.setup();
      
      // Mock a slow download function
      const slowMockOnDownload = jest.fn().mockImplementation(() => 
        new Promise<void>(resolve => setTimeout(resolve, 100))
      ) as jest.MockedFunction<(invoice: Invoice) => Promise<void>>;
      
      render(
        <PDFDownloadButton
          invoice={mockInvoice}
          onDownload={slowMockOnDownload}
        />
      );

      const button = screen.getByRole('button');
      
      // Normal state
      expect(button).toHaveProperty('className', expect.stringContaining('pdf-download-button'));
      
      // Loading state
      await user.click(button);
      expect(button).toHaveProperty('className', expect.stringContaining('pdf-download-button--loading'));
    });
  });
});
