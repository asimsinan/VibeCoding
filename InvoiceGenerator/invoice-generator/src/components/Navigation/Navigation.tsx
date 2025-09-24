import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  apiStatus: 'connected' | 'disconnected' | 'checking';
  savedInvoiceCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  apiStatus, 
  savedInvoiceCount = 0 
}) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__brand">
          <Link to="/" className="navigation__logo">
            📄 Invoice Generator
          </Link>
        </div>

        <div className="navigation__menu">
          <Link 
            to="/" 
            className={`navigation__link ${isActive('/') ? 'navigation__link--active' : ''}`}
          >
            🏠 Dashboard
          </Link>
          
          <Link 
            to="/invoices" 
            className={`navigation__link ${isActive('/invoices') ? 'navigation__link--active' : ''}`}
          >
            📋 Invoices
            {savedInvoiceCount > 0 && (
              <span className="navigation__badge">{savedInvoiceCount}</span>
            )}
          </Link>
          
          <Link 
            to="/create" 
            className={`navigation__link ${isActive('/create') ? 'navigation__link--active' : ''}`}
          >
            ➕ Create
          </Link>
          
          <Link 
            to="/settings" 
            className={`navigation__link ${isActive('/settings') ? 'navigation__link--active' : ''}`}
          >
            ⚙️ Settings
          </Link>
        </div>

        <div className="navigation__status">
          <span className={`status-indicator ${apiStatus}`}>
            {apiStatus === 'connected' ? '🟢 API Connected' : 
             apiStatus === 'disconnected' ? '🔴 API Disconnected' : 
             '🟡 Checking API...'}
          </span>
        </div>
      </div>
    </nav>
  );
};
