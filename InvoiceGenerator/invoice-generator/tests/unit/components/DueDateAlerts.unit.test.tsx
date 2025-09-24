import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DueDateAlerts } from '../../../src/components/DueDateAlerts/DueDateAlerts';
import { Invoice } from '../../../src/types/invoice';

// Mock the useStatusManagement hook
jest.mock('../../../src/hooks/useStatusManagement', () => ({
  useStatusManagement: jest.fn(),
}));

const mockUseStatusManagement = require('../../../src/hooks/useStatusManagement').useStatusManagement;

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    client: { name: 'Test Client', email: 'test@example.com', address: '123 Test St', phone: '123-456-7890' },
    items: [{ id: '1', description: 'Test Item', quantity: 1, unitPrice: 100, lineTotal: 100 }],
    subtotal: 100,
    taxAmount: 10,
    total: 110,
    taxRate: 10,
    date: '2024-01-01',
    dueDate: '2024-01-31',
    status: 'sent',
  },
];

describe('DueDateAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success message when no alerts', () => {
    mockUseStatusManagement.mockReturnValue({
      alerts: [],
      overdueCount: 0,
      dueSoonCount: 0,
      overdueAmount: 0,
      dueSoonAmount: 0,
      clearAlert: jest.fn(),
      clearAllAlerts: jest.fn(),
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    expect(screen.getByText('Due Date Alerts')).toBeInTheDocument();
    expect(screen.getByText('✅ All invoices are up to date')).toBeInTheDocument();
  });

  it('renders overdue alerts', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        dueDate: '2024-01-01',
        daysOverdue: 5,
        amount: 110,
        type: 'overdue' as const,
      },
    ];

    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 1,
      dueSoonCount: 0,
      overdueAmount: 110,
      dueSoonAmount: 0,
      clearAlert: jest.fn(),
      clearAllAlerts: jest.fn(),
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    expect(screen.getByText('🚨 1 overdue ($110.00)')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Due: Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('(5 days overdue)')).toBeInTheDocument();
  });

  it('renders due soon alerts', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        dueDate: '2024-01-15',
        daysOverdue: 0,
        amount: 110,
        type: 'reminder' as const,
      },
    ];

    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 0,
      dueSoonCount: 1,
      overdueAmount: 0,
      dueSoonAmount: 110,
      clearAlert: jest.fn(),
      clearAllAlerts: jest.fn(),
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    expect(screen.getByText('⏰ 1 due soon ($110.00)')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });

  it('calls onInvoiceClick when alert is clicked', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        dueDate: '2024-01-01',
        daysOverdue: 5,
        amount: 110,
        type: 'overdue' as const,
      },
    ];

    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 1,
      dueSoonCount: 0,
      overdueAmount: 110,
      dueSoonAmount: 0,
      clearAlert: jest.fn(),
      clearAllAlerts: jest.fn(),
    });

    const onInvoiceClick = jest.fn();
    render(<DueDateAlerts invoices={mockInvoices} onInvoiceClick={onInvoiceClick} />);
    
    fireEvent.click(screen.getByText('INV-001'));
    expect(onInvoiceClick).toHaveBeenCalledWith('1');
  });

  it('calls clearAlert when dismiss button is clicked', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        dueDate: '2024-01-01',
        daysOverdue: 5,
        amount: 110,
        type: 'overdue' as const,
      },
    ];

    const clearAlert = jest.fn();
    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 1,
      dueSoonCount: 0,
      overdueAmount: 110,
      dueSoonAmount: 0,
      clearAlert,
      clearAllAlerts: jest.fn(),
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    fireEvent.click(screen.getByLabelText('Dismiss alert'));
    expect(clearAlert).toHaveBeenCalledWith('1');
  });

  it('calls clearAllAlerts when clear all button is clicked', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        dueDate: '2024-01-01',
        daysOverdue: 5,
        amount: 110,
        type: 'overdue' as const,
      },
    ];

    const clearAllAlerts = jest.fn();
    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 1,
      dueSoonCount: 0,
      overdueAmount: 110,
      dueSoonAmount: 0,
      clearAlert: jest.fn(),
      clearAllAlerts,
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    fireEvent.click(screen.getByLabelText('Clear all alerts'));
    expect(clearAllAlerts).toHaveBeenCalled();
  });

  it('renders both overdue and due soon alerts', () => {
    const mockAlerts = [
      {
        invoiceId: '1',
        invoiceNumber: 'INV-001',
        clientName: 'Overdue Client',
        dueDate: '2024-01-01',
        daysOverdue: 5,
        amount: 110,
        type: 'overdue' as const,
      },
      {
        invoiceId: '2',
        invoiceNumber: 'INV-002',
        clientName: 'Due Soon Client',
        dueDate: '2024-01-15',
        daysOverdue: 0,
        amount: 200,
        type: 'reminder' as const,
      },
    ];

    mockUseStatusManagement.mockReturnValue({
      alerts: mockAlerts,
      overdueCount: 1,
      dueSoonCount: 1,
      overdueAmount: 110,
      dueSoonAmount: 200,
      clearAlert: jest.fn(),
      clearAllAlerts: jest.fn(),
    });

    render(<DueDateAlerts invoices={mockInvoices} />);
    
    expect(screen.getByText('🚨 1 overdue ($110.00)')).toBeInTheDocument();
    expect(screen.getByText('⏰ 1 due soon ($200.00)')).toBeInTheDocument();
    expect(screen.getByText('Overdue Client')).toBeInTheDocument();
    expect(screen.getByText('Due Soon Client')).toBeInTheDocument();
  });
});
