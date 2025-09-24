import React from 'react';
import { useStatusManagement } from '../../hooks/useStatusManagement';
import { Invoice } from '../../types/invoice';
import './DueDateAlerts.css';

interface DueDateAlertsProps {
  invoices: Invoice[];
  onInvoiceClick?: (invoiceId: string) => void;
}

export const DueDateAlerts: React.FC<DueDateAlertsProps> = ({
  invoices,
  onInvoiceClick,
}) => {
  const {
    alerts,
    overdueCount,
    dueSoonCount,
    overdueAmount,
    dueSoonAmount,
    clearAlert,
    clearAllAlerts,
  } = useStatusManagement(invoices);

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

  const getAlertIcon = (type: 'reminder' | 'overdue') => {
    return type === 'overdue' ? '🚨' : '⏰';
  };

  const getAlertClass = (type: 'reminder' | 'overdue') => {
    return type === 'overdue' ? 'alert--overdue' : 'alert--reminder';
  };

  if (alerts.length === 0) {
    return (
      <div className="due-date-alerts">
        <div className="due-date-alerts__header">
          <h3>Due Date Alerts</h3>
          <div className="due-date-alerts__summary">
            <span className="summary-item summary-item--success">
              ✅ All invoices are up to date
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="due-date-alerts">
      <div className="due-date-alerts__header">
        <h3>Due Date Alerts</h3>
        <div className="due-date-alerts__summary">
          {overdueCount > 0 && (
            <span className="summary-item summary-item--overdue">
              🚨 {overdueCount} overdue ({formatCurrency(overdueAmount)})
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="summary-item summary-item--due-soon">
              ⏰ {dueSoonCount} due soon ({formatCurrency(dueSoonAmount)})
            </span>
          )}
          <button
            onClick={clearAllAlerts}
            className="clear-all-btn"
            title="Clear all alerts"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="due-date-alerts__list">
        {alerts.map((alert) => (
          <div
            key={`${alert.invoiceId}-${alert.type}`}
            className={`alert-item ${getAlertClass(alert.type)}`}
            onClick={() => onInvoiceClick?.(alert.invoiceId)}
          >
            <div className="alert-item__icon">
              {getAlertIcon(alert.type)}
            </div>
            <div className="alert-item__content">
              <div className="alert-item__header">
                <span className="alert-item__invoice">
                  {alert.invoiceNumber}
                </span>
                <span className="alert-item__amount">
                  {formatCurrency(alert.amount)}
                </span>
              </div>
              <div className="alert-item__client">
                {alert.clientName}
              </div>
              <div className="alert-item__due-date">
                Due: {formatDate(alert.dueDate)}
                {alert.daysOverdue > 0 && (
                  <span className="alert-item__overdue-days">
                    ({alert.daysOverdue} days overdue)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAlert(alert.invoiceId);
              }}
              className="alert-item__dismiss"
              title="Dismiss alert"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
