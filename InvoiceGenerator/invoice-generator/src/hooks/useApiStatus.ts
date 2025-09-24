import { useState, useEffect, useCallback } from 'react';

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [savedInvoiceCount, setSavedInvoiceCount] = useState<number>(0);

  const fetchInvoiceCount = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const invoicesResponse = await fetch(`${apiUrl}/api/v1/invoices`);
      if (invoicesResponse.ok) {
        const data = await invoicesResponse.json();
        setSavedInvoiceCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching invoice count:', error);
    }
  }, []);

  const checkApiConnection = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        setApiStatus('connected');
        await fetchInvoiceCount();
      } else {
        setApiStatus('disconnected');
      }
    } catch (error) {
      setApiStatus('disconnected');
    }
  }, [fetchInvoiceCount]);

  useEffect(() => {
    checkApiConnection();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiConnection, 30000);
    
    return () => clearInterval(interval);
  }, [checkApiConnection]);

  return { apiStatus, savedInvoiceCount, refreshInvoiceCount: fetchInvoiceCount };
};
