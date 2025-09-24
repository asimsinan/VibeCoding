"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceNumberingService = exports.InvoiceNumberingService = void 0;
const DEFAULT_CONFIG = {
    prefix: 'INV',
    startNumber: 1,
    padding: 4,
    includeYear: true,
    includeMonth: false,
    separator: '-',
};
class InvoiceNumberingService {
    constructor() {
        this.state = this.loadState();
    }
    static getInstance() {
        if (!InvoiceNumberingService.instance) {
            InvoiceNumberingService.instance = new InvoiceNumberingService();
        }
        return InvoiceNumberingService.instance;
    }
    loadState() {
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
        }
        catch (error) {
            console.warn('Failed to load invoice numbering state:', error);
        }
        return {
            lastNumber: DEFAULT_CONFIG.startNumber - 1,
            lastGenerated: '',
            config: { ...DEFAULT_CONFIG },
        };
    }
    saveState() {
        try {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('invoice-numbering-state', JSON.stringify(this.state));
            }
        }
        catch (error) {
            console.warn('Failed to save invoice numbering state:', error);
        }
    }
    generateInvoiceNumber() {
        const { config } = this.state;
        const now = new Date();
        let number = this.state.lastNumber + 1;
        let parts = [config.prefix];
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
    getConfig() {
        return { ...this.state.config };
    }
    updateConfig(newConfig) {
        this.state.config = { ...this.state.config, ...newConfig };
        this.saveState();
    }
    resetNumbering() {
        this.state.lastNumber = this.state.config.startNumber - 1;
        this.state.lastGenerated = '';
        this.saveState();
    }
    getNextNumber() {
        const { config } = this.state;
        const now = new Date();
        let number = this.state.lastNumber + 1;
        let parts = [config.prefix];
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
    getLastGenerated() {
        return this.state.lastGenerated;
    }
    getStats() {
        return {
            totalGenerated: this.state.lastNumber - this.state.config.startNumber + 1,
            lastGenerated: this.state.lastGenerated,
            nextNumber: this.getNextNumber(),
            config: { ...this.state.config },
        };
    }
}
exports.InvoiceNumberingService = InvoiceNumberingService;
// Export singleton instance
exports.invoiceNumberingService = InvoiceNumberingService.getInstance();
