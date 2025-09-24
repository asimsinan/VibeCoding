export interface InvoiceNumberingConfig {
  prefix: string;
  startNumber: number;
  padding: number;
  includeYear: boolean;
  includeMonth: boolean;
  separator: string;
}

export interface InvoiceNumberingState {
  lastNumber: number;
  lastGenerated: string;
  config: InvoiceNumberingConfig;
}

const DEFAULT_CONFIG: InvoiceNumberingConfig = {
  prefix: 'INV',
  startNumber: 1,
  padding: 4,
  includeYear: true,
  includeMonth: false,
  separator: '-',
};

export class InvoiceNumberingService {
  private static instance: InvoiceNumberingService;
  private state: InvoiceNumberingState;

  private constructor() {
    this.state = this.loadState();
  }

  public static getInstance(): InvoiceNumberingService {
    if (!InvoiceNumberingService.instance) {
      InvoiceNumberingService.instance = new InvoiceNumberingService();
    }
    return InvoiceNumberingService.instance;
  }

  private loadState(): InvoiceNumberingState {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('invoice-numbering-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            config: { ...DEFAULT_CONFIG, ...parsed.config },
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load invoice numbering state:', error);
    }

    return {
      lastNumber: DEFAULT_CONFIG.startNumber - 1,
      lastGenerated: '',
      config: { ...DEFAULT_CONFIG },
    };
  }

  private saveState(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('invoice-numbering-state', JSON.stringify(this.state));
      }
    } catch (error) {
      console.warn('Failed to save invoice numbering state:', error);
    }
  }

  public generateInvoiceNumber(): string {
    const { config } = this.state;
    const now = new Date();
    
    let number = this.state.lastNumber + 1;
    let parts: string[] = [config.prefix];

    if (config.includeYear) {
      parts.push(now.getFullYear().toString());
    }

    if (config.includeMonth) {
      parts.push((now.getMonth() + 1).toString().padStart(2, '0'));
    }

    const paddedNumber = number.toString().padStart(config.padding, '0');
    parts.push(paddedNumber);

    const invoiceNumber = parts.join(config.separator);

    this.state.lastNumber = number;
    this.state.lastGenerated = invoiceNumber;
    this.saveState();

    return invoiceNumber;
  }

  public getConfig(): InvoiceNumberingConfig {
    return { ...this.state.config };
  }

  public updateConfig(newConfig: Partial<InvoiceNumberingConfig>): void {
    this.state.config = { ...this.state.config, ...newConfig };
    this.saveState();
  }

  public resetNumbering(): void {
    this.state.lastNumber = this.state.config.startNumber - 1;
    this.state.lastGenerated = '';
    this.saveState();
  }

  public getNextNumber(): string {
    const { config } = this.state;
    const now = new Date();
    
    let number = this.state.lastNumber + 1;
    let parts: string[] = [config.prefix];

    if (config.includeYear) {
      parts.push(now.getFullYear().toString());
    }

    if (config.includeMonth) {
      parts.push((now.getMonth() + 1).toString().padStart(2, '0'));
    }

    const paddedNumber = number.toString().padStart(config.padding, '0');
    parts.push(paddedNumber);

    return parts.join(config.separator);
  }

  public getLastGenerated(): string {
    return this.state.lastGenerated;
  }

  public getStats(): {
    totalGenerated: number;
    lastGenerated: string;
    nextNumber: string;
    config: InvoiceNumberingConfig;
  } {
    return {
      totalGenerated: this.state.lastNumber - this.state.config.startNumber + 1,
      lastGenerated: this.state.lastGenerated,
      nextNumber: this.getNextNumber(),
      config: { ...this.state.config },
    };
  }
}

// Export singleton instance
export const invoiceNumberingService = InvoiceNumberingService.getInstance();
