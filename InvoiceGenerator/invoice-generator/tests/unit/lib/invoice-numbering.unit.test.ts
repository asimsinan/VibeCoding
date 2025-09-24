import { InvoiceNumberingService, InvoiceNumberingConfig } from '../../../src/lib/invoice-numbering';

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

describe('InvoiceNumberingService', () => {
  let service: InvoiceNumberingService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    service = InvoiceNumberingService.getInstance();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = InvoiceNumberingService.getInstance();
      const instance2 = InvoiceNumberingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('generates invoice number with default config', () => {
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('increments number on each call', () => {
      const number1 = service.generateInvoiceNumber();
      const number2 = service.generateInvoiceNumber();
      
      const parts1 = number1.split('-');
      const parts2 = number2.split('-');
      
      expect(parseInt(parts2[2])).toBe(parseInt(parts1[2]) + 1);
    });

    it('uses custom prefix', () => {
      service.updateConfig({ prefix: 'BILL' });
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^BILL-\d{4}-\d{4}$/);
    });

    it('uses custom padding', () => {
      service.updateConfig({ padding: 6 });
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^INV-\d{4}-\d{6}$/);
    });

    it('includes year when configured', () => {
      service.updateConfig({ includeYear: true });
      const number = service.generateInvoiceNumber();
      const currentYear = new Date().getFullYear().toString();
      expect(number).toContain(currentYear);
    });

    it('excludes year when configured', () => {
      service.updateConfig({ includeYear: false });
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^INV-\d{4}$/);
    });

    it('includes month when configured', () => {
      service.updateConfig({ includeMonth: true });
      const number = service.generateInvoiceNumber();
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      expect(number).toContain(currentMonth);
    });

    it('uses custom separator', () => {
      service.updateConfig({ separator: '_' });
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^INV_\d{4}_\d{4}$/);
    });

    it('uses no separator when configured', () => {
      service.updateConfig({ separator: '' });
      const number = service.generateInvoiceNumber();
      expect(number).toMatch(/^INV\d{4}\d{4}$/);
    });
  });

  describe('getConfig', () => {
    it('returns current configuration', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('prefix');
      expect(config).toHaveProperty('startNumber');
      expect(config).toHaveProperty('padding');
      expect(config).toHaveProperty('includeYear');
      expect(config).toHaveProperty('includeMonth');
      expect(config).toHaveProperty('separator');
    });
  });

  describe('updateConfig', () => {
    it('updates configuration', () => {
      service.updateConfig({ prefix: 'QUOTE' });
      const config = service.getConfig();
      expect(config.prefix).toBe('QUOTE');
    });

    it('merges with existing configuration', () => {
      service.updateConfig({ prefix: 'QUOTE', padding: 6 });
      const config = service.getConfig();
      expect(config.prefix).toBe('QUOTE');
      expect(config.padding).toBe(6);
      expect(config.includeYear).toBe(true); // Should keep existing value
    });
  });

  describe('resetNumbering', () => {
    it('resets counter to start number', () => {
      // Generate a few numbers first
      service.generateInvoiceNumber();
      service.generateInvoiceNumber();
      
      service.resetNumbering();
      
      const nextNumber = service.getNextNumber();
      const parts = nextNumber.split('-');
      expect(parseInt(parts[2])).toBe(1);
    });
  });

  describe('getNextNumber', () => {
    it('returns next number without incrementing counter', () => {
      const next1 = service.getNextNumber();
      const next2 = service.getNextNumber();
      expect(next1).toBe(next2);
    });

    it('increments after generateInvoiceNumber is called', () => {
      const next1 = service.getNextNumber();
      service.generateInvoiceNumber();
      const next2 = service.getNextNumber();
      
      const parts1 = next1.split('-');
      const parts2 = next2.split('-');
      expect(parseInt(parts2[2])).toBe(parseInt(parts1[2]) + 1);
    });
  });

  describe('getLastGenerated', () => {
    it('returns last generated number', () => {
      const number = service.generateInvoiceNumber();
      expect(service.getLastGenerated()).toBe(number);
    });

    it('returns empty string when no number generated', () => {
      service.resetNumbering();
      expect(service.getLastGenerated()).toBe('');
    });
  });

  describe('getStats', () => {
    it('returns statistics', () => {
      service.generateInvoiceNumber();
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('lastGenerated');
      expect(stats).toHaveProperty('nextNumber');
      expect(stats).toHaveProperty('config');
    });

    it('calculates total generated correctly', () => {
      service.resetNumbering();
      service.generateInvoiceNumber();
      service.generateInvoiceNumber();
      
      const stats = service.getStats();
      expect(stats.totalGenerated).toBe(2);
    });
  });

  describe('localStorage integration', () => {
    it('loads state from localStorage', () => {
      const savedState = {
        lastNumber: 5,
        lastGenerated: 'INV-2024-0005',
        config: {
          prefix: 'BILL',
          startNumber: 1,
          padding: 4,
          includeYear: true,
          includeMonth: false,
          separator: '-',
        },
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const newService = InvoiceNumberingService.getInstance();
      const config = newService.getConfig();
      expect(config.prefix).toBe('BILL');
    });

    it('saves state to localStorage', () => {
      service.updateConfig({ prefix: 'TEST' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'invoice-numbering-state',
        expect.stringContaining('"prefix":"TEST"')
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      expect(() => {
        service.updateConfig({ prefix: 'TEST' });
      }).not.toThrow();
    });
  });
});
