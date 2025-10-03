import { z } from 'zod'

/**
 * Notification Model - Real-time communication entity
 * Traces to FR-007: Real-time notifications for schedule changes and announcements
 */

// Notification type enum
export const NotificationType = z.enum([
  'event_update',
  'session_reminder',
  'networking_request',
  'announcement',
  'system',
  'registration_confirmation',
  'event_starting',
  'session_starting',
  'connection_accepted',
  'message_received',
  'feedback_request',
  'event_ended'
])
export type NotificationType = z.infer<typeof NotificationType>

// Notification status enum
export const NotificationStatus = z.enum(['pending', 'sent', 'delivered', 'failed', 'read'])
export type NotificationStatus = z.infer<typeof NotificationStatus>

// Delivery method enum
export const DeliveryMethod = z.enum(['push', 'email', 'sms', 'in_app'])
export type DeliveryMethod = z.infer<typeof DeliveryMethod>

// Notification priority enum
export const NotificationPriority = z.enum(['low', 'normal', 'high', 'urgent'])
export type NotificationPriority = z.infer<typeof NotificationPriority>

// Notification metadata schema
export const NotificationMetadataSchema = z.object({
  eventId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  actionUrl: z.string().url().optional(),
  actionText: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
  soundEnabled: z.boolean().default(true),
  vibrationEnabled: z.boolean().default(true),
  customFields: z.record(z.string(), z.any()).default({})
})

export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>

// Base Notification schema
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
  senderId: z.string().uuid().optional(),
  type: NotificationType,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  status: NotificationStatus.default('pending'),
  priority: NotificationPriority.default('normal'),
  deliveryMethod: DeliveryMethod.default('push'),
  scheduledFor: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: NotificationMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type Notification = z.infer<typeof NotificationSchema>

// Create Notification schema
export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  status: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  recipientIds: z.array(z.string().uuid()).optional(), // For bulk notifications
  delay: z.number().int().min(0).optional() // Delay in seconds
})

export type CreateNotificationRequest = z.infer<typeof CreateNotificationSchema>

