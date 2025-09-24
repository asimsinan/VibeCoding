"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dueDateTrackingService = exports.DueDateTrackingService = void 0;
const DEFAULT_CONFIG = {
    defaultDays: 30,
    reminderDays: 7,
    overdueDays: 0,
    autoUpdateStatus: true,
};
class DueDateTrackingService {
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!DueDateTrackingService.instance) {
            DueDateTrackingService.instance = new DueDateTrackingService();
        }
        return DueDateTrackingService.instance;
    }
    loadConfig() {
        try {
            const saved = localStorage.getItem('due-date-config');
            if (saved) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
            }
        }
        catch (error) {
            console.warn('Failed to load due date config:', error);
        }
        return { ...DEFAULT_CONFIG };
    }
    saveConfig() {
        try {
            localStorage.setItem('due-date-config', JSON.stringify(this.config));
        }
        catch (error) {
            console.warn('Failed to save due date config:', error);
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }
    calculateDueDate(invoiceDate, days) {
        const date = new Date(invoiceDate);
        const dueDays = days || this.config.defaultDays;
        date.setDate(date.getDate() + dueDays);
        return date.toISOString().split('T')[0];
    }
    getDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getDaysOverdue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    isOverdue(dueDate) {
        return this.getDaysOverdue(dueDate) > 0;
    }
    isDueSoon(dueDate) {
        const daysUntilDue = this.getDaysUntilDue(dueDate);
        return daysUntilDue <= this.config.reminderDays && daysUntilDue >= 0;
    }
    getInvoiceStatus(invoice) {
        if (invoice.status === 'paid' || invoice.status === 'draft') {
            return invoice.status;
        }
        if (this.isOverdue(invoice.dueDate || '')) {
            return 'overdue';
        }
        return invoice.status;
    }
    getDueDateAlerts(invoices) {
        const alerts = [];
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
            }
            else if (daysUntilDue <= this.config.reminderDays && daysUntilDue >= 0) {
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
            if (a.type === 'overdue' && b.type === 'reminder')
                return -1;
            if (a.type === 'reminder' && b.type === 'overdue')
                return 1;
            return b.daysOverdue - a.daysOverdue;
        });
    }
    getOverdueInvoices(invoices) {
        return invoices.filter(invoice => invoice.dueDate &&
            this.isOverdue(invoice.dueDate) &&
            invoice.status !== 'paid');
    }
    getDueSoonInvoices(invoices) {
        return invoices.filter(invoice => invoice.dueDate &&
            this.isDueSoon(invoice.dueDate) &&
            invoice.status !== 'paid' &&
            !this.isOverdue(invoice.dueDate));
    }
    getDueDateStats(invoices) {
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
    shouldUpdateStatus(invoice) {
        if (!this.config.autoUpdateStatus || !invoice.dueDate) {
            return false;
        }
        const currentStatus = this.getInvoiceStatus(invoice);
        return currentStatus !== invoice.status;
    }
    getStatusUpdate(invoice) {
        if (!this.shouldUpdateStatus(invoice)) {
            return null;
        }
        return this.getInvoiceStatus(invoice);
    }
}
exports.DueDateTrackingService = DueDateTrackingService;
// Export singleton instance
exports.dueDateTrackingService = DueDateTrackingService.getInstance();
