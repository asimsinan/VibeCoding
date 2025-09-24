import { Invoice } from '../types/invoice';

export interface DueDateConfig {
  defaultDays: number;
  reminderDays: number;
  overdueDays: number;
  autoUpdateStatus: boolean;
}

export interface DueDateAlert {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  dueDate: string;
  daysOverdue: number;
  amount: number;
  type: 'reminder' | 'overdue';
}

const DEFAULT_CONFIG: DueDateConfig = {
  defaultDays: 30,
  reminderDays: 7,
  overdueDays: 0,
  autoUpdateStatus: true,
};

export class DueDateTrackingService {
  private static instance: DueDateTrackingService;
  private config: DueDateConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DueDateTrackingService {
    if (!DueDateTrackingService.instance) {
      DueDateTrackingService.instance = new DueDateTrackingService();
    }
    return DueDateTrackingService.instance;
  }

  private loadConfig(): DueDateConfig {
    try {
      const saved = localStorage.getItem('due-date-config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load due date config:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('due-date-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save due date config:', error);
    }
  }

  public getConfig(): DueDateConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DueDateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  public calculateDueDate(invoiceDate: string, days?: number): string {
    const date = new Date(invoiceDate);
    const dueDays = days || this.config.defaultDays;
    date.setDate(date.getDate() + dueDays);
    return date.toISOString().split('T')[0];
  }

  public getDaysUntilDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDaysOverdue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  public isOverdue(dueDate: string): boolean {
    return this.getDaysOverdue(dueDate) > 0;
  }

  public isDueSoon(dueDate: string): boolean {
    const daysUntilDue = this.getDaysUntilDue(dueDate);
    return daysUntilDue <= this.config.reminderDays && daysUntilDue >= 0;
  }

  public getInvoiceStatus(invoice: Invoice): 'draft' | 'sent' | 'paid' | 'overdue' {
    if (invoice.status === 'paid' || invoice.status === 'draft') {
      return invoice.status;
    }

    if (this.isOverdue(invoice.dueDate || '')) {
      return 'overdue';
    }

    return invoice.status as 'sent' | 'paid';
  }

  public getDueDateAlerts(invoices: Invoice[]): DueDateAlert[] {
    const alerts: DueDateAlert[] = [];

    for (const invoice of invoices) {
      if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'draft') {
        continue;
      }

      const daysOverdue = this.getDaysOverdue(invoice.dueDate);
      const daysUntilDue = this.getDaysUntilDue(invoice.dueDate);

      if (daysOverdue > 0) {
        alerts.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client.name,
          dueDate: invoice.dueDate,
          daysOverdue,
          amount: invoice.total,
          type: 'overdue',
        });
      } else if (daysUntilDue <= this.config.reminderDays && daysUntilDue >= 0) {
        alerts.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client.name,
          dueDate: invoice.dueDate,
          daysOverdue: 0,
          amount: invoice.total,
          type: 'reminder',
        });
      }
    }

    return alerts.sort((a, b) => {
      if (a.type === 'overdue' && b.type === 'reminder') return -1;
      if (a.type === 'reminder' && b.type === 'overdue') return 1;
      return b.daysOverdue - a.daysOverdue;
    });
  }

  public getOverdueInvoices(invoices: Invoice[]): Invoice[] {
    return invoices.filter(invoice => 
      invoice.dueDate && 
      this.isOverdue(invoice.dueDate) && 
      invoice.status !== 'paid'
    );
  }

  public getDueSoonInvoices(invoices: Invoice[]): Invoice[] {
    return invoices.filter(invoice => 
      invoice.dueDate && 
      this.isDueSoon(invoice.dueDate) && 
      invoice.status !== 'paid' &&
      !this.isOverdue(invoice.dueDate)
    );
  }

  public getDueDateStats(invoices: Invoice[]): {
    total: number;
    overdue: number;
    dueSoon: number;
    paid: number;
    draft: number;
    overdueAmount: number;
    dueSoonAmount: number;
  } {
    const overdue = this.getOverdueInvoices(invoices);
    const dueSoon = this.getDueSoonInvoices(invoices);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const draft = invoices.filter(inv => inv.status === 'draft');

    return {
      total: invoices.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      paid: paid.length,
      draft: draft.length,
      overdueAmount: overdue.reduce((sum, inv) => sum + inv.total, 0),
      dueSoonAmount: dueSoon.reduce((sum, inv) => sum + inv.total, 0),
    };
  }

  public shouldUpdateStatus(invoice: Invoice): boolean {
    if (!this.config.autoUpdateStatus || !invoice.dueDate) {
      return false;
    }

    const currentStatus = this.getInvoiceStatus(invoice);
    return currentStatus !== invoice.status;
  }

  public getStatusUpdate(invoice: Invoice): string | null {
    if (!this.shouldUpdateStatus(invoice)) {
      return null;
    }

    return this.getInvoiceStatus(invoice);
  }
}

// Export singleton instance
export const dueDateTrackingService = DueDateTrackingService.getInstance();
