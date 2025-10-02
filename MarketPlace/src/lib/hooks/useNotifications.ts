// Notifications Hook
// React hook for notification data fetching and management

import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../api/services/notifications';
import { Notification, CreateNotificationRequest, UpdateNotificationRequest } from '../api/types';

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

interface NotificationsActions {
  fetchNotifications: (pagination?: { page?: number; limit?: number }) => Promise<void>;
  fetchNotification: (id: string) => Promise<Notification | null>;
  createNotification: (notificationData: CreateNotificationRequest) => Promise<Notification | null>;
  updateNotification: (id: string, notificationData: UpdateNotificationRequest) => Promise<Notification | null>;
  markAsRead: (id: string) => Promise<Notification | null>;
  markAsUnread: (id: string) => Promise<Notification | null>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  clearError: () => void;
  clearNotifications: () => void;
}

export function useNotifications(): NotificationsState & NotificationsActions {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    isLoading: false,
    error: null,
    unreadCount: 0,
    pagination: null,
  });

  const fetchNotifications = useCallback(async (pagination?: { page?: number; limit?: number }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await notificationsService.getNotifications(pagination);
      setState(prev => ({
        ...prev,
        notifications: response.notifications,
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false,
      }));
    }
  }, []);

  const fetchNotification = useCallback(async (id: string): Promise<Notification | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const notification = await notificationsService.getNotificationById(id);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch notification',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const createNotification = useCallback(async (notificationData: CreateNotificationRequest): Promise<Notification | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const notification = await notificationsService.createNotification(notificationData);
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications],
        isLoading: false,
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create notification',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const updateNotification = useCallback(async (id: string, notificationData: UpdateNotificationRequest): Promise<Notification | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const notification = await notificationsService.updateNotification(id, notificationData);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? notification : n),
        isLoading: false,
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update notification',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<Notification | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const notification = await notificationsService.markAsRead(id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? notification : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        isLoading: false,
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const markAsUnread = useCallback(async (id: string): Promise<Notification | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const notification = await notificationsService.markAsUnread(id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? notification : n),
        unreadCount: prev.unreadCount + 1,
        isLoading: false,
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark notification as unread',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await notificationsService.markAllAsRead();
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        isLoading: false,
      }));
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await notificationsService.deleteNotification(id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete notification',
        isLoading: false,
      }));
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await notificationsService.deleteAllNotifications();
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
        pagination: null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete all notifications',
        isLoading: false,
      }));
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsService.getUnreadCount();
      setState(prev => ({
        ...prev,
        unreadCount: response.count,
      }));
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      pagination: null,
    }));
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    ...state,
    fetchNotifications,
    fetchNotification,
    createNotification,
    updateNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchUnreadCount,
    clearError,
    clearNotifications,
  };
}

// Hook for single notification
export function useNotification(id: string) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotification = useCallback(async () => {
    if (!id) {return;}
    
    setIsLoading(true);
    setError(null);
    
    try {
      const notificationData = await notificationsService.getNotificationById(id);
      setNotification(notificationData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch notification');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  return {
    notification,
    isLoading,
    error,
    refetch: fetchNotification,
  };
}
