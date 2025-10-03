import { z } from 'zod'

/**
 * Message Model - Communication entity
 * Traces to FR-006: Networking features for attendees to connect and chat
 */

// Message type enum
export const MessageType = z.enum(['text', 'image', 'file', 'link', 'system', 'event_invite', 'session_reminder'])
export type MessageType = z.infer<typeof MessageType>

// Message status enum
export const MessageStatus = z.enum(['sent', 'delivered', 'read', 'failed', 'deleted'])
export type MessageStatus = z.infer<typeof MessageStatus>

// Message priority enum
export const MessagePriority = z.enum(['low', 'normal', 'high', 'urgent'])
export type MessagePriority = z.infer<typeof MessagePriority>

// Message metadata schema
export const MessageMetadataSchema = z.object({
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().min(0).optional(),
  fileType: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageWidth: z.number().int().min(0).optional(),
  imageHeight: z.number().int().min(0).optional(),
  linkUrl: z.string().url().optional(),
  linkTitle: z.string().optional(),
  linkDescription: z.string().optional(),
  linkImage: z.string().url().optional(),
  eventId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  replyToMessageId: z.string().uuid().optional(),
  isEncrypted: z.boolean().default(false),
  encryptionKey: z.string().optional(),
  customFields: z.record(z.string(), z.any()).default({})
})

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>

// Base Message schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  type: MessageType.default('text'),
  content: z.string().min(1).max(2000),
  status: MessageStatus.default('sent'),
  priority: MessagePriority.default('normal'),
  metadata: MessageMetadataSchema.default({}),
  sentAt: z.string().datetime(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  editedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type Message = z.infer<typeof MessageSchema>

// Create Message schema
export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  status: true,
  deliveredAt: true,
  readAt: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  content: z.string().min(1).max(2000),
  replyToMessageId: z.string().uuid().optional()
})

export type CreateMessageRequest = z.infer<typeof CreateMessageSchema>

