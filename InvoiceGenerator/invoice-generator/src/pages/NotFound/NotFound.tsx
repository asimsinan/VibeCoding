import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__icon">🔍</div>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn--primary">
            🏠 Go Home
          </Link>
          <Link to="/invoices" className="btn btn--secondary">
            📋 View Invoices
          </Link>
        </div>
      </div>
    </div>
  );
};
