import React, { Component, ReactNode, ErrorInfo } from 'react'

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  )
}

// Skeleton Loader Components
interface SkeletonProps {
  className?: string
  height?: string
  width?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full' 
}) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${height} ${width} ${className}`} />
  )
}

export const EventCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <Skeleton height="h-6" width="w-3/4" />
    <Skeleton height="h-4" width="w-full" />
    <Skeleton height="h-4" width="w-2/3" />
    <div className="flex space-x-2">
      <Skeleton height="h-8" width="w-20" />
      <Skeleton height="h-8" width="w-20" />
    </div>
  </div>
)

export const SessionCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
    <Skeleton height="h-5" width="w-1/2" />
    <Skeleton height="h-4" width="w-full" />
    <Skeleton height="h-4" width="w-3/4" />
    <div className="flex justify-between items-center">
      <Skeleton height="h-6" width="w-24" />
      <Skeleton height="h-8" width="w-16" />
    </div>
  </div>
)

export const AttendeeCardSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
    <Skeleton height="h-10" width="w-10" className="rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton height="h-4" width="w-1/2" />
      <Skeleton height="h-3" width="w-1/3" />
    </div>
    <Skeleton height="h-8" width="w-20" />
  </div>
)

export const NotificationSkeleton: React.FC = () => (
  <div className="p-4 border-b border-gray-200 space-y-2">
    <div className="flex items-start space-x-3">
      <Skeleton height="h-8" width="w-8" className="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="h-4" width="w-3/4" />
        <Skeleton height="h-3" width="w-1/2" />
      </div>
    </div>
  </div>
)

// Progress Bar Component
interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  showPercentage = false,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

// Loading State Component
interface LoadingStateProps {
  loading: boolean
  children: ReactNode
  skeleton?: ReactNode
  spinner?: boolean
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  loading, 
  children, 
  skeleton,
  spinner = false,
  message = 'Loading...'
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        {spinner && <Spinner size="lg" />}
        {skeleton}
        <p className="text-gray-600">{message}</p>
      </div>
    )
  }

  return <>{children}</>
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to monitoring service
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-sm text-gray-500">We're sorry, but something unexpected happened.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error Message Component
interface ErrorMessageProps {
  error: string | Error | null
  className?: string
  onRetry?: () => void
  retryText?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  className = '', 
  onRetry,
  retryText = 'Try Again'
}) => {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

// Retry Button Component
interface RetryButtonProps {
  onRetry: () => void
  loading?: boolean
  className?: string
  children?: ReactNode
}

export const RetryButton: React.FC<RetryButtonProps> = ({ 
  onRetry, 
  loading = false,
  className = '',
  children = 'Retry'
}) => {
  return (
    <button
      onClick={onRetry}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          Retrying...
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Optimistic Update Indicator
interface OptimisticUpdateProps {
  isUpdating: boolean
  children: ReactNode
  className?: string
}

export const OptimisticUpdate: React.FC<OptimisticUpdateProps> = ({ 
  isUpdating, 
  children, 
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  )
}
