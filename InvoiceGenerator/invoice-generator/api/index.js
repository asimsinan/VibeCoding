// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { jsPDF } = require('jspdf');
const morgan = require('morgan');
const compression = require('compression');

// Create Express app
const app = express();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: ['https://invoice-generator-three-weld.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In-memory storage for invoices
let invoices = [];
let nextId = 1;

// API routes
app.get('/api/v1/invoices/stats', (req, res) => {
  const total = invoices.length;
  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const paid = invoices.filter(invoice => invoice.status === 'paid').length;
  const overdue = invoices.filter(invoice => invoice.status === 'overdue').length;
  const draft = invoices.filter(invoice => invoice.status === 'draft').length;
  const sent = invoices.filter(invoice => invoice.status === 'sent').length;

  res.json({
    success: true,
    data: {
      total,
      totalRevenue,
      paid,
      overdue,
      draft,
      sent
    }
  });
});

app.get('/api/v1/invoices', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const paginatedInvoices = invoices.slice(offset, offset + limit);
  
  res.json({
    success: true,
    data: paginatedInvoices,
    pagination: {
      page,
      limit,
      total: invoices.length,
      pages: Math.ceil(invoices.length / limit)
    }
  });
});

app.post('/api/v1/invoices', (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Calculate total if not provided
    let total = parseFloat(invoiceData.total) || 0;
    if (!total && invoiceData.items && Array.isArray(invoiceData.items)) {
      total = invoiceData.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const itemTotal = quantity * price;
        return sum + itemTotal;
      }, 0);
    }
    
    // Calculate subtotal (before tax)
    const subtotal = total;
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const finalTotal = subtotal + taxAmount;
    
    // Ensure all required fields have default values
    const newInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber: `INV-${String(nextId).padStart(4, '0')}`,
      date: invoiceData.date || new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      client: {
        name: '',
        email: '',
        address: '',
        phone: '',
        ...invoiceData.client
      },
      items: (invoiceData.items || []).map(item => ({
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.price) || 0, // Map price to unitPrice for frontend
        lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) // Map total to lineTotal
      })),
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      total: finalTotal,
      status: invoiceData.status || 'draft',
      dueDate: invoiceData.dueDate || null,
      notes: invoiceData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    invoices.push(newInvoice);
    nextId++;
    
    res.status(201).json({
      success: true,
      data: newInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
});

app.get('/api/v1/invoices/:id', (req, res) => {
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }
  
  res.json({
    success: true,
    data: invoice
  });
});

app.put('/api/v1/invoices/:id', (req, res) => {
  const invoiceIndex = invoices.findIndex(inv => inv.id === req.params.id);
  if (invoiceIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }
  
  const updateData = req.body;
  
  // Calculate total if items are being updated
  let total = parseFloat(updateData.total) || invoices[invoiceIndex].total;
  if (updateData.items && Array.isArray(updateData.items)) {
    total = updateData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const itemTotal = quantity * price;
      return sum + itemTotal;
    }, 0);
  }
  
  // Calculate subtotal and final total
  const subtotal = total;
  const taxRate = parseFloat(updateData.taxRate) || invoices[invoiceIndex].taxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const finalTotal = subtotal + taxAmount;
  
  // Update the invoice
  invoices[invoiceIndex] = {
    ...invoices[invoiceIndex],
    ...updateData,
    items: updateData.items ? updateData.items.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9), // Keep existing ID or generate new one
      description: item.description || '',
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.price) || 0, // Map price to unitPrice for frontend
      lineTotal: (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) // Map total to lineTotal
    })) : invoices[invoiceIndex].items,
    subtotal: subtotal,
    taxRate: taxRate,
    taxAmount: taxAmount,
    total: finalTotal,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: invoices[invoiceIndex],
    message: 'Invoice updated successfully'
  });
});

app.delete('/api/v1/invoices/:id', (req, res) => {
  const invoiceIndex = invoices.findIndex(inv => inv.id === req.params.id);
  if (invoiceIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }
  
  invoices.splice(invoiceIndex, 1);
  
  res.json({
    success: true,
    message: 'Invoice deleted successfully'
  });
});

