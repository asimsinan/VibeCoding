import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoiceList } from '../../hooks/useInvoiceList';
import { Pagination } from '../../components/Pagination/Pagination';
import { ConfirmationModal } from '../../components/ConfirmationModal/ConfirmationModal';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { invoiceApiService } from '../../services/invoiceApiService';
import './InvoiceList.css';

export const InvoiceList: React.FC = () => {
  const {
    invoices,
    loading,
    error,
    total,
    page,
    totalPages,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    setSortOrder,
    setPage,
    refreshInvoices,
    deleteInvoice,
  } = useInvoiceList();
  
  const { refreshInvoiceCount } = useInvoiceContext();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isBulkOperating, setIsBulkOperating] = useState<boolean>(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setDeletingId(id);
      try {
        await deleteInvoice(id);
        await refreshInvoiceCount(); // Refresh the count immediately
      } catch (error) {
        console.error('Error deleting invoice:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSelectInvoice = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedInvoices(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(invoices.map(invoice => invoice.id));
      setSelectedInvoices(allIds);
    } else {
      setSelectedInvoices(new Set());
    }
    setShowBulkActions(checked);
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;

    setIsBulkOperating(true);
    try {
      const result = await invoiceApiService.bulkDeleteInvoices(Array.from(selectedInvoices));
      console.log(`Deleted ${result.deleted} invoices, ${result.failed} failed`);
      setSelectedInvoices(new Set());
      setShowBulkActions(false);
      setShowDeleteModal(false);
      await refreshInvoices();
      await refreshInvoiceCount(); // Refresh the count immediately
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkExportCSV = async () => {
    try {
      await invoiceApiService.exportToCSV({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  const handleBulkExportJSON = async () => {
    try {
      await invoiceApiService.exportToJSON({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      console.error('Error exporting to JSON:', error);
    }
  };

  const handleBulkDownloadPDFs = async () => {
    if (selectedInvoices.size === 0) return;

    try {
      await invoiceApiService.bulkDownloadPDFs(Array.from(selectedInvoices));
    } catch (error) {
      console.error('Error bulk downloading PDFs:', error);
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
      month: 'short',
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

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span>↕️</span>;
    return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="invoice-list">
      <div className="invoice-list__header">
        <h1>Invoices ({total})</h1>
        <div className="invoice-list__actions">
          <Link to="/create" className="btn btn--primary">
            ➕ Create Invoice
          </Link>
        </div>
      </div>

      <div className="invoice-list__filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search invoices..." 
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-controls">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="export-controls">
          <button onClick={handleBulkExportCSV} className="btn btn--secondary">
            📊 Export CSV
          </button>
          <button onClick={handleBulkExportJSON} className="btn btn--secondary">
            📄 Export JSON
          </button>
        </div>
      </div>

      {showBulkActions && (
        <div className="bulk-actions">
          <div className="bulk-actions__info">
            {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
          </div>
          <div className="bulk-actions__buttons">
            <button 
              onClick={handleBulkDownloadPDFs}
              className="btn btn--secondary"
            >
              📄 Download PDFs
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="btn btn--danger"
            >
              🗑️ Delete Selected
            </button>
            <button 
              onClick={() => {
                setSelectedInvoices(new Set());
                setShowBulkActions(false);
              }}
              className="btn btn--secondary"
            >
              ❌ Clear Selection
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={refreshInvoices} className="btn btn--secondary">
            Retry
          </button>
        </div>
      )}

      <div className="invoice-list__content">
        <div className="invoice-table">
          <div className="invoice-table__header">
            <div className="invoice-table__cell invoice-table__cell--checkbox">
              <input
                type="checkbox"
                checked={invoices.length > 0 && selectedInvoices.size === invoices.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="checkbox"
              />
            </div>
            <div 
              className="invoice-table__cell invoice-table__cell--sortable"
              onClick={() => handleSort('invoiceNumber')}
            >
              Invoice # <SortIcon field="invoiceNumber" />
            </div>
            <div 
              className="invoice-table__cell invoice-table__cell--sortable"
              onClick={() => handleSort('client.name')}
            >
              Client <SortIcon field="client.name" />
            </div>
            <div 
              className="invoice-table__cell invoice-table__cell--sortable"
              onClick={() => handleSort('date')}
            >
              Date <SortIcon field="date" />
            </div>
            <div 
              className="invoice-table__cell invoice-table__cell--sortable"
              onClick={() => handleSort('total')}
            >
              Amount <SortIcon field="total" />
            </div>
            <div 
              className="invoice-table__cell invoice-table__cell--sortable"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon field="status" />
            </div>
            <div className="invoice-table__cell">Actions</div>
          </div>
          
          {loading ? (
            <div className="invoice-table__loading">
              <div className="loading">
                <div className="loading__spinner"></div>
                Loading invoices...
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="invoice-table__empty">
              <div className="empty-state">
                <div className="empty-state__icon">📄</div>
                <h3>No invoices found</h3>
                <p>Create your first invoice to get started</p>
                <Link to="/create" className="btn btn--primary">
                  Create Invoice
                </Link>
              </div>
            </div>
          ) : (
            <div className="invoice-table__body">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="invoice-table__row">
                  <div className="invoice-table__cell invoice-table__cell--checkbox">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                      className="checkbox"
                    />
                  </div>
                  <div className="invoice-table__cell">
                    <Link to={`/invoices/${invoice.id}`} className="invoice-link">
                      {invoice.invoiceNumber}
                    </Link>
                  </div>
                  <div className="invoice-table__cell">
                    {invoice.client.name}
                  </div>
                  <div className="invoice-table__cell">
                    {formatDate(invoice.date)}
                  </div>
                  <div className="invoice-table__cell">
                    {formatCurrency(invoice.total)}
                  </div>
                  <div className="invoice-table__cell">
                    <span className={`status ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="invoice-table__cell">
                    <div className="action-buttons">
                      <Link 
                        to={`/invoices/${invoice.id}`} 
                        className="btn btn--small btn--secondary"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        disabled={deletingId === invoice.id}
                        className="btn btn--small btn--danger"
                      >
                        {deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showInfo={true}
            maxVisiblePages={5}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Invoices"
        message={`Are you sure you want to delete ${selectedInvoices.size} invoice${selectedInvoices.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isBulkOperating}
      />
    </div>
  );
};

export default InvoiceList;
