#!/usr/bin/env node
/**
 * Invoice Routes
 * 
 * RESTful API routes for invoice management
 */

import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';

const router = Router();
const invoiceController = new InvoiceController();

// Rate limiting removed for simplicity

/**
 * @route POST /api/v1/invoices
 * @desc Create a new invoice
 * @access Public
 */
router.post('/invoices', invoiceController.createInvoice);

/**
 * @route GET /api/v1/invoices/stats
 * @desc Get invoice statistics
 * @access Public
 */
router.get('/invoices/stats', invoiceController.getStats);

/**
 * @route GET /api/v1/invoices
 * @desc List all invoices (with pagination)
 * @access Public
 */
router.get('/invoices', invoiceController.listInvoices);

/**
 * @route GET /api/v1/invoices/:id
 * @desc Get invoice by ID
 * @access Public
 */
router.get('/invoices/:id', invoiceController.getInvoice);

/**
 * @route PUT /api/v1/invoices/:id
 * @desc Update invoice by ID
 * @access Public
 */
router.put('/invoices/:id', invoiceController.updateInvoice);

/**
 * @route DELETE /api/v1/invoices/:id
 * @desc Delete invoice by ID
 * @access Public
 */
router.delete('/invoices/:id', invoiceController.deleteInvoice);

/**
 * @route GET /api/v1/invoices/:id/pdf
 * @desc Generate PDF for invoice
 * @access Public
 */
router.get('/invoices/:id/pdf', invoiceController.generatePDF);

/**
 * @route POST /api/v1/invoices/bulk-delete
 * @desc Bulk delete invoices
 * @access Public
 */
router.post('/invoices/bulk-delete', invoiceController.bulkDeleteInvoices);

/**
 * @route PATCH /api/v1/invoices/:id/status
 * @desc Update invoice status
 * @access Public
 */
router.patch('/invoices/:id/status', invoiceController.updateInvoiceStatus);

/**
 * @route POST /api/v1/invoices/bulk-pdf
 * @desc Bulk download PDFs
 * @access Public
 */
router.post('/invoices/bulk-pdf', invoiceController.bulkDownloadPDFs);

/**
 * @route GET /api/v1/invoices/export/csv
 * @desc Export invoices to CSV
 * @access Public
 */
router.get('/invoices/export/csv', invoiceController.exportToCSV);

/**
 * @route GET /api/v1/invoices/export/json
 * @desc Export invoices to JSON
 * @access Public
 */
router.get('/invoices/export/json', invoiceController.exportToJSON);

/**
 * @route GET /api/v1/invoices/numbering/config
 * @desc Get invoice numbering configuration
 * @access Public
 */
router.get('/invoices/numbering/config', invoiceController.getNumberingConfig);

/**
 * @route PUT /api/v1/invoices/numbering/config
 * @desc Update invoice numbering configuration
 * @access Public
 */
router.put('/invoices/numbering/config', invoiceController.updateNumberingConfig);

/**
 * @route GET /api/v1/invoices/numbering/stats
 * @desc Get invoice numbering statistics
 * @access Public
 */
router.get('/invoices/numbering/stats', invoiceController.getNumberingStats);

/**
 * @route POST /api/v1/invoices/numbering/reset
 * @desc Reset invoice numbering
 * @access Public
 */
router.post('/invoices/numbering/reset', invoiceController.resetNumbering);

export { router as invoiceRoutes };