// Update invoice status endpoint
app.patch('/api/v1/invoices/:id/status', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { status } = req.body;
    
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Update the invoice status
    invoices[invoiceIndex].status = status;
    invoices[invoiceIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: invoices[invoiceIndex],
      message: 'Invoice status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message
    });
  }
});

// PDF generation endpoint
app.get('/api/v1/invoices/:id/pdf', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // For now, return a simple text response indicating PDF generation
    // In a real implementation, you would generate an actual PDF here
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    
    // Generate PDF using jsPDF
    const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header background
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 25);
    
    // Invoice details in header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoiceNumber}`, 150, 20);
    doc.text(`Date: ${formatDate(invoice.date)}`, 150, 30);
    
    // Status badge
    const statusColor = invoice.status === 'paid' ? [34, 197, 94] : 
                       invoice.status === 'overdue' ? [239, 68, 68] : 
                       invoice.status === 'sent' ? [59, 130, 246] : [107, 114, 128];
    doc.setFillColor(...statusColor);
    doc.roundedRect(150, 35, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(invoice.status.toUpperCase(), 155, 40);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Company info section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Generator', 20, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Invoice Management', 20, 68);
    
    // Client information box
    doc.setFillColor(249, 250, 251); // Light gray background
    doc.roundedRect(20, 80, 80, 50, 3, 3, 'F');
    doc.setDrawColor(229, 231, 235); // Gray border
    doc.roundedRect(20, 80, 80, 50, 3, 3, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 25, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.client.name, 25, 98);
    doc.text(invoice.client.email, 25, 106);
    doc.text(invoice.client.phone, 25, 114);
    doc.text(invoice.client.address, 25, 122);
    
    // Line items table
    const tableStartY = 150;
    const tableWidth = 170;
    const colWidths = [80, 20, 30, 30]; // Description, Qty, Price, Total
    const colX = [20, 100, 120, 150];
    
    // Table header
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(20, tableStartY, tableWidth, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', colX[0], tableStartY + 10);
    doc.text('Qty', colX[1], tableStartY + 10);
    doc.text('Price', colX[2], tableStartY + 10);
    doc.text('Total', colX[3], tableStartY + 10);
    
    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    let yPosition = tableStartY + 15;
    
    invoice.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPosition - 5, tableWidth, 15, 'F');
      }
      
      doc.text(item.description, colX[0], yPosition);
      doc.text(item.quantity.toString(), colX[1], yPosition);
      doc.text(formatCurrency(item.unitPrice), colX[2], yPosition);
      doc.text(formatCurrency(item.lineTotal), colX[3], yPosition);
      yPosition += 15;
    });
    
    // Table border
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, tableStartY, tableWidth, yPosition - tableStartY, 3, 3, 'S');
    
    // Totals section
    const totalsY = yPosition + 20;
    const totalsX = 120;
    
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(totalsX, totalsY, 70, 50, 3, 3, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(totalsX, totalsY, 70, 50, 3, 3, 'S');
    
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX + 5, totalsY + 15);
    doc.text(formatCurrency(invoice.subtotal), totalsX + 45, totalsY + 15);
    
    doc.text(`Tax (${invoice.taxRate}%):`, totalsX + 5, totalsY + 25);
    doc.text(formatCurrency(invoice.taxAmount), totalsX + 45, totalsY + 25);
    
    // Total line
    doc.setDrawColor(59, 130, 246);
    doc.line(totalsX + 5, totalsY + 30, totalsX + 65, totalsY + 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX + 5, totalsY + 40);
    doc.text(formatCurrency(invoice.total), totalsX + 45, totalsY + 40);
    
    // Notes section
    if (invoice.notes) {
      const notesY = totalsY + 60;
      doc.setFillColor(255, 251, 235); // Light yellow background
      doc.roundedRect(20, notesY, 170, 30, 3, 3, 'F');
      doc.setDrawColor(251, 191, 36); // Yellow border
      doc.roundedRect(20, notesY, 170, 30, 3, 3, 'S');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 25, notesY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 25, notesY + 20);
    }
    
    // Footer
    const footerY = 280;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, footerY, 190, footerY);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for your business!', 20, footerY + 10);
    doc.text('Generated by Invoice Generator', 150, footerY + 10);
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// Catch-all handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Export for Vercel
module.exports = app;