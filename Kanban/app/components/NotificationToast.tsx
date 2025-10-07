// Enhanced notification toast with modern styling and animations
import React, { useEffect, useState } from 'react';

// Define notification types
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close after duration
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          border: 'border-green-200',
          shadow: 'shadow-green-500/25'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          border: 'border-red-200',
          shadow: 'shadow-red-500/25'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          border: 'border-yellow-200',
          shadow: 'shadow-yellow-500/25'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          border: 'border-blue-200',
          shadow: 'shadow-blue-500/25'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : isExiting
          ? 'translate-x-full opacity-0 scale-95'
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`
        relative bg-white rounded-2xl shadow-2xl border-2 ${typeStyles.border} 
        backdrop-blur-sm bg-white/95 overflow-hidden
        min-w-[320px] max-w-[400px]
        ${typeStyles.shadow}
      `}>
        {/* Background decoration */}
        <div className={`absolute top-0 right-0 w-20 h-20 ${typeStyles.bg} rounded-full -translate-y-10 translate-x-10 opacity-20`}></div>
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={`h-full ${typeStyles.bg} transition-all ease-linear`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          ></div>
        </div>

        <div className="relative p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-12 h-12 ${typeStyles.bg} rounded-2xl 
              flex items-center justify-center shadow-lg
              transform transition-transform duration-200 hover:scale-110
            `}>
              {typeStyles.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    {type === 'success' && 'Success!'}
                    {type === 'error' && 'Error!'}
                    {type === 'warning' && 'Warning!'}
                    {type === 'info' && 'Information'}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"></div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