// Update Message schema
export const UpdateMessageSchema = MessageSchema.partial().omit({
  id: true,
  connectionId: true,
  senderId: true,
  receiverId: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateMessageRequest = z.infer<typeof UpdateMessageSchema>

// Message list query schema
export const MessageListQuerySchema = z.object({
  connectionId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  type: MessageType.optional(),
  status: MessageStatus.optional(),
  priority: MessagePriority.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  unreadOnly: z.boolean().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['sentAt', 'createdAt']).default('sentAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeDeleted: z.boolean().default(false)
})

export type MessageListQuery = z.infer<typeof MessageListQuerySchema>

// Message search schema
export const MessageSearchSchema = z.object({
  query: z.string().min(1).max(100),
  connectionId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  type: MessageType.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
})

export type MessageSearchRequest = z.infer<typeof MessageSearchSchema>

// Message validation methods
export class MessageValidator {
  /**
   * Validate message content
   */
  static validateContent(content: string, type: MessageType): { isValid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message content is required' }
    }
    if (content.length > 2000) {
      return { isValid: false, error: 'Message content cannot exceed 2000 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate message type
   */
  static validateType(type: MessageType): { isValid: boolean; error?: string } {
    const validTypes = ['text', 'image', 'file', 'link', 'system', 'event_invite', 'session_reminder']
    if (!validTypes.includes(type)) {
      return { isValid: false, error: 'Invalid message type' }
    }
    return { isValid: true }
  }

  /**
   * Validate file message
   */
  static validateFileMessage(metadata: MessageMetadata): { isValid: boolean; error?: string } {
    if (!metadata.fileUrl) {
      return { isValid: false, error: 'File URL is required for file messages' }
    }
    if (!metadata.fileName) {
      return { isValid: false, error: 'File name is required for file messages' }
    }
    if (!metadata.fileSize || metadata.fileSize <= 0) {
      return { isValid: false, error: 'File size must be greater than 0' }
    }
    if (!metadata.fileType) {
      return { isValid: false, error: 'File type is required for file messages' }
    }
    return { isValid: true }
  }

  /**
   * Validate image message
   */
  static validateImageMessage(metadata: MessageMetadata): { isValid: boolean; error?: string } {
    if (!metadata.imageUrl) {
      return { isValid: false, error: 'Image URL is required for image messages' }
    }
    if (!metadata.imageWidth || metadata.imageWidth <= 0) {
      return { isValid: false, error: 'Image width must be greater than 0' }
    }
    if (!metadata.imageHeight || metadata.imageHeight <= 0) {
      return { isValid: false, error: 'Image height must be greater than 0' }
    }
    return { isValid: true }
  }

  /**
   * Validate link message
   */
  static validateLinkMessage(metadata: MessageMetadata): { isValid: boolean; error?: string } {
    if (!metadata.linkUrl) {
      return { isValid: false, error: 'Link URL is required for link messages' }
    }
    return { isValid: true }
  }

  /**
   * Validate message metadata
   */
  static validateMetadata(metadata: MessageMetadata, type: MessageType): { isValid: boolean; error?: string } {
    switch (type) {
      case 'file':
        return this.validateFileMessage(metadata)
      case 'image':
        return this.validateImageMessage(metadata)
      case 'link':
        return this.validateLinkMessage(metadata)
      default:
        return { isValid: true }
    }
  }

  /**
   * Sanitize message content
   */
  static sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
  }

  /**
   * Validate file size
   */
  static validateFileSize(fileSize: number): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileSize > maxSize) {
      return { isValid: false, error: 'File size cannot exceed 10MB' }
    }
    return { isValid: true }
  }

  /**
   * Validate image dimensions
   */
  static validateImageDimensions(width: number, height: number): { isValid: boolean; error?: string } {
    const maxDimension = 4096
    if (width > maxDimension || height > maxDimension) {
      return { isValid: false, error: 'Image dimensions cannot exceed 4096px' }
    }
    return { isValid: true }
  }
}

// Message business logic methods
export class MessageService {
  /**
   * Check if message is sent
   */
  static isSent(message: Message): boolean {
    return message.status === 'sent'
  }

  /**
   * Check if message is delivered
   */
  static isDelivered(message: Message): boolean {
    return message.status === 'delivered'
  }

  /**
   * Check if message is read
   */
  static isRead(message: Message): boolean {
    return message.status === 'read'
  }

  /**
   * Check if message is failed
   */
  static isFailed(message: Message): boolean {
    return message.status === 'failed'
  }

  /**
   * Check if message is deleted
   */
  static isDeleted(message: Message): boolean {
    return message.status === 'deleted'
  }

  /**
   * Check if message is active
   */
  static isActive(message: Message): boolean {
    return !this.isDeleted(message)
  }

  /**
   * Check if message can be edited
   */
  static canEdit(message: Message): boolean {
    // Can edit within 24 hours of sending
    const sentAt = new Date(message.sentAt)
    const now = new Date()
    const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60)
    return hoursSinceSent < 24 && !this.isDeleted(message)
  }

  /**
   * Check if message can be deleted
   */
  static canDelete(message: Message): boolean {
    return !this.isDeleted(message)
  }

  /**
   * Check if message can be replied to
   */
  static canReply(message: Message): boolean {
    return this.isActive(message) && message.type !== 'system'
  }

  /**
   * Check if message is a reply
   */
  static isReply(message: Message): boolean {
    return !!message.metadata.replyToMessageId
  }

  /**
   * Check if message is a file
   */
  static isFile(message: Message): boolean {
    return message.type === 'file'
  }

  /**
   * Check if message is an image
   */
  static isImage(message: Message): boolean {
    return message.type === 'image'
  }

  /**
   * Check if message is a link
   */
  static isLink(message: Message): boolean {
    return message.type === 'link'
  }

  /**
   * Check if message is a system message
   */
  static isSystem(message: Message): boolean {
    return message.type === 'system'
  }

  /**
   * Check if message is an event invite
   */
  static isEventInvite(message: Message): boolean {
    return message.type === 'event_invite'
  }

  /**
   * Check if message is a session reminder
   */
  static isSessionReminder(message: Message): boolean {
    return message.type === 'session_reminder'
  }

  /**
   * Get message age in minutes
   */
  static getAgeMinutes(message: Message): number {
    const now = new Date()
    const sentAt = new Date(message.sentAt)
    return (now.getTime() - sentAt.getTime()) / (1000 * 60)
  }

  /**
   * Check if message is recent
   */
  static isRecent(message: Message): boolean {
    return this.getAgeMinutes(message) < 60 // Within last hour
  }

  /**
   * Check if message is urgent
   */
  static isUrgent(message: Message): boolean {
    return message.priority === 'urgent' || message.priority === 'high'
  }

  /**
   * Get message delivery status
   */
  static getDeliveryStatus(message: Message): string {
    if (this.isRead(message)) return 'read'
    if (this.isDelivered(message)) return 'delivered'
    if (this.isFailed(message)) return 'failed'
    if (this.isDeleted(message)) return 'deleted'
    return 'sent'
  }

  /**
   * Get message file info
   */
  static getFileInfo(message: Message): { fileName: string; fileSize: number; fileType: string } | null {
    if (!this.isFile(message)) return null
    return {
      fileName: message.metadata.fileName || 'Unknown',
      fileSize: message.metadata.fileSize || 0,
      fileType: message.metadata.fileType || 'Unknown'
    }
  }

  /**
   * Get message image info
   */
  static getImageInfo(message: Message): { imageUrl: string; width: number; height: number } | null {
    if (!this.isImage(message)) return null
    return {
      imageUrl: message.metadata.imageUrl || '',
      width: message.metadata.imageWidth || 0,
      height: message.metadata.imageHeight || 0
    }
  }

  /**
   * Get message link info
   */
  static getLinkInfo(message: Message): { linkUrl: string; title?: string; description?: string } | null {
    if (!this.isLink(message)) return null
    return {
      linkUrl: message.metadata.linkUrl || '',
      title: message.metadata.linkTitle,
      description: message.metadata.linkDescription
    }
  }

  /**
   * Get message reply info
   */
  static getReplyInfo(message: Message): { replyToMessageId: string } | null {
    if (!this.isReply(message)) return null
    return {
      replyToMessageId: message.metadata.replyToMessageId || ''
    }
  }

  /**
   * Check if message is encrypted
   */
  static isEncrypted(message: Message): boolean {
    return message.metadata.isEncrypted || false
  }

  /**
   * Get message priority score
   */
  static getPriorityScore(message: Message): number {
    switch (message.priority) {
      case 'urgent': return 4
      case 'high': return 3
      case 'normal': return 2
      case 'low': return 1
      default: return 2
    }
  }

  /**
   * Get message type display text
   */
  static getTypeDisplayText(message: Message): string {
    switch (message.type) {
      case 'text': return 'Text'
      case 'image': return 'Image'
      case 'file': return 'File'
      case 'link': return 'Link'
      case 'system': return 'System'
      case 'event_invite': return 'Event Invite'
      case 'session_reminder': return 'Session Reminder'
      default: return 'Unknown'
    }
  }

  /**
   * Get message status display text
   */
  static getStatusDisplayText(message: Message): string {
    switch (message.status) {
      case 'sent': return 'Sent'
      case 'delivered': return 'Delivered'
      case 'read': return 'Read'
      case 'failed': return 'Failed'
      case 'deleted': return 'Deleted'
      default: return 'Unknown'
    }
  }

  /**
   * Check if message has event context
   */
  static hasEventContext(message: Message): boolean {
    return !!message.metadata.eventId
  }

  /**
   * Check if message has session context
   */
  static hasSessionContext(message: Message): boolean {
    return !!message.metadata.sessionId
  }

  /**
   * Get message event ID
   */
  static getEventId(message: Message): string | null {
    return message.metadata.eventId || null
  }

  /**
   * Get message session ID
   */
  static getSessionId(message: Message): string | null {
    return message.metadata.sessionId || null
  }

  /**
   * Check if message can be forwarded
   */
  static canForward(message: Message): boolean {
    return this.isActive(message) && !this.isSystem(message)
  }

  /**
   * Check if message can be copied
   */
  static canCopy(message: Message): boolean {
    return this.isActive(message) && message.type === 'text'
  }

  /**
   * Get message preview text
   */
  static getPreviewText(message: Message): string {
    if (this.isDeleted(message)) return '[Message deleted]'
    if (this.isSystem(message)) return message.content
    if (this.isFile(message)) return `📎 ${message.metadata.fileName || 'File'}`
    if (this.isImage(message)) return '📷 Image'
    if (this.isLink(message)) return `🔗 ${message.metadata.linkTitle || 'Link'}`
    return message.content
  }
}

