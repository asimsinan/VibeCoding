import { DueDateTrackingService, DueDateConfig } from '../../../src/lib/due-date-tracking';
import { Invoice } from '../../../src/types/invoice';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('DueDateTrackingService', () => {
  let service: DueDateTrackingService;
  let mockInvoices: Invoice[];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    service = DueDateTrackingService.getInstance();
    
    mockInvoices = [
      {
        id: '1',
        invoiceNumber: 'INV-001',
        client: { name: 'Client 1', email: 'client1@example.com', address: '123 St', phone: '123-456-7890' },
        items: [{ id: '1', description: 'Item 1', quantity: 1, unitPrice: 100, lineTotal: 100 }],
        subtotal: 100,
        taxAmount: 10,
        total: 110,
        taxRate: 10,
        date: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'sent',
      },
      {
        id: '2',
        invoiceNumber: 'INV-002',
        client: { name: 'Client 2', email: 'client2@example.com', address: '456 St', phone: '123-456-7890' },
        items: [{ id: '2', description: 'Item 2', quantity: 2, unitPrice: 50, lineTotal: 100 }],
        subtotal: 100,
        taxAmount: 10,
        total: 110,
        taxRate: 10,
        date: '2024-01-01',
        dueDate: '2024-01-15',
        status: 'sent',
      },
      {
        id: '3',
        invoiceNumber: 'INV-003',
        client: { name: 'Client 3', email: 'client3@example.com', address: '789 St', phone: '123-456-7890' },
        items: [{ id: '3', description: 'Item 3', quantity: 1, unitPrice: 200, lineTotal: 200 }],
        subtotal: 200,
        taxAmount: 20,
        total: 220,
        taxRate: 10,
        date: '2024-01-01',
        dueDate: '2024-01-10',
        status: 'paid',
      },
    ];
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = DueDateTrackingService.getInstance();
      const instance2 = DueDateTrackingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('calculateDueDate', () => {
    it('calculates due date with default days', () => {
      const dueDate = service.calculateDueDate('2024-01-01');
      expect(dueDate).toBe('2024-01-31'); // 30 days later
    });

    it('calculates due date with custom days', () => {
      const dueDate = service.calculateDueDate('2024-01-01', 15);
      expect(dueDate).toBe('2024-01-16'); // 15 days later
    });

    it('handles month boundaries', () => {
      const dueDate = service.calculateDueDate('2024-01-15', 20);
      expect(dueDate).toBe('2024-02-04'); // Crosses month boundary
    });
  });

  describe('getDaysUntilDue', () => {
    it('calculates days until due correctly', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      const daysUntilDue = service.getDaysUntilDue(futureDate.toISOString().split('T')[0]);
      expect(daysUntilDue).toBe(5);
    });

    it('returns negative for past dates', () => {
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const daysUntilDue = service.getDaysUntilDue(pastDate.toISOString().split('T')[0]);
      expect(daysUntilDue).toBe(-5);
    });
  });

  describe('getDaysOverdue', () => {
    it('calculates days overdue correctly', () => {
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const daysOverdue = service.getDaysOverdue(pastDate.toISOString().split('T')[0]);
      expect(daysOverdue).toBe(5);
    });

    it('returns 0 for future dates', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      const daysOverdue = service.getDaysOverdue(futureDate.toISOString().split('T')[0]);
      expect(daysOverdue).toBe(0);
    });
  });

  describe('isOverdue', () => {
    it('returns true for overdue invoices', () => {
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(service.isOverdue(pastDate.toISOString().split('T')[0])).toBe(true);
    });

    it('returns false for future dates', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      expect(service.isOverdue(futureDate.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    it('returns true for invoices due soon', () => {
      const today = new Date();
      const soonDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      expect(service.isDueSoon(soonDate.toISOString().split('T')[0])).toBe(true);
    });

    it('returns false for invoices not due soon', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      expect(service.isDueSoon(futureDate.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('getInvoiceStatus', () => {
    it('returns draft status for draft invoices', () => {
      const invoice = { ...mockInvoices[0], status: 'draft' as const };
      expect(service.getInvoiceStatus(invoice)).toBe('draft');
    });

    it('returns paid status for paid invoices', () => {
      const invoice = { ...mockInvoices[0], status: 'paid' as const };
      expect(service.getInvoiceStatus(invoice)).toBe('paid');
    });

    it('returns overdue status for overdue invoices', () => {
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const invoice = { ...mockInvoices[0], dueDate: pastDate.toISOString().split('T')[0], status: 'sent' as const };
      expect(service.getInvoiceStatus(invoice)).toBe('overdue');
    });

    it('returns sent status for non-overdue sent invoices', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      const invoice = { ...mockInvoices[0], dueDate: futureDate.toISOString().split('T')[0], status: 'sent' as const };
      expect(service.getInvoiceStatus(invoice)).toBe('sent');
    });
  });

  describe('getDueDateAlerts', () => {
    it('returns alerts for overdue invoices', () => {
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const overdueInvoices = mockInvoices.map(inv => ({
        ...inv,
        dueDate: pastDate.toISOString().split('T')[0],
        status: 'sent' as const,
      }));

      const alerts = service.getDueDateAlerts(overdueInvoices);
      expect(alerts).toHaveLength(2); // Two sent invoices
      expect(alerts.every(alert => alert.type === 'overdue')).toBe(true);
    });

    it('returns alerts for due soon invoices', () => {
      const today = new Date();
      const soonDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const dueSoonInvoices = mockInvoices.map(inv => ({
        ...inv,
        dueDate: soonDate.toISOString().split('T')[0],
        status: 'sent' as const,
      }));

      const alerts = service.getDueDateAlerts(dueSoonInvoices);
      expect(alerts).toHaveLength(2); // Two sent invoices
      expect(alerts.every(alert => alert.type === 'reminder')).toBe(true);
    });

    it('excludes paid and draft invoices', () => {
      const alerts = service.getDueDateAlerts(mockInvoices);
      expect(alerts).toHaveLength(0); // No alerts for paid/draft invoices
    });

    it('sorts alerts by type and days overdue', () => {
      const today = new Date();
      const overdueDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const soonDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const mixedInvoices = [
        { ...mockInvoices[0], dueDate: soonDate.toISOString().split('T')[0], status: 'sent' as const },
        { ...mockInvoices[1], dueDate: overdueDate.toISOString().split('T')[0], status: 'sent' as const },
      ];

      const alerts = service.getDueDateAlerts(mixedInvoices);
      expect(alerts[0].type).toBe('overdue'); // Overdue should come first
      expect(alerts[1].type).toBe('reminder');
    });
  });

  describe('getDueDateStats', () => {
    it('calculates statistics correctly', () => {
      const stats = service.getDueDateStats(mockInvoices);
      
      expect(stats.total).toBe(3);
      expect(stats.paid).toBe(1);
      expect(stats.draft).toBe(0);
      expect(stats.overdue).toBe(0);
      expect(stats.dueSoon).toBe(0);
    });

    it('calculates amounts correctly', () => {
      const stats = service.getDueDateStats(mockInvoices);
      
      expect(stats.overdueAmount).toBe(0);
      expect(stats.dueSoonAmount).toBe(0);
    });
  });

  describe('shouldUpdateStatus', () => {
    it('returns true when auto-update is enabled and status should change', () => {
      service.updateConfig({ autoUpdateStatus: true });
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const invoice = { ...mockInvoices[0], dueDate: pastDate.toISOString().split('T')[0], status: 'sent' as const };
      
      expect(service.shouldUpdateStatus(invoice)).toBe(true);
    });

    it('returns false when auto-update is disabled', () => {
      service.updateConfig({ autoUpdateStatus: false });
      const invoice = mockInvoices[0];
      
      expect(service.shouldUpdateStatus(invoice)).toBe(false);
    });
  });

  describe('getStatusUpdate', () => {
    it('returns new status when update is needed', () => {
      service.updateConfig({ autoUpdateStatus: true });
      const today = new Date();
      const pastDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const invoice = { ...mockInvoices[0], dueDate: pastDate.toISOString().split('T')[0], status: 'sent' as const };
      
      expect(service.getStatusUpdate(invoice)).toBe('overdue');
    });

    it('returns null when no update is needed', () => {
      service.updateConfig({ autoUpdateStatus: true });
      const invoice = mockInvoices[0];
      
      expect(service.getStatusUpdate(invoice)).toBe(null);
    });
  });

  describe('localStorage integration', () => {
    it('loads config from localStorage', () => {
      const savedConfig = {
        defaultDays: 45,
        reminderDays: 10,
        overdueDays: 0,
        autoUpdateStatus: false,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));
      
      const newService = DueDateTrackingService.getInstance();
      const config = newService.getConfig();
      expect(config.defaultDays).toBe(45);
    });

    it('saves config to localStorage', () => {
      service.updateConfig({ defaultDays: 60 });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'due-date-config',
        expect.stringContaining('"defaultDays":60')
      );
    });
  });
});
