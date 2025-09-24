#!/usr/bin/env node
"use strict";
/**
 * PDF Service
 *
 * Service for PDF generation operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdf_generator_1 = require("../../lib/pdf-generator.cjs");
class PDFService {
    constructor() {
        // No need to create PDFGenerator instance here
    }
    /**
     * Generate PDF for an invoice
     */
    async generatePDF(invoice) {
        try {
            // Create a new PDFGenerator instance for each PDF to avoid content accumulation
            const pdfGenerator = new pdf_generator_1.PDFGenerator();
            return await pdfGenerator.generatePDF(invoice);
        }
        catch (error) {
            throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.PDFService = PDFService;
