import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvoiceDetail } from '../../hooks/useInvoiceDetail';
import { invoiceApiService } from '../../services/invoiceApiService';
import './InvoiceDetail.css';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    invoice,
    loading,
    error,
    isEditing,
    isDeleting,
    setIsEditing,
    updateStatus,
    deleteInvoice,
    refreshInvoice,
  } = useInvoiceDetail(id);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      // For now, we'll just refresh the invoice data
      // In a real implementation, this would update the invoice
      await refreshInvoice();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving invoice:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    refreshInvoice(); // Reset to original data
  };

  const handleDelete = async () => {
    if (!invoice || !window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInvoice();
      navigate('/invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      await invoiceApiService.downloadPDF(invoice.id);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice || !id) return;

    try {
      await updateStatus(newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'status--paid';
      case 'sent':
        return 'status--sent';
      case 'overdue':
        return 'status--overdue';
      case 'draft':
      default:
        return 'status--draft';
    }
  };

  if (loading) {
    return (
      <div className="invoice-detail">
        <div className="loading">
          <div className="loading__spinner"></div>
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="invoice-detail">
        <div className="error-state">
          <div className="error-state__icon">❌</div>
          <h2>Invoice Not Found</h2>
          <p>{error || 'The invoice you are looking for does not exist.'}</p>
        <div className="error-state__actions">
          <button onClick={refreshInvoice} className="btn btn--secondary">
            Retry
          </button>
          <Link to="/invoices" className="btn btn--primary">
            Back to Invoices
          </Link>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-detail">
      <div className="invoice-detail__header">
        <div className="invoice-detail__breadcrumb">
          <Link to="/invoices">← Back to Invoices</Link>
        </div>
        
        <div className="invoice-detail__title">
          <h1>Invoice {invoice.invoiceNumber}</h1>
          <span className={`status ${getStatusClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>

        <div className="invoice-detail__actions">
          {!isEditing ? (
            <>
              <button onClick={handleEdit} className="btn btn--secondary">
                ✏️ Edit
              </button>
              <button onClick={handleDownloadPDF} className="btn btn--primary">
                📄 Download PDF
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="btn btn--danger"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} className="btn btn--primary">
                💾 Save
              </button>
              <button onClick={handleCancel} className="btn btn--secondary">
                ❌ Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="invoice-detail__content">
        <div className="invoice-detail__main">
          <div className="invoice-info">
            <div className="invoice-info__section">
              <h3>Invoice Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Invoice Number</label>
                  <span>{invoice.invoiceNumber}</span>
                </div>
                <div className="info-item">
                  <label>Date</label>
                  <span>{formatDate(invoice.date)}</span>
                </div>
                <div className="info-item">
                  <label>Due Date</label>
                  <span>{invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  {isEditing ? (
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="status-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  ) : (
                    <span className={`status ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="invoice-info__section">
              <h3>Client Information</h3>
              <div className="client-info">
                <div className="client-info__name">{invoice.client.name}</div>
                <div className="client-info__email">{invoice.client.email}</div>
                <div className="client-info__phone">{invoice.client.phone}</div>
                <div className="client-info__address">{invoice.client.address}</div>
              </div>
            </div>

            <div className="invoice-info__section">
              <h3>Line Items</h3>
              <div className="line-items">
                <div className="line-items__header">
                  <div>Description</div>
                  <div>Quantity</div>
                  <div>Unit Price</div>
                  <div>Total</div>
                </div>
                {invoice.items.map((item, index) => (
                  <div key={index} className="line-items__row">
                    <div className="line-items__description">{item.description}</div>
                    <div className="line-items__quantity">{item.quantity}</div>
                    <div className="line-items__unit-price">{formatCurrency(item.unitPrice)}</div>
                    <div className="line-items__total">{formatCurrency(item.lineTotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-detail__sidebar">
          <div className="invoice-summary">
            <h3>Summary</h3>
            <div className="summary-item">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="summary-item">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="summary-item summary-item--total">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="invoice-notes">
              <h3>Notes</h3>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
