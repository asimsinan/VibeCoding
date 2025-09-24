import React, { createContext, useContext, ReactNode } from 'react';

interface RefreshContextType {
  refreshStats: () => void;
  refreshInvoices: () => void;
  refreshInvoiceCount: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
  refreshStats: () => void;
  refreshInvoices: () => void;
  refreshInvoiceCount: () => void;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({
  children,
  refreshStats,
  refreshInvoices,
  refreshInvoiceCount,
}) => {
  return (
    <RefreshContext.Provider value={{
      refreshStats,
      refreshInvoices,
      refreshInvoiceCount,
    }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextType => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
