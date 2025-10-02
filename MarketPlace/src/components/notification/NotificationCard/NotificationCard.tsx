// NotificationCard component
// Notification card component for displaying notification information

import React from 'react';
import { Badge } from '../../ui/Badge/Badge';

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
  };
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const getTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase_confirmation':
        return 'success';
      case 'sale_confirmation':
        return 'success';
      case 'product_sold':
        return 'info';
      case 'order_shipped':
        return 'info';
      case 'order_delivered':
        return 'success';
      case 'payment_received':
        return 'success';
      case 'listing_updated':
        return 'info';
      case 'system_alert':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200 ${
      !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
    } ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-lg">{getTypeIcon(notification.type)}</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={getTypeVariant(notification.type)}>
                  {notification.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead?.(notification.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Mark as read
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(notification.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
