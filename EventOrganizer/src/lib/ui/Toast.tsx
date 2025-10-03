'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, Info, AlertCircle, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
  info: (title: string, message?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration })
  }, [addToast])

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration })
  }, [addToast])

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration })
  }, [addToast])

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-500',
          iconBg: 'bg-green-100',
          Icon: CheckCircle
        }
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          iconBg: 'bg-red-100',
          Icon: AlertCircle
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-500',
          iconBg: 'bg-yellow-100',
          Icon: AlertTriangle
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          iconBg: 'bg-blue-100',
          Icon: Info
        }
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-500',
          iconBg: 'bg-gray-100',
          Icon: Info
        }
    }
  }

  const styles = getToastStyles()
  const { Icon } = styles

  return (
    <div
      className={`
        relative flex items-start p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 ease-in-out
        hover:shadow-xl hover:scale-[1.02]
        animate-in slide-in-from-right-full
        ${styles.container}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}>
        <Icon className={`w-5 h-5 ${styles.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold leading-5">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-1 text-sm opacity-90 leading-5">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onRemove(toast.id)}
        className={`
          flex-shrink-0 ml-3 p-1 rounded-full
          hover:bg-black hover:bg-opacity-10
          transition-colors duration-200
          ${styles.icon}
        `}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-current opacity-30 animate-progress"
          style={{
            animation: `progress ${toast.duration || 5000}ms linear forwards`
          }}
        />
      </div>
    </div>
  )
}

// Add the progress animation to global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
    
    .animate-progress {
      animation-fill-mode: forwards;
    }
  `
  document.head.appendChild(style)
}
