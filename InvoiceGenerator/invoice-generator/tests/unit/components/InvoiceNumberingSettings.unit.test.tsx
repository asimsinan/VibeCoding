import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { InvoiceNumberingSettings } from '../../../src/components/InvoiceNumberingSettings/InvoiceNumberingSettings';

// Mock the invoice numbering service
jest.mock('../../../src/lib/invoice-numbering', () => ({
  invoiceNumberingService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    getNextNumber: jest.fn(),
    resetNumbering: jest.fn(),
    getStats: jest.fn(),
  },
}));

const mockInvoiceNumberingService = require('../../../src/lib/invoice-numbering').invoiceNumberingService;

// Mock the useToast hook
jest.mock('../../../src/hooks/useToast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

describe('InvoiceNumberingSettings', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockInvoiceNumberingService.getConfig.mockReturnValue({
      prefix: 'INV',
      startNumber: 1,
      padding: 4,
      includeYear: true,
      includeMonth: false,
      separator: '-',
    });
    
    mockInvoiceNumberingService.getNextNumber.mockReturnValue('INV-2024-0001');
    
    mockInvoiceNumberingService.getStats.mockReturnValue({
      totalGenerated: 5,
      lastGenerated: 'INV-2024-0005',
      nextNumber: 'INV-2024-0006',
      config: {
        prefix: 'INV',
        startNumber: 1,
        padding: 4,
        includeYear: true,
        includeMonth: false,
        separator: '-',
      },
    });
  });

  it('renders with initial configuration', () => {
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    expect(screen.getByText('Invoice Numbering Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('INV')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('-')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
  });

  it('updates preview when configuration changes', async () => {
    const user = userEvent.setup();
    
    mockInvoiceNumberingService.getNextNumber.mockReturnValue('BILL-2024-0001');
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const prefixInput = screen.getByDisplayValue('INV');
    await user.clear(prefixInput);
    await user.type(prefixInput, 'BILL');
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalled();
    expect(screen.getByText('BILL-2024-0001')).toBeInTheDocument();
  });

  it('handles start number changes', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const startNumberInput = screen.getByDisplayValue('1');
    await user.clear(startNumberInput);
    await user.type(startNumberInput, '100');
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ startNumber: 100 })
    );
  });

  it('handles padding changes', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const paddingSelect = screen.getByDisplayValue('4 digits (0001)');
    await user.selectOptions(paddingSelect, '5');
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ padding: 5 })
    );
  });

  it('handles separator changes', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const separatorSelect = screen.getByDisplayValue('Dash (-)');
    await user.selectOptions(separatorSelect, '_');
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ separator: '_' })
    );
  });

  it('handles checkbox changes', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const includeYearCheckbox = screen.getByLabelText('Include Year');
    await user.click(includeYearCheckbox);
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ includeYear: false })
    );
  });

  it('saves configuration when save button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const saveButton = screen.getByText('Save Settings');
    await user.click(saveButton);
    
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets numbering when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const resetButton = screen.getByText('Reset Counter');
    await user.click(resetButton);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset the numbering? This will reset the counter to the start number.'
    );
    expect(mockInvoiceNumberingService.resetNumbering).toHaveBeenCalled();
  });

  it('does not reset when user cancels confirmation', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const resetButton = screen.getByText('Reset Counter');
    await user.click(resetButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockInvoiceNumberingService.resetNumbering).not.toHaveBeenCalled();
  });

  it('displays statistics correctly', () => {
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // totalGenerated
    expect(screen.getByText('INV-2024-0005')).toBeInTheDocument(); // lastGenerated
    expect(screen.getByText('INV-2024-0006')).toBeInTheDocument(); // nextNumber
  });

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates input constraints', async () => {
    const user = userEvent.setup();
    
    render(<InvoiceNumberingSettings onClose={mockOnClose} />);
    
    const startNumberInput = screen.getByDisplayValue('1');
    await user.clear(startNumberInput);
    await user.type(startNumberInput, '0');
    
    // Should default to 1 when invalid value is entered
    expect(mockInvoiceNumberingService.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ startNumber: 1 })
    );
  });
});
