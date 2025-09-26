/**
 * Error Boundary Component
 * 
 * Error boundary implementation for React components:
 * - Client-side error handling
 * - Error recovery mechanisms
 * - User-friendly error messages
 * - Error reporting and logging
 * - Fallback UI components
 * - Accessibility support
 * 
 * Maps to TASK-016: API Data Flow Integration
 * TDD Phase: Implementation
 * Constitutional Compliance: Performance Gate, Security Gate
 */

const React = require('react');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  /**
   * Report error to monitoring service
   */
  reportError(error, errorInfo) {
    // In a real application, you would send this to your error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };

    // Send to monitoring service
    this.sendErrorReport(errorReport);
  }

  /**
   * Send error report to monitoring service
   */
  sendErrorReport(errorReport) {
    // In a real application, you would send this to your monitoring service
    try {
      fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      }).catch(err => {
        console.error('Failed to send error report:', err);
      });
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }

  /**
   * Get user ID for error reporting
   */
  getUserId() {
    // In a real application, you would get this from your auth context
    return localStorage.getItem('userId') || 'anonymous';
  }

  /**
   * Get session ID for error reporting
   */
  getSessionId() {
    // In a real application, you would get this from your session management
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  /**
   * Handle retry button click
   */
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  /**
   * Handle refresh button click
   */
  handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Handle go back button click
   */
  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert" aria-live="assertive">
          <div className="space-y-4">
            <div className="text-red-600 text-4xl" aria-hidden="true">
              ⚠️
            </div>
            
            <h1 className="text-xl font-semibold text-red-800">Something went wrong</h1>
            
            <p className="text-red-600">
              We're sorry, but something unexpected happened. This error has been reported 
              and we're working to fix it.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="btn-primary"
                onClick={this.handleRetry}
                aria-label="Try again"
              >
                Try Again
              </button>
              
              <button
                className="btn-secondary"
                onClick={this.handleRefresh}
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
              
              <button
                className="btn-secondary"
                onClick={this.handleGoBack}
                aria-label="Go back"
              >
                Go Back
              </button>
            </div>

            {this.state.retryCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3" role="status" aria-live="polite">
                <p className="text-sm text-yellow-800">Retry attempt: {this.state.retryCount}</p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="bg-gray-100 rounded-lg p-3 text-left">
                <summary className="cursor-pointer font-medium text-gray-800 mb-2">Error Details (Development Only)</summary>
                <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                  <h3 className="text-white mb-2">Error:</h3>
                  <pre>{this.state.error?.stack}</pre>
                  
                  <h3 className="text-white mb-2 mt-4">Component Stack:</h3>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-600 mb-2">If this problem persists, please contact support:</p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>Email: support@appointmentscheduler.com</li>
                <li>Phone: 1-800-APPOINT</li>
                <li>Live Chat: Available 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for error boundaries
 */
function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for error boundary context
 */
function useErrorBoundary() {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

/**
 * Error fallback component for specific error types
 */
function ErrorFallback({ error, resetError }) {
  if (error.name === 'ChunkLoadError') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center" role="alert">
        <h1 className="text-xl font-semibold text-blue-800 mb-2">Update Available</h1>
        <p className="text-blue-600 mb-4">A new version of the application is available. Please refresh to get the latest features.</p>
        <button onClick={resetError} className="btn-primary">
          Refresh Page
        </button>
      </div>
    );
  }

  if (error.name === 'NetworkError') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center" role="alert">
        <h1 className="text-xl font-semibold text-yellow-800 mb-2">Connection Problem</h1>
        <p className="text-yellow-600 mb-4">There seems to be a problem with your internet connection. Please check your network and try again.</p>
        <button onClick={resetError} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
      <h1 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h1>
      <p className="text-red-600 mb-4">An unexpected error occurred. Please try again.</p>
      <button onClick={resetError} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}

module.exports = {
  ErrorBoundary,
  withErrorBoundary,
  useErrorBoundary,
  ErrorFallback
};
