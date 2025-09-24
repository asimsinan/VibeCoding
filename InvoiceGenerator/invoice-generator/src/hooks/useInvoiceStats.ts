import { useState, useEffect, useCallback } from 'react';
import { invoiceApiService } from '../services/invoiceApiService';

export interface InvoiceStats {
  total: number;
  totalRevenue: number;
  paid: number;
  overdue: number;
  draft: number;
  sent: number;
}

export interface UseInvoiceStatsReturn {
  stats: InvoiceStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useInvoiceStats = (): UseInvoiceStatsReturn => {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await invoiceApiService.getInvoiceStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice statistics';
      setError(errorMessage);
      console.error('Error fetching invoice stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
};
