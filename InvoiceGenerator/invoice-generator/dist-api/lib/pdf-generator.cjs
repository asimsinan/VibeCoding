"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFDownloader = exports.PDFStyler = exports.PDFGenerator = void 0;
exports.generateAndDownloadPDF = generateAndDownloadPDF;
exports.generatePDF = generatePDF;
exports.downloadPDF = downloadPDF;
exports.generateFilename = generateFilename;
const jspdf_1 = __importDefault(require("jspdf"));
/**
 * Default styling options for PDF generation
 */
const DEFAULT_STYLING_OPTIONS = {
    fontFamily: 'helvetica',
    fontSize: 12,
    primaryColor: '#333333',
    secondaryColor: '#666666',
    headerColor: '#000000',
    showLogo: false,
    showWatermark: false,
    pageMargins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    headerHeight: 60,
    footerHeight: 30
};
/**
 * Default layout options for PDF generation
 */
const DEFAULT_LAYOUT_OPTIONS = {
    showLogo: false,
    showWatermark: false,
    pageMargins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    headerHeight: 60,
    footerHeight: 30
};
/**
 * PDF Generator class for creating invoice PDFs
 */
class PDFGenerator {
    constructor(stylingOptions = {}, layoutOptions = DEFAULT_LAYOUT_OPTIONS) {
        this.doc = new jspdf_1.default();
        this.stylingOptions = { ...DEFAULT_STYLING_OPTIONS, ...stylingOptions };
        this.layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...layoutOptions };
        // Set font to support Unicode characters
        this.doc.setFont('helvetica', 'normal');
    }
    /**
     * Generate PDF from invoice data
     */
    async generatePDF(invoice) {
        try {
            this.validateInvoice(invoice);
            this.setupDocument();
            this.createHeader(invoice);
            this.createClientInfo(invoice);
            this.createLineItemsTable(invoice);
            this.createTotalsSection(invoice);
            this.createFooter();
            return new Uint8Array(this.doc.output('arraybuffer'));
        }
        catch (error) {
            throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate invoice data
     */
    validateInvoice(invoice) {
        if (!invoice) {
            throw new Error('Invoice data is required');
        }
        if (!invoice.client) {
            throw new Error('Client information is required');
        }
        if (!invoice.items || invoice.items.length === 0) {
            throw new Error('At least one line item is required');
        }
    }
    /**
     * Setup document with basic configuration
     */
    setupDocument() {
        // Clear any existing content by creating a fresh page
        this.doc = new jspdf_1.default();
        this.doc.setProperties({
            title: 'Invoice',
            subject: 'Invoice Document',
            author: 'Invoice Generator',
            creator: 'Invoice Generator'
        });
        // Set encoding to UTF-8 for proper character support
        this.doc.setCharSpace(0);
        // Use a font that supports Unicode characters properly
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
    }
    /**
     * Create invoice header
     */
    createHeader(invoice) {
        const { pageMargins, headerHeight } = this.layoutOptions;
        // Header background - modern blue gradient effect
        this.doc.setFillColor(44, 62, 80); // Dark blue like the web header
        this.doc.rect(0, 0, 210, headerHeight, 'F');
        // Add a subtle border
        this.doc.setDrawColor(52, 152, 219);
        this.doc.setLineWidth(0.5);
        this.doc.rect(0, 0, 210, headerHeight);
        // Invoice title - larger and more prominent
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(28);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('INVOICE', pageMargins.left, 35);
        // Invoice details in a more organized layout
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        // Right-aligned invoice details
        const rightX = 190;
        this.doc.text(`Invoice #: ${invoice.invoiceNumber}`, rightX, 25, { align: 'right' });
        this.doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, rightX, 32, { align: 'right' });
        this.doc.text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, rightX, 39, { align: 'right' });
        // Reset text color
        this.doc.setTextColor(0, 0, 0);
    }
    /**
     * Create client information section
     */
    createClientInfo(invoice) {
        const { pageMargins } = this.layoutOptions;
        const startY = this.layoutOptions.headerHeight + 25;
        // Bill To section with better styling
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(44, 62, 80); // Dark blue color
        this.doc.text('BILL TO:', pageMargins.left, startY);
        // Add a line under Bill To
        this.doc.setDrawColor(44, 62, 80);
        this.doc.setLineWidth(1);
        this.doc.line(pageMargins.left, startY + 2, pageMargins.left + 50, startY + 2);
        // Client information with better spacing
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        // Handle Unicode characters by converting to safe characters
        const clientName = this.sanitizeText(invoice.client.name || '');
        const clientAddress = this.sanitizeText(invoice.client.address || '');
        const clientEmail = this.sanitizeText(invoice.client.email || '');
        const clientPhone = this.sanitizeText(invoice.client.phone || '');
        let currentY = startY + 12;
        this.doc.text(clientName, pageMargins.left, currentY);
        if (clientAddress) {
            currentY += 8;
            this.doc.text(clientAddress, pageMargins.left, currentY);
        }
        if (clientEmail) {
            currentY += 8;
            this.doc.text(clientEmail, pageMargins.left, currentY);
        }
        if (clientPhone) {
            currentY += 8;
            this.doc.text(clientPhone, pageMargins.left, currentY);
        }
    }
    /**
     * Create line items table
     */
    createLineItemsTable(invoice) {
        const { pageMargins } = this.layoutOptions;
        const startY = this.layoutOptions.headerHeight + 100;
        const tableWidth = 170;
        const rowHeight = 12;
        // Table headers with modern styling
        this.doc.setFillColor(44, 62, 80); // Dark blue header
        this.doc.rect(pageMargins.left, startY, tableWidth, rowHeight, 'F');
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(255, 255, 255);
        this.doc.text('DESCRIPTION', pageMargins.left + 3, startY + 8);
        this.doc.text('QTY', pageMargins.left + 100, startY + 8);
        this.doc.text('UNIT PRICE', pageMargins.left + 120, startY + 8);
        this.doc.text('TOTAL', pageMargins.left + 150, startY + 8);
        // Table rows with better styling
        let currentY = startY + rowHeight;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        invoice.items.forEach((item, index) => {
            // Alternate row background
            if (index % 2 === 0) {
                this.doc.setFillColor(248, 249, 250);
                this.doc.rect(pageMargins.left, currentY - 2, tableWidth, rowHeight, 'F');
            }
            // Handle Unicode characters in item descriptions
            const itemDescription = this.sanitizeText(item.description || '');
            this.doc.setFontSize(10);
            this.doc.text(itemDescription, pageMargins.left + 3, currentY + 7);
            this.doc.setFontSize(10);
            this.doc.text(item.quantity.toString(), pageMargins.left + 100, currentY + 7);
            this.doc.text(`$${item.unitPrice.toFixed(2)}`, pageMargins.left + 120, currentY + 7);
            this.doc.text(`$${item.lineTotal.toFixed(2)}`, pageMargins.left + 150, currentY + 7);
            currentY += rowHeight;
        });
        // Table border with modern styling
        this.doc.setDrawColor(44, 62, 80);
        this.doc.setLineWidth(0.5);
        this.doc.rect(pageMargins.left, startY, tableWidth, (invoice.items.length + 1) * rowHeight);
    }
    /**
     * Create totals section
     */
    createTotalsSection(invoice) {
        const { pageMargins } = this.layoutOptions;
        const startY = this.layoutOptions.headerHeight + 100 + (invoice.items.length + 1) * 12 + 20;
        // Totals section with better styling
        const totalsWidth = 100;
        const totalsX = pageMargins.left + 80;
        // Background for totals section
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(totalsX, startY - 5, totalsWidth, 40, 'F');
        // Border around totals
        this.doc.setDrawColor(44, 62, 80);
        this.doc.setLineWidth(0.5);
        this.doc.rect(totalsX, startY - 5, totalsWidth, 40);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        // Subtotal - properly positioned
        this.doc.text('Subtotal:', totalsX + 5, startY + 8);
        this.doc.text(`$${invoice.subtotal.toFixed(2)}`, totalsX + totalsWidth - 5, startY + 8, { align: 'right' });
        // Tax - properly positioned
        if (invoice.taxRate > 0) {
            this.doc.text(`Tax (${invoice.taxRate}%):`, totalsX + 5, startY + 18);
            this.doc.text(`$${invoice.taxAmount.toFixed(2)}`, totalsX + totalsWidth - 5, startY + 18, { align: 'right' });
        }
        // Total with emphasis - properly positioned
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        this.doc.setTextColor(44, 62, 80);
        this.doc.text('TOTAL:', totalsX + 5, startY + 30);
        this.doc.text(`$${invoice.total.toFixed(2)}`, totalsX + totalsWidth - 5, startY + 30, { align: 'right' });
        // Reset text color
        this.doc.setTextColor(0, 0, 0);
    }
    /**
     * Sanitize text for PDF generation to handle Unicode characters
     */
    sanitizeText(text) {
        if (!text)
            return '';
        // Don't convert Unicode characters, just ensure proper encoding
        // jsPDF should handle Unicode properly with the right font
        return text;
    }
    /**
     * Create footer
     */
    createFooter() {
        const pageCount = this.doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setFont(this.stylingOptions.fontFamily, 'normal');
            this.doc.text(`Page ${i} of ${pageCount}`, 190, 290);
            this.doc.text('Thank you for your business!', 20, 290);
        }
    }
}
exports.PDFGenerator = PDFGenerator;
/**
 * PDF Styler class for applying styling to PDF documents
 */
