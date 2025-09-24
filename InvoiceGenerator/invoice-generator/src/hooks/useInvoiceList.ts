import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '../types/invoice';
import { invoiceApiService, InvoiceListParams, InvoiceListResponse } from '../services/invoiceApiService';
import { useInvoiceContext } from '../contexts/InvoiceContext';

export interface UseInvoiceListReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  refreshInvoices: () => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export const useInvoiceList = (initialParams: InvoiceListParams = {}): UseInvoiceListReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(initialParams.page || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>(initialParams.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(initialParams.status || '');
  const [sortBy, setSortBy] = useState<string>(initialParams.sortBy || 'date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialParams.sortOrder || 'desc');
  const { refreshStats } = useInvoiceContext();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: InvoiceListParams = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };

      const response: InvoiceListResponse = await invoiceApiService.getInvoices(params);
      
      setInvoices(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  const refreshInvoices = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      await invoiceApiService.deleteInvoice(id);
      await refreshInvoices(); // Refresh the list after deletion
      refreshStats(); // Refresh stats to update overdue count
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      throw err;
    }
  }, [refreshInvoices, refreshStats]);

  // Fetch invoices when dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  return {
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
  };
};
