#!/usr/bin/env node
/**
 * Invoice Controller
 * 
 * Handles HTTP requests for invoice operations
 */

import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import { PDFService } from '../services/PDFService';

export class InvoiceController {
  private invoiceService: InvoiceService;
  private pdfService: PDFService;

  constructor() {
    this.invoiceService = new InvoiceService();
    this.pdfService = new PDFService();
  }

  /**
   * Create a new invoice
   */
  createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoiceData = req.body;
      const invoice = await this.invoiceService.createInvoice(invoiceData);
      
      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get invoice by ID
   */
  getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const invoice = await this.invoiceService.getInvoice(id);
      
      if (!invoice) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update invoice by ID
   */
  updateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const invoiceData = req.body;
      
      const invoice = await this.invoiceService.updateInvoice(id, invoiceData);
      
      if (!invoice) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete invoice by ID
   */
  deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.invoiceService.deleteInvoice(id);
      
      if (!deleted) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate PDF for invoice
   */
  generatePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const invoice = await this.invoiceService.getInvoice(id);
      
      if (!invoice) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        });
        return;
      }

      const pdfBuffer = await this.pdfService.generatePDF(invoice);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all invoices with pagination
   */
  listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';
      
      const result = await this.invoiceService.listInvoices({
        page,
        limit,
        status,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        data: result.invoices,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get invoice statistics
   */
  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.invoiceService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get invoice numbering configuration
   */
  getNumberingConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.invoiceService.getNumberingConfig();
      res.json({
        success: true,
        data: config,
        message: 'Numbering configuration retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update invoice numbering configuration
   */
  updateNumberingConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { config } = req.body;
      
      if (!config) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Configuration data is required',
          code: 'MISSING_CONFIG'
        });
        return;
      }

      await this.invoiceService.updateNumberingConfig(config);
      res.json({
        success: true,
        message: 'Numbering configuration updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get invoice numbering stats
   */
  getNumberingStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.invoiceService.getNumberingStats();
      res.json({
        success: true,
        data: stats,
        message: 'Numbering statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset invoice numbering
   */
  resetNumbering = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.invoiceService.resetNumbering();
      res.json({
        success: true,
        message: 'Invoice numbering reset successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete invoices
   */
  bulkDeleteInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'IDs array is required and must not be empty',
          code: 'INVALID_IDS'
        });
        return;
      }

      const result = await this.invoiceService.bulkDeleteInvoices(ids);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update invoice status
   */
  updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Status is required',
          code: 'MISSING_STATUS'
        });
        return;
      }

      const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid status. Must be one of: draft, sent, paid, overdue',
          code: 'INVALID_STATUS'
        });
        return;
      }

      const invoice = await this.invoiceService.updateInvoiceStatus(id, status);
      
      if (!invoice) {
        res.status(404).json({
          error: 'NotFoundError',
          message: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk download PDFs
   */
  bulkDownloadPDFs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'IDs array is required and must not be empty',
          code: 'INVALID_IDS'
        });
        return;
      }

      const zipBuffer = await this.invoiceService.bulkDownloadPDFs(ids);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export invoices to CSV
   */
  exportToCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, sortBy, sortOrder } = req.query;
      
      const options = {
        search: search as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      };

      const csvBuffer = await this.invoiceService.exportToCSV(options);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export invoices to JSON
   */
  exportToJSON = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, sortBy, sortOrder } = req.query;
      
      const options = {
        search: search as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      };

      const jsonBuffer = await this.invoiceService.exportToJSON(options);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(jsonBuffer);
    } catch (error) {
      next(error);
    }
  };
}
