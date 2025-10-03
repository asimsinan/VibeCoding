import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

// Toast context
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast reducer
type ToastAction = 
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' }

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload]
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload)
    case 'CLEAR_ALL_TOASTS':
      return []
    default:
      return state
  }
}

// Toast provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast
    }

    dispatch({ type: 'ADD_TOAST', payload: newToast })

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id })
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }, [])

  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' })
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Toast hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast container component
function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

// Individual toast component
interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { type, title, message, action } = toast

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconStyles = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconStyles[type]}`}>
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">{title}</h4>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className="text-sm font-medium underline hover:no-underline"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Convenience functions for different toast types
export function useToastHelpers() {
  const { addToast } = useToast()

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'success', title, message, ...options })
  }, [addToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'error', title, message, duration: 0, ...options }) // Don't auto-dismiss errors
  }, [addToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'warning', title, message, ...options })
  }, [addToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ type: 'info', title, message, ...options })
  }, [addToast])

  return { success, error, warning, info }
}

// Error message component
interface ErrorMessageProps {
  error: string | Error | null
  className?: string
  onRetry?: () => void
  retryText?: string
  showIcon?: boolean
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  className = '', 
  onRetry,
  retryText = 'Try Again',
  showIcon = true
}) => {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
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

// Success message component
interface SuccessMessageProps {
  message: string
  className?: string
  showIcon?: boolean
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  className = '',
  showIcon = true
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Warning message component
interface WarningMessageProps {
  message: string
  className?: string
  showIcon?: boolean
}

export const WarningMessage: React.FC<WarningMessageProps> = ({ 
  message, 
  className = '',
  showIcon = true
}) => {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-yellow-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Info message component
interface InfoMessageProps {
  message: string
  className?: string
  showIcon?: boolean
}

export const InfoMessage: React.FC<InfoMessageProps> = ({ 
  message, 
  className = '',
  showIcon = true
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Retry button component
interface RetryButtonProps {
  onRetry: () => void
  loading?: boolean
  className?: string
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
}

export const RetryButton: React.FC<RetryButtonProps> = ({ 
  onRetry, 
  loading = false,
  className = '',
  children = 'Retry',
  variant = 'primary'
}) => {
  const baseClasses = 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'text-blue-600 bg-white border-blue-600 hover:bg-blue-50 focus:ring-blue-500'
  }

  return (
    <button
      onClick={onRetry}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Retrying...
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Offline indicator component
export const OfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
        <span className="text-sm text-yellow-700">You're offline. Some features may not be available.</span>
      </div>
    </div>
  )
}

