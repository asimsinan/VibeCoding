#!/usr/bin/env node
/**
 * PDF Service
 * 
 * Service for PDF generation operations
 */

import { PDFGenerator } from '../../lib/pdf-generator';
import { Invoice } from '../../types/invoice';

export class PDFService {
  constructor() {
    // No need to create PDFGenerator instance here
  }

  /**
   * Generate PDF for an invoice
   */
  async generatePDF(invoice: Invoice): Promise<Uint8Array> {
    try {
      // Create a new PDFGenerator instance for each PDF to avoid content accumulation
      const pdfGenerator = new PDFGenerator();
      return await pdfGenerator.generatePDF(invoice);
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
