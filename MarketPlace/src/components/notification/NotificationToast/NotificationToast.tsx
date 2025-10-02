'use client';

// NotificationToast component
// Notification toast component for displaying temporary notifications

import React, { useEffect } from 'react';

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
  };
  onClose: () => void;
  duration?: number;
  className?: string;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  duration = 5000,
  className = '',
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase_confirmation':
        return '🛒';
      case 'sale_confirmation':
        return '💰';
      case 'product_sold':
        return '📦';
      case 'order_shipped':
        return '🚚';
      case 'order_delivered':
        return '✅';
      case 'payment_received':
        return '💳';
      case 'listing_updated':
        return '📝';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase_confirmation':
        return 'bg-green-500';
      case 'sale_confirmation':
        return 'bg-green-500';
      case 'product_sold':
        return 'bg-blue-500';
      case 'order_shipped':
        return 'bg-blue-500';
      case 'order_delivered':
        return 'bg-green-500';
      case 'payment_received':
        return 'bg-green-500';
      case 'listing_updated':
        return 'bg-blue-500';
      case 'system_alert':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center text-white text-sm font-medium`}>
            {getTypeIcon(notification.type)}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
