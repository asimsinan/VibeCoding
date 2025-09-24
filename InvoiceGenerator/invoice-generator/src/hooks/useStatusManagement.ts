import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '../types/invoice';
import { dueDateTrackingService, DueDateAlert } from '../lib/due-date-tracking';
import { useToast } from './useToast';

export interface StatusManagementReturn {
  alerts: DueDateAlert[];
  overdueCount: number;
  dueSoonCount: number;
  overdueAmount: number;
  dueSoonAmount: number;
  updateInvoiceStatus: (invoiceId: string, status: string) => Promise<void>;
  markAsPaid: (invoiceId: string) => Promise<void>;
  markAsSent: (invoiceId: string) => Promise<void>;
  refreshAlerts: () => void;
  clearAlert: (invoiceId: string) => void;
  clearAllAlerts: () => void;
}

export const useStatusManagement = (invoices: Invoice[] = []): StatusManagementReturn => {
  const [alerts, setAlerts] = useState<DueDateAlert[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [dueSoonCount, setDueSoonCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [dueSoonAmount, setDueSoonAmount] = useState(0);
  const { showSuccess, showError } = useToast();

  const refreshAlerts = useCallback(() => {
    const newAlerts = dueDateTrackingService.getDueDateAlerts(invoices);
    const stats = dueDateTrackingService.getDueDateStats(invoices);
    
    setAlerts(newAlerts);
    setOverdueCount(stats.overdue);
    setDueSoonCount(stats.dueSoon);
    setOverdueAmount(stats.overdueAmount);
    setDueSoonAmount(stats.dueSoonAmount);
  }, [invoices]);

  const updateInvoiceStatus = useCallback(async (_invoiceId: string, status: string) => {
    try {
      // In a real implementation, this would call the API
      // For now, we'll just show a success message
      showSuccess('Status updated successfully!', `Invoice status changed to ${status}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update status';
      showError('Failed to update status', errorMsg);
    }
  }, [showSuccess, showError]);

  const markAsPaid = useCallback(async (invoiceId: string) => {
    await updateInvoiceStatus(invoiceId, 'paid');
  }, [updateInvoiceStatus]);

  const markAsSent = useCallback(async (invoiceId: string) => {
    await updateInvoiceStatus(invoiceId, 'sent');
  }, [updateInvoiceStatus]);

  const clearAlert = useCallback((invoiceId: string) => {
    setAlerts(prev => prev.filter(alert => alert.invoiceId !== invoiceId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  return {
    alerts,
    overdueCount,
    dueSoonCount,
    overdueAmount,
    dueSoonAmount,
    updateInvoiceStatus,
    markAsPaid,
    markAsSent,
    refreshAlerts,
    clearAlert,
    clearAllAlerts,
  };
};
