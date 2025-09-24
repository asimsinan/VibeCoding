import React, { useMemo } from 'react';
import { InvoicePreviewProps } from '../../types/invoice';
import { formatCurrency } from '../../lib/index';
import './InvoicePreview.css';

/**
 * InvoicePreview Component
 * 
 * A component for displaying a real-time preview of the invoice.
 * Features:
 * - Live preview updates
 * - Responsive design (mobile-first)
 * - Print-friendly styling
 * - Accessibility compliance
 */
export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  isPrintMode = false,
  className = ''
}) => {
  const containerClasses = useMemo(() => {
    const baseClasses = ['invoice-preview', 'responsive'];
    
    if (isPrintMode) {
      baseClasses.push('print-mode');
    }
    
    if (className) {
      baseClasses.push(className);
    }
    
    // Add viewport-specific classes
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        baseClasses.push('mobile');
      } else if (width < 1024) {
        baseClasses.push('tablet');
      } else {
        baseClasses.push('desktop');
      }
    }
    
    return baseClasses.join(' ');
  }, [isPrintMode, className]);

  const formattedSubtotal = formatCurrency(invoice.subtotal);
  const formattedTaxAmount = formatCurrency(invoice.taxAmount);
  const formattedTotal = formatCurrency(invoice.total);
  const formattedDate = new Date(invoice.date).toLocaleDateString();
  const formattedDueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '';

  return (
    <div 
      className={containerClasses}
      data-testid="invoice-preview"
      aria-label="Invoice Preview"
    >
      <div className="invoice-preview__container">
        {/* Header Section */}
        <header className="invoice-preview__header">
          <h1 className="invoice-preview__title">INVOICE</h1>
          <div className="invoice-preview__invoice-info">
            <div className="invoice-preview__invoice-number">
              <strong>Invoice #:</strong> {invoice.invoiceNumber}
            </div>
            <div className="invoice-preview__dates">
              <div className="invoice-preview__date">
                <strong>Invoice Date:</strong> {formattedDate}
              </div>
              {formattedDueDate && (
                <div className="invoice-preview__due-date">
                  <strong>Due Date:</strong> {formattedDueDate}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Client Information */}
        <section className="invoice-preview__client-section">
          <h2 className="invoice-preview__section-title">Bill To:</h2>
          <div className="invoice-preview__client-info">
            {invoice.client.name && (
              <div className="invoice-preview__client-name">{invoice.client.name}</div>
            )}
            {invoice.client.address && (
              <div className="invoice-preview__client-address">{invoice.client.address}</div>
            )}
            {invoice.client.email && (
              <div className="invoice-preview__client-email">{invoice.client.email}</div>
            )}
            {invoice.client.phone && (
              <div className="invoice-preview__client-phone">{invoice.client.phone}</div>
            )}
          </div>
        </section>

        {/* Line Items Table */}
        <section className="invoice-preview__items-section">
          <table className="invoice-preview__items-table" role="table">
            <thead>
              <tr>
                <th className="invoice-preview__header-cell">Description</th>
                <th className="invoice-preview__header-cell">Quantity</th>
                <th className="invoice-preview__header-cell">Unit Price</th>
                <th className="invoice-preview__header-cell">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item) => (
                  <tr key={item.id} className="invoice-preview__item-row">
                    <td className="invoice-preview__item-cell invoice-preview__item-cell--description">
                      {item.description}
                    </td>
                    <td className="invoice-preview__item-cell invoice-preview__item-cell--quantity">
                      {item.quantity}
                    </td>
                    <td className="invoice-preview__item-cell invoice-preview__item-cell--unit-price">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="invoice-preview__item-cell invoice-preview__item-cell--total">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="invoice-preview__empty-cell">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Totals Section */}
        <section className="invoice-preview__totals-section">
          <div className="invoice-preview__totals">
            <div className="invoice-preview__total-row">
              <span className="invoice-preview__total-label">Subtotal:</span>
              <span className="invoice-preview__total-value">{formattedSubtotal}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="invoice-preview__total-row">
                <span className="invoice-preview__total-label">Tax ({invoice.taxRate}%):</span>
                <span className="invoice-preview__total-value">{formattedTaxAmount}</span>
              </div>
            )}
            <div className="invoice-preview__total-row invoice-preview__total-row--final">
              <span className="invoice-preview__total-label">Total:</span>
              <span className="invoice-preview__total-value invoice-preview__total-value--final">
                {formattedTotal}
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="invoice-preview__footer">
          <div className="invoice-preview__status">
            Status: <span className="invoice-preview__status-value">{invoice.status.toUpperCase()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InvoicePreview;
