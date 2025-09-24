import React from 'react';
import { Invoice } from '../../types/invoice';
import './PrintButton.css';

interface PrintButtonProps {
  invoice: Invoice;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  invoice,
  disabled = false,
  className = '',
  children,
}) => {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow popups to print invoices');
      return;
    }

    // Generate the print content
    const printContent = generatePrintContent(invoice);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  const generatePrintContent = (invoice: Invoice): string => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            
            .print-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
            }
            
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #2c3e50;
            }
            
            .invoice-title {
              font-size: 2rem;
              font-weight: 700;
              color: #2c3e50;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .invoice-details {
              text-align: right;
            }
            
            .invoice-details h3 {
              color: #2c3e50;
              margin-bottom: 0.5rem;
              font-size: 1.1rem;
            }
            
            .invoice-details p {
              color: #6c757d;
              margin-bottom: 0.25rem;
            }
            
            .client-section {
              margin-bottom: 2rem;
            }
            
            .client-section h3 {
              color: #2c3e50;
              margin-bottom: 1rem;
              font-size: 1.1rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .client-info {
              background: #f8f9fa;
              padding: 1rem;
              border-radius: 8px;
              border-left: 4px solid #3498db;
            }
            
            .client-info p {
              margin-bottom: 0.25rem;
              color: #2c3e50;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 2rem;
            }
            
            .items-table th {
              background: #2c3e50;
              color: white;
              padding: 1rem;
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 0.9rem;
            }
            
            .items-table td {
              padding: 1rem;
              border-bottom: 1px solid #e9ecef;
            }
            
            .items-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            .items-table tr:hover {
              background: #e9ecef;
            }
            
            .text-right {
              text-align: right;
            }
            
            .totals-section {
              background: #f8f9fa;
              padding: 1.5rem;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.5rem;
            }
            
            .totals-row.total {
              font-weight: 700;
              font-size: 1.1rem;
              color: #2c3e50;
              border-top: 2px solid #e9ecef;
              padding-top: 0.5rem;
              margin-top: 0.5rem;
            }
            
            .notes-section {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e9ecef;
            }
            
            .notes-section h3 {
              color: #2c3e50;
              margin-bottom: 0.5rem;
              font-size: 1.1rem;
            }
            
            .notes-section p {
              color: #6c757d;
              line-height: 1.6;
            }
            
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-draft {
              background: #f8f9fa;
              color: #6c757d;
            }
            
            .status-sent {
              background: #cce5ff;
              color: #0066cc;
            }
            
            .status-paid {
              background: #d4edda;
              color: #155724;
            }
            
            .status-overdue {
              background: #f8d7da;
              color: #721c24;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              .print-container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="invoice-header">
              <div>
                <h1 class="invoice-title">Invoice</h1>
              </div>
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                <p><strong>Due Date:</strong> ${invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
              </div>
            </div>
            
            <div class="client-section">
              <h3>Bill To:</h3>
              <div class="client-info">
                <p><strong>${invoice.client.name}</strong></p>
                <p>${invoice.client.email}</p>
                <p>${invoice.client.phone}</p>
                <p>${invoice.client.address}</p>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.lineTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="totals-row">
                <span>Tax (${invoice.taxRate}%):</span>
                <span>${formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div class="totals-row total">
                <span>Total:</span>
                <span>${formatCurrency(invoice.total)}</span>
              </div>
            </div>
            
            ${invoice.notes ? `
              <div class="notes-section">
                <h3>Notes</h3>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <button
      onClick={handlePrint}
      disabled={disabled}
      className={`print-button ${className}`}
      title="Print invoice"
    >
      {children || '🖨️ Print'}
    </button>
  );
};