class PDFStyler {
    /**
     * Apply styling to PDF document
     */
    static applyStyling(doc, options = {}) {
        const stylingOptions = { ...DEFAULT_STYLING_OPTIONS, ...options };
        // Set default font
        doc.setFont(stylingOptions.fontFamily, 'normal');
        doc.setFontSize(stylingOptions.fontSize);
        doc.setTextColor(parseInt(stylingOptions.primaryColor.substring(1, 3), 16), parseInt(stylingOptions.primaryColor.substring(3, 5), 16), parseInt(stylingOptions.primaryColor.substring(5, 7), 16));
    }
    /**
     * Apply professional header styling
     */
    static applyHeaderStyling(doc, options = {}) {
        const stylingOptions = { ...DEFAULT_STYLING_OPTIONS, ...options };
        // Header background
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 210, stylingOptions.headerHeight);
        // Header text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(stylingOptions.fontFamily, 'bold');
    }
    /**
     * Apply table styling
     */
    static applyTableStyling(doc, startX, startY, width, height) {
        // Table border
        doc.setDrawColor(200, 200, 200);
        doc.rect(startX, startY, width, height);
        // Header row background
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, startY, width, 10, 'F');
    }
}
exports.PDFStyler = PDFStyler;
/**
 * PDF Downloader class for handling PDF downloads
 */
