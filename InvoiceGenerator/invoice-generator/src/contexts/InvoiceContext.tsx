import React, { createContext, useContext, ReactNode } from 'react';

interface InvoiceContextType {
  refreshInvoiceCount: () => Promise<void>;
  refreshStats: () => void;
  refreshInvoices: () => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

interface InvoiceProviderProps {
  children: ReactNode;
  refreshInvoiceCount: () => Promise<void>;
  refreshStats: () => void;
  refreshInvoices: () => void;
}

export const InvoiceProvider: React.FC<InvoiceProviderProps> = ({ 
  children, 
  refreshInvoiceCount,
  refreshStats,
  refreshInvoices
}) => {
  return (
    <InvoiceContext.Provider value={{ 
      refreshInvoiceCount,
      refreshStats,
      refreshInvoices
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoiceContext = (): InvoiceContextType => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
};
