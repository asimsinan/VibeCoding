
import { Link } from 'react-router-dom';
import { useInvoiceStats } from '../../hooks/useInvoiceStats';
import { useInvoiceList } from '../../hooks/useInvoiceList';

import './Dashboard.css';

export const Dashboard: React.FC = () => {
  
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useInvoiceStats();
  const { invoices: recentInvoices, loading: invoicesLoading } = useInvoiceList({ 
    limit: 5, 
    sortBy: 'date', 
    sortOrder: 'desc' 
  });
 




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

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Dashboard</h1>
        <p>Overview of your invoice management system</p>
        {statsError && (
          <div className="error-message">
            {statsError}
            <button onClick={refreshStats} className="btn btn--secondary">
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__icon">📄</div>
          <div className="stat-card__content">
            <h3>Total Invoices</h3>
            <p className="stat-card__number">
              {statsLoading ? '...' : stats?.total || 0}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">💰</div>
          <div className="stat-card__content">
            <h3>Total Revenue</h3>
            <p className="stat-card__number">
              {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">⏰</div>
          <div className="stat-card__content">
            <h3>Overdue</h3>
            <p className="stat-card__number">
              {statsLoading ? '...' : stats?.overdue || 0}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon">✅</div>
          <div className="stat-card__content">
            <h3>Paid</h3>
            <p className="stat-card__number">
              {statsLoading ? '...' : stats?.paid || 0}
            </p>
          </div>
        </div>
      </div>

             <div className="dashboard__content">
               <div className="dashboard__section">
                 <div className="dashboard__section__header">
                   <h2>Recent Invoices</h2>
                   <Link to="/invoices" className="btn btn--secondary">
                     View All
                   </Link>
                 </div>
          
          {invoicesLoading ? (
            <div className="loading">
              <div className="loading__spinner"></div>
              Loading recent invoices...
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📄</div>
              <h3>No invoices yet</h3>
              <p>Create your first invoice to get started</p>
              <Link to="/create" className="btn btn--primary">
                Create Invoice
              </Link>
            </div>
          ) : (
            <div className="recent-invoices">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="recent-invoice">
                  <div className="recent-invoice__info">
                    <Link to={`/invoices/${invoice.id}`} className="recent-invoice__link">
                      {invoice.invoiceNumber}
                    </Link>
                    <span className="recent-invoice__client">{invoice.client.name}</span>
                  </div>
                  <div className="recent-invoice__details">
                    <span className="recent-invoice__amount">
                      {formatCurrency(invoice.total)}
                    </span>
                    <span className={`status ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <span className="recent-invoice__date">
                      {formatDate(invoice.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard__section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/create" className="quick-action">
              ➕ Create New Invoice
            </Link>
            <Link to="/invoices" className="quick-action">
              📋 View All Invoices
            </Link>
            <Link to="/settings" className="quick-action">
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
