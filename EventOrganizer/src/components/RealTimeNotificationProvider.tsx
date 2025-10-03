'use client'

import React, { useState, useEffect } from 'react'
// import { useRealTime } from '@/lib/hooks/useRealTime';
import { useNotificationStore, useRealTimeStore } from '@/lib/stores';

interface NotificationToastProps {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  onClose: (id: string) => void
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title,
  message,
  type,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✕'
      default:
        return 'ℹ'
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${getTypeStyles()}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{getIcon()}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export const RealTimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifications, markAsRead } = useNotificationStore()
  const [toasts, setToasts] = useState<Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }>>([])

  // Convert notifications to toasts
  useEffect(() => {
    const newToasts = notifications
      .filter(notification => notification.status !== 'read')
      .map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: getNotificationType(notification.type)
      }))

    setToasts(newToasts)
  }, [notifications])

  const getNotificationType = (type: string): 'info' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'event_starting':
      case 'session_starting':
        return 'warning'
      case 'connection_accepted':
      case 'registration_confirmation':
        return 'success'
      case 'event_ended':
      case 'session_reminder':
        return 'info'
      default:
        return 'info'
    }
  }

  const handleToastClose = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    markAsRead(id)
  }

  return (
    <>
      {children}
      {toasts.map(toast => (
        <NotificationToast
          key={toast.id}
          {...toast}
          onClose={handleToastClose}
        />
      ))}
    </>
  )
}

// Real-time connection status indicator
export const ConnectionStatusIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test Supabase connection to determine real status
    const testConnection = async () => {
      try {
        setConnectionStatus('connecting')
        const { supabase } = await import('@/lib/supabase')
        
        // Test basic Supabase connection
        const { data, error } = await supabase.from('events').select('id').limit(1)
        
        if (error) {
          setConnectionStatus('error')
          setError(error.message)
          setIsConnected(false)
        } else {
          setConnectionStatus('connected')
          setError(null)
          setIsConnected(true)
        }
      } catch (err) {
        setConnectionStatus('error')
        setError('Failed to connect to Supabase')
        setIsConnected(false)
      }
    }

    testConnection()
    
    // Test connection every 30 seconds
    const interval = setInterval(testConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500'
    if (connectionStatus === 'error') return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getStatusText = () => {
    if (isConnected) return 'Connected'
    if (connectionStatus === 'error') return 'Error'
    if (connectionStatus === 'disconnected') return 'Disconnected'
    return 'Connecting...'
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span>{getStatusText()}</span>
      {error && (
        <span className="text-red-500 text-xs">({error})</span>
      )}
    </div>
  )
}