class PDFDownloader {
    /**
     * Download PDF with given data and filename
     */
    static async downloadPDF(pdfData, filename) {
        try {
            if (!pdfData || pdfData.length === 0) {
                throw new Error('Invalid PDF data');
            }
            if (!filename || filename.trim() === '') {
                throw new Error('Invalid filename');
            }
            const blob = new Blob([new Uint8Array(Array.from(pdfData))], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate filename from invoice data
     */
    static generateFilename(invoiceId, date) {
        const sanitizedId = invoiceId.replace(/[^a-zA-Z0-9-_]/g, '-');
        const dateStr = date.toISOString().split('T')[0];
        return `invoice-${sanitizedId}-${dateStr}.pdf`;
    }
    /**
     * Generate filename from client name and date
     */
    static generateFilenameFromClient(clientName, date) {
        const sanitizedName = clientName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const dateStr = date.toISOString().split('T')[0];
        return `invoice-${sanitizedName}-${dateStr}.pdf`;
    }
}
exports.PDFDownloader = PDFDownloader;
/**
 * Main PDF service function
 */
async function generateAndDownloadPDF(invoice, options = {}) {
    try {
        const generator = new PDFGenerator(options);
        const pdfData = await generator.generatePDF(invoice);
        const filename = PDFDownloader.generateFilename(invoice.invoiceNumber, new Date(invoice.date));
        await PDFDownloader.downloadPDF(pdfData, filename);
    }
    catch (error) {
        throw new Error(`PDF generation and download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate PDF data only (without download)
 */
async function generatePDF(invoice, options = {}) {
    try {
        const generator = new PDFGenerator(options);
        return await generator.generatePDF(invoice);
    }
    catch (error) {
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Download existing PDF data
 */
async function downloadPDF(pdfData, filename) {
    try {
        await PDFDownloader.downloadPDF(pdfData, filename);
    }
    catch (error) {
        throw new Error(`PDF download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate filename for invoice
 */
function generateFilename(invoiceId, date) {
    return PDFDownloader.generateFilename(invoiceId, date);
}
