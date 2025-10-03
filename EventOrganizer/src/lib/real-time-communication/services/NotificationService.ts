/**
 * Real-time Communication Service - Supabase Implementation
 * 
 * Provides comprehensive notification and real-time communication functionality using Supabase
 * 
 * @fileoverview Real-time Communication Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '../../supabase'
import { Notification, CreateNotificationRequest, NotificationType, NotificationPriority } from '../../models/Notification'

export class NotificationService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Send notification
   */
  async sendNotification(notificationData: CreateNotificationRequest): Promise<Notification> {
    try {
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipientId: notificationData.recipientId,
        senderId: notificationData.senderId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || 'normal',
        deliveryMethod: notificationData.deliveryMethod || 'push',
        status: 'pending',
        metadata: notificationData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // For demo purposes, just log the notification instead of inserting to database
      
      // In production, you would insert into the actual notifications table:
      // const { error } = await this.supabase
      //   .from('notifications')
      //   .insert({...})

      return notification
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToNotification(data)
    } catch (error) {
      throw new Error(`Failed to get notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, filters: {
    isRead?: boolean
    type?: NotificationType
    priority?: NotificationPriority
    page?: number
    limit?: number
  } = {}): Promise<{
    data: Notification[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        isRead,
        type,
        priority,
        page = 1,
        limit = 20
      } = filters

      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      if (isRead !== undefined) {
        query = query.eq('is_read', isRead)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (priority) {
        query = query.eq('priority', priority)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by sent_at desc
      query = query.order('sent_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const notifications = data.map((row: any) => this.mapRowToNotification(row))

      return {
        data: notifications,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToNotification(data)
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      throw new Error(`Failed to get unread notification count: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: CreateNotificationRequest[]): Promise<Notification[]> {
    try {
      const notificationObjects = notifications.map(notificationData => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient_id: notificationData.recipientId,
        sender_id: notificationData.senderId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || 'normal',
        delivery_method: notificationData.deliveryMethod || 'push',
        status: 'pending',
        metadata: notificationData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notificationObjects as any)
        .select()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map((row: any) => this.mapRowToNotification(row))
    } catch (error) {
      throw new Error(`Failed to send bulk notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database row to Notification object
   */
  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      senderId: row.sender_id,
      title: row.title,
      message: row.message,
      type: row.type,
      priority: row.priority,
      deliveryMethod: row.delivery_method,
      status: row.status,
      scheduledFor: row.scheduled_for,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      expiresAt: row.expires_at,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export default NotificationService