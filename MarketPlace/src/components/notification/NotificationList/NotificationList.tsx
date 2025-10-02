// NotificationList component
// Notification list component for displaying multiple notifications

import React from 'react';
import { NotificationCard } from '../NotificationCard/NotificationCard';
import { Spinner } from '../../ui/Spinner/Spinner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteAll?: () => void;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  onDeleteAll,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg mb-4">No notifications</div>
        <p className="text-gray-400">You&apos;re all caught up!</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {unreadCount} unread
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
          {onDeleteAll && (
            <button
              onClick={onDeleteAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete all
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            {...(onMarkAsRead && { onMarkAsRead })}
            {...(onDelete && { onDelete })}
          />
        ))}
      </div>
    </div>
  );
};
