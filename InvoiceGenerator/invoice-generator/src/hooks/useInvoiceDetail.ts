import { useState, useEffect, useCallback } from 'react';
import { invoiceApiService } from '../services/invoiceApiService';
import { Invoice, InvoiceRequest } from '../types/invoice';
import { useInvoiceContext } from '../contexts/InvoiceContext';

export interface UseInvoiceDetailReturn {
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  setIsEditing: (editing: boolean) => void;
  updateInvoice: (data: Partial<InvoiceRequest>) => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
  deleteInvoice: () => Promise<void>;
  refreshInvoice: () => Promise<void>;
}

export const useInvoiceDetail = (id: string | undefined): UseInvoiceDetailReturn => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { refreshStats, refreshInvoices } = useInvoiceContext();

  const fetchInvoice = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const invoiceData = await invoiceApiService.getInvoice(id);
      setInvoice(invoiceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice';
      setError(errorMessage);
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateInvoice = useCallback(async (data: Partial<InvoiceRequest>) => {
    if (!id || !invoice) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedInvoice = await invoiceApiService.updateInvoice(id, data);
      setInvoice(updatedInvoice);
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [id, invoice]);

  const updateStatus = useCallback(async (status: string) => {
    if (!id) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedInvoice = await invoiceApiService.updateInvoiceStatus(id, status);
      setInvoice(updatedInvoice);
      
      // Refresh stats and invoices to update overdue count and other data
      refreshStats();
      refreshInvoices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice status';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [id, refreshStats, refreshInvoices]);

  const deleteInvoice = useCallback(async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await invoiceApiService.deleteInvoice(id);
      
      // Refresh stats and invoices after deletion
      refreshStats();
      refreshInvoices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [id, refreshStats, refreshInvoices]);

  const refreshInvoice = useCallback(async () => {
    await fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    loading,
    error,
    isEditing,
    isSaving,
    isDeleting,
    setIsEditing,
    updateInvoice,
    updateStatus,
    deleteInvoice,
    refreshInvoice,
  };
};
