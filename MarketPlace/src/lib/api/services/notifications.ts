// Notifications API Service
// API service for notification-related endpoints

import { apiClient } from '../client';
import {
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  PaginationParams,
  PaginationResponse,
} from '../types';

export class NotificationsService {
  // Get all notifications for current user
  async getNotifications(pagination?: PaginationParams): Promise<{
    notifications: Notification[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/notifications?${queryParams.toString()}`
      : '/notifications';
    
    const response = await apiClient.get<{
      notifications: Notification[];
      pagination: PaginationResponse;
    }>(endpoint);
    return response.data;
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    const response = await apiClient.get<Notification>(`/notifications/${id}`);
    return response.data;
  }

  // Create notification
  async createNotification(notificationData: CreateNotificationRequest): Promise<Notification> {
    const response = await apiClient.post<Notification>('/notifications', notificationData);
    return response.data;
  }

  // Update notification
  async updateNotification(id: string, notificationData: UpdateNotificationRequest): Promise<Notification> {
    const response = await apiClient.put<Notification>(`/notifications/${id}`, notificationData);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  }

  // Mark notification as unread
  async markAsUnread(id: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/unread`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<void> {
    await apiClient.delete('/notifications');
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  }

  // Get notifications by type
  async getNotificationsByType(type: string, pagination?: PaginationParams): Promise<{
    notifications: Notification[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const response = await apiClient.get<{
      notifications: Notification[];
      pagination: PaginationResponse;
    }>(`/notifications/type?${queryParams.toString()}`);
    return response.data;
  }

  // Get recent notifications
  async getRecentNotifications(limit?: number): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/notifications/recent?${queryParams.toString()}`
      : '/notifications/recent';
    
    const response = await apiClient.get<Notification[]>(endpoint);
    return response.data;
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
    transactionNotifications: boolean;
    productNotifications: boolean;
    orderNotifications: boolean;
    systemNotifications: boolean;
  }> {
    const response = await apiClient.get<{
      email: boolean;
      push: boolean;
      sms: boolean;
      transactionNotifications: boolean;
      productNotifications: boolean;
      orderNotifications: boolean;
      systemNotifications: boolean;
    }>('/notifications/preferences');
    return response.data;
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    transactionNotifications?: boolean;
    productNotifications?: boolean;
    orderNotifications?: boolean;
    systemNotifications?: boolean;
  }): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
    transactionNotifications: boolean;
    productNotifications: boolean;
    orderNotifications: boolean;
    systemNotifications: boolean;
  }> {
    const response = await apiClient.put<{
      email: boolean;
      push: boolean;
      sms: boolean;
      transactionNotifications: boolean;
      productNotifications: boolean;
      orderNotifications: boolean;
      systemNotifications: boolean;
    }>('/notifications/preferences', preferences);
    return response.data;
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }): Promise<void> {
    await apiClient.post('/notifications/push/subscribe', subscription);
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<void> {
    await apiClient.delete('/notifications/push/subscribe');
  }

  // Get notification statistics
  async getNotificationStatistics(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    readNotifications: number;
    notificationsByType: Array<{ type: string; count: number }>;
    notificationsOverTime: Array<{ date: string; count: number }>;
  }> {
    const response = await apiClient.get<{
      totalNotifications: number;
      unreadNotifications: number;
      readNotifications: number;
      notificationsByType: Array<{ type: string; count: number }>;
      notificationsOverTime: Array<{ date: string; count: number }>;
    }>('/notifications/statistics');
    return response.data;
  }
}

// Create default instance
export const notificationsService = new NotificationsService();
