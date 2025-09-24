import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation/Navigation';
import { Dashboard } from './pages/Dashboard/Dashboard';
import InvoiceList from './pages/InvoiceList/InvoiceList';
import { InvoiceDetail } from './pages/InvoiceDetail/InvoiceDetail';
import { CreateInvoice } from './pages/CreateInvoice/CreateInvoice';
import { Settings } from './pages/Settings/Settings';
import { NotFound } from './pages/NotFound/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer/ToastContainer';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { useApiStatus } from './hooks/useApiStatus';
import { useInvoiceStats } from './hooks/useInvoiceStats';
import { useToast } from './hooks/useToast';
import './AppRouter.css';

const AppWithContext: React.FC<{ apiStatus: 'connected' | 'disconnected' | 'checking'; savedInvoiceCount: number }> = ({ apiStatus, savedInvoiceCount }) => {
  const { toasts, removeToast } = useToast();

  return (
    <Router>
      <div className="app-router">
        <Navigation 
          apiStatus={apiStatus} 
          savedInvoiceCount={savedInvoiceCount} 
        />
        
        <main className="app-router__main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/create" element={<CreateInvoice />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </Router>
  );
};

const AppWithRefresh: React.FC<{ apiStatus: 'connected' | 'disconnected' | 'checking'; savedInvoiceCount: number }> = ({ apiStatus, savedInvoiceCount }) => {
  return <AppWithContext apiStatus={apiStatus} savedInvoiceCount={savedInvoiceCount} />;
};

const AppWithProvider: React.FC<{ apiStatus: 'connected' | 'disconnected' | 'checking'; savedInvoiceCount: number; refreshStats: () => void; refreshInvoiceCount: () => Promise<void> }> = ({ apiStatus, savedInvoiceCount, refreshStats, refreshInvoiceCount }) => {
  return (
    <InvoiceProvider 
      refreshInvoiceCount={refreshInvoiceCount}
      refreshStats={refreshStats}
      refreshInvoices={() => {}}
    >
      <AppWithRefresh apiStatus={apiStatus} savedInvoiceCount={savedInvoiceCount} />
    </InvoiceProvider>
  );
};

export const AppRouter: React.FC = () => {
  const { apiStatus, savedInvoiceCount, refreshInvoiceCount } = useApiStatus();
  const { refreshStats } = useInvoiceStats();

  return (
    <ErrorBoundary>
      <AppWithProvider 
        apiStatus={apiStatus} 
        savedInvoiceCount={savedInvoiceCount} 
        refreshStats={refreshStats}
        refreshInvoiceCount={refreshInvoiceCount}
      />
    </ErrorBoundary>
  );
};