// Update Notification schema
export const UpdateNotificationSchema = NotificationSchema.partial().omit({
  id: true,
  recipientId: true,
  senderId: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateNotificationRequest = z.infer<typeof UpdateNotificationSchema>

// Notification list query schema
export const NotificationListQuerySchema = z.object({
  recipientId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  type: NotificationType.optional(),
  status: NotificationStatus.optional(),
  priority: NotificationPriority.optional(),
  deliveryMethod: DeliveryMethod.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  unreadOnly: z.boolean().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'scheduledFor', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>

// Bulk notification schema
export const BulkNotificationSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1).max(1000),
  type: NotificationType,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  priority: NotificationPriority.default('normal'),
  deliveryMethod: DeliveryMethod.default('push'),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: NotificationMetadataSchema.default({})
})

export type BulkNotificationRequest = z.infer<typeof BulkNotificationSchema>

// Notification template schema
export const NotificationTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: NotificationType,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  priority: NotificationPriority.default('normal'),
  deliveryMethod: DeliveryMethod.default('push'),
  metadata: NotificationMetadataSchema.default({}),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>

// Notification validation methods
export class NotificationValidator {
  /**
   * Validate notification title
   */
  static validateTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Notification title is required' }
    }
    if (title.length > 255) {
      return { isValid: false, error: 'Notification title cannot exceed 255 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate notification message
   */
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Notification message is required' }
    }
    if (message.length > 1000) {
      return { isValid: false, error: 'Notification message cannot exceed 1000 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate notification scheduling
   */
  static validateScheduling(scheduledFor: string): { isValid: boolean; error?: string } {
    const scheduledDate = new Date(scheduledFor)
    const now = new Date()

    if (scheduledDate <= now) {
      return { isValid: false, error: 'Scheduled time must be in the future' }
    }

    // Check if scheduled time is not too far in the future (1 year)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (scheduledDate > oneYearFromNow) {
      return { isValid: false, error: 'Scheduled time cannot be more than 1 year in the future' }
    }

    return { isValid: true }
  }

  /**
   * Validate notification expiration
   */
  static validateExpiration(expiresAt: string, createdAt: string): { isValid: boolean; error?: string } {
    const expirationDate = new Date(expiresAt)
    const createdDate = new Date(createdAt)

    if (expirationDate <= createdDate) {
      return { isValid: false, error: 'Expiration time must be after creation time' }
    }

    return { isValid: true }
  }

  /**
   * Validate recipient list
   */
  static validateRecipients(recipientIds: string[]): { isValid: boolean; error?: string } {
    if (!recipientIds || recipientIds.length === 0) {
      return { isValid: false, error: 'At least one recipient is required' }
    }
    if (recipientIds.length > 1000) {
      return { isValid: false, error: 'Cannot send to more than 1000 recipients at once' }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    for (const id of recipientIds) {
      if (!uuidRegex.test(id)) {
        return { isValid: false, error: 'Invalid recipient ID format' }
      }
    }

    return { isValid: true }
  }

  /**
   * Sanitize notification content
   */
  static sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
  }
}

// Notification business logic methods
export class NotificationService {
  /**
   * Check if notification is pending
   */
  static isPending(notification: Notification): boolean {
    return notification.status === 'pending'
  }

  /**
   * Check if notification is sent
   */
  static isSent(notification: Notification): boolean {
    return notification.status === 'sent' || notification.status === 'delivered'
  }

  /**
   * Check if notification is delivered
   */
  static isDelivered(notification: Notification): boolean {
    return notification.status === 'delivered'
  }

  /**
   * Check if notification is read
   */
  static isRead(notification: Notification): boolean {
    return notification.status === 'read'
  }

  /**
   * Check if notification is failed
   */
  static isFailed(notification: Notification): boolean {
    return notification.status === 'failed'
  }

  /**
   * Check if notification is expired
   */
  static isExpired(notification: Notification): boolean {
    if (!notification.expiresAt) return false
    const now = new Date()
    const expirationDate = new Date(notification.expiresAt)
    return now > expirationDate
  }

  /**
   * Check if notification should be sent now
   */
  static shouldSendNow(notification: Notification): boolean {
    if (!this.isPending(notification)) return false
    if (this.isExpired(notification)) return false
    
    if (notification.scheduledFor) {
      const now = new Date()
      const scheduledDate = new Date(notification.scheduledFor)
      return now >= scheduledDate
    }
    
    return true
  }

  /**
   * Get notification age in minutes
   */
  static getAgeMinutes(notification: Notification): number {
    const now = new Date()
    const createdAt = new Date(notification.createdAt)
    return (now.getTime() - createdAt.getTime()) / (1000 * 60)
  }

  /**
   * Check if notification is urgent
   */
  static isUrgent(notification: Notification): boolean {
    return notification.priority === 'urgent' || notification.priority === 'high'
  }

  /**
   * Get notification delivery status
   */
  static getDeliveryStatus(notification: Notification): string {
    if (this.isRead(notification)) return 'read'
    if (this.isDelivered(notification)) return 'delivered'
    if (this.isSent(notification)) return 'sent'
    if (this.isFailed(notification)) return 'failed'
    if (this.isExpired(notification)) return 'expired'
    return 'pending'
  }

  /**
   * Check if notification can be retried
   */
  static canRetry(notification: Notification): boolean {
    if (!this.isFailed(notification)) return false
    if (this.isExpired(notification)) return false
    
    // Don't retry if it's been more than 24 hours
    const ageHours = this.getAgeMinutes(notification) / 60
    return ageHours < 24
  }

  /**
   * Get notification priority score
   */
  static getPriorityScore(notification: Notification): number {
    switch (notification.priority) {
      case 'urgent': return 4
      case 'high': return 3
      case 'normal': return 2
      case 'low': return 1
      default: return 2
    }
  }

  /**
   * Check if notification is for event
   */
  static isEventNotification(notification: Notification): boolean {
    return ['event_update', 'event_starting', 'event_ended', 'registration_confirmation'].includes(notification.type)
  }

  /**
   * Check if notification is for session
   */
  static isSessionNotification(notification: Notification): boolean {
    return ['session_reminder', 'session_starting'].includes(notification.type)
  }

  /**
   * Check if notification is for networking
   */
  static isNetworkingNotification(notification: Notification): boolean {
    return ['networking_request', 'connection_accepted', 'message_received'].includes(notification.type)
  }

  /**
   * Get notification action URL
   */
  static getActionUrl(notification: Notification): string | null {
    return notification.metadata.actionUrl || null
  }

  /**
   * Get notification action text
   */
  static getActionText(notification: Notification): string | null {
    return notification.metadata.actionText || null
  }
}

