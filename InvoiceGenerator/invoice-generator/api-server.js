#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { PDFGenerator } from './src/lib/pdf-generator.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let invoices = [];
let nextId = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    invoicesCount: invoices.length
  });
});

// Create invoice
app.post('/api/v1/invoices', (req, res) => {
  const invoice = {
    id: `inv_${nextId++}`,
    ...req.body,
    subtotal: req.body.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0,
    taxAmount: 0,
    total: 0,
    invoiceNumber: `INV-2024-${String(nextId).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft'
  };
  
  invoice.taxAmount = invoice.subtotal * (req.body.taxRate || 0) / 100;
  invoice.total = invoice.subtotal + invoice.taxAmount;
  
  invoices.push(invoice);
  console.log(`📝 Created invoice: ${invoice.id} for ${invoice.client.name}`);
  res.status(201).json(invoice);
});

// Get invoice
app.get('/api/v1/invoices/:id', (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(invoice);
});

// Update invoice
app.put('/api/v1/invoices/:id', (req, res) => {
  const index = invoices.findIndex(inv => inv.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const updatedInvoice = { ...invoices[index], ...req.body };
  invoices[index] = updatedInvoice;
  console.log(`✏️ Updated invoice: ${updatedInvoice.id}`);
  res.json(updatedInvoice);
});

// Generate PDF
app.post('/api/v1/invoices/:id/pdf', async (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  try {
    console.log(`📄 Generating PDF for invoice: ${invoice.id}`);
    const pdfGenerator = new PDFGenerator();
    const pdfData = await pdfGenerator.generatePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.pdf"`);
    res.send(pdfData);
    console.log(`✅ PDF generated successfully for invoice: ${invoice.id}`);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// List all invoices
app.get('/api/v1/invoices', (req, res) => {
  res.json({
    invoices,
    count: invoices.length,
    total: invoices.reduce((sum, inv) => sum + inv.total, 0)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Invoice API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API endpoints: http://localhost:${PORT}/api/v1`);
  console.log(`💾 Data storage: In-memory (${invoices.length} invoices)`);
});
