/**
 * Client Entry Point
 * 
 * Main entry point for the React client application:
 * - React application initialization
 * - DOM rendering
 * - Error boundary setup
 * - Progressive enhancement support
 * - Service worker registration
 * 
 * Maps to TASK-015: UI-API Connection Implementation
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, Progressive Enhancement Gate
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../components/App';
import '../styles/tailwind.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h1>
          <p className="text-red-600 mb-4">We're sorry, but something unexpected happened. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 rounded-lg p-3 text-left mt-4">
              <summary className="cursor-pointer font-medium text-gray-800 mb-2">Error Details (Development)</summary>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre>{this.state.error?.stack}</pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Progressive enhancement check
function isJavaScriptEnabled() {
  return typeof window !== 'undefined' && typeof React !== 'undefined';
}

// Initialize the application
function initializeApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Check if React is available
  if (!isJavaScriptEnabled()) {
    // Show fallback content for users without JavaScript
    rootElement.innerHTML = `
      <div class="no-javascript">
        <h1>Appointment Scheduler</h1>
        <p>This application requires JavaScript to function properly.</p>
        <p>Please enable JavaScript in your browser and refresh the page.</p>
        <a href="/" class="refresh-link">Refresh Page</a>
      </div>
    `;
    return;
  }

  try {
    // Create React root
    const root = ReactDOM.createRoot(rootElement);
    
    // Render the application
    root.render(
      React.createElement(ErrorBoundary, null,
        React.createElement(App)
      )
    );
    
  } catch (error) {
    console.error('❌ Failed to initialize React app:', error);
    
    // Show error message
    rootElement.innerHTML = `
      <div class="initialization-error">
        <h1>Failed to Load Application</h1>
        <p>There was an error initializing the application. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" class="retry-button">
          Refresh Page
        </button>
      </div>
    `;
  }
}


// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}


// Export for testing
export { initializeApp, ErrorBoundary };
