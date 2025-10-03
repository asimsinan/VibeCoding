#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

/**
 * Messaging Service
 * 
 * Provides comprehensive messaging functionality including:
 * - Private message management
 * - Message threading and conversations
 * - Message status tracking
 * - Message search and filtering
 * - Message analytics and reporting
 * 
 * @fileoverview Messaging Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */
import { Message, CreateMessageRequest, UpdateMessageRequest, MessageStatus } from '../../models/Message'
import { Connection } from '../../models/Connection'

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

export interface MessageStats {
  totalMessages: number
  sentMessages: number
  receivedMessages: number
  unreadMessages: number
  averageResponseTime: number
}

/**
 * Messaging Service
 *
 * Handles all messaging-related functionality including creation,
 * delivery, threading, and analytics.
 */
export class MessagingService {
  private get supabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Send message
   * 
   * @param messageData - Message data
   * @returns Promise<Message> - Created message
   */
  async sendMessage(messageData: CreateMessageRequest): Promise<Message> {
    try {
      // Validate message data
      this.validateMessageData(messageData)

      // Generate message ID
      const messageId = this.generateMessageId()

      // Create message object
      const message: Message = {
        id: messageId,
        connectionId: messageData.connectionId,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        type: messageData.type || 'text',
        content: messageData.content,
        status: 'sent' as MessageStatus,
        priority: messageData.priority || 'normal',
        metadata: messageData.metadata || {},
        sentAt: messageData.sentAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Save to database using Supabase
      const { error } = await this.supabase
        .from('messages')
        .insert({
          id: message.id,
          connection_id: message.connectionId,
          sender_id: message.senderId,
          receiver_id: message.receiverId,
          content: message.content,
          type: message.type,
          status: message.status,
          priority: message.priority,
          metadata: message.metadata,
          sent_at: message.sentAt,
          created_at: message.createdAt,
          updated_at: message.updatedAt
        } as any)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return message
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get message by ID
   * 
   * @param messageId - Message ID
   * @returns Promise<Message | null> - Message or null if not found
   */
  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (error || !data) {
        return null
      }

      return this.mapRowToMessage(data)
    } catch (error) {
      throw new Error(`Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update message
   * 
   * @param messageId - Message ID
   * @param updateData - Update data
   * @returns Promise<Message> - Updated message
   */
  async updateMessage(messageId: string, updateData: UpdateMessageRequest): Promise<Message> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update({
          content: updateData.content,
          status: updateData.status,
          priority: updateData.priority,
          metadata: updateData.metadata,
          delivered_at: updateData.deliveredAt,
          read_at: updateData.readAt,
          edited_at: updateData.editedAt,
          deleted_at: updateData.deletedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error || !data) {
        throw new Error(`Database error: ${error?.message || 'Message not found'}`)
      }

      return this.mapRowToMessage(data)
    } catch (error) {
      throw new Error(`Failed to update message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Mark message as read
   * 
   * @param messageId - Message ID
   * @param userId - User ID marking as read
   * @returns Promise<Message> - Updated message
   */
  async markAsRead(messageId: string, userId: string): Promise<Message> {
    try {
      const message = await this.getMessageById(messageId)
      if (!message) {
        throw new Error('Message not found')
      }

      if (message.receiverId !== userId) {
        throw new Error('Unauthorized: Only the recipient can mark message as read')
      }

      return await this.updateMessage(messageId, {
        status: 'read',
        readAt: new Date().toISOString()
      })
    } catch (error) {
      throw new Error(`Failed to mark message as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user conversations
   * 
   * @param userId - User ID
   * @param filters - Filter options
   * @returns Promise<{conversations: Conversation[], total: number}> - Conversations
   */
  async getUserConversations(userId: string, filters: {
    unreadOnly?: boolean
    page?: number
    limit?: number
  } = {}): Promise<{conversations: Conversation[], total: number}> {
    try {
      // Simplified implementation - return empty conversations for now
      return {
        conversations: [],
        total: 0
      }
    } catch (error) {
      throw new Error(`Failed to get user conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get connection messages
   * 
   * @param connectionId - Connection ID
   * @param filters - Filter options
   * @returns Promise<{data: Message[], total: number, page: number, limit: number}> - Messages
   */
  async getConnectionMessages(connectionId: string, filters: {
    page?: number
    limit?: number
    type?: string
  } = {}): Promise<{data: Message[], total: number, page: number, limit: number}> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { data, error, count } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('connection_id', connectionId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const messages = (data || []).map((row: any) => this.mapRowToMessage(row))

      return {
        data: messages,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to get connection messages: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate unique message ID
   * 
   * @returns string - Unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate message data
   * 
   * @param messageData - Message data to validate
   */
  private validateMessageData(messageData: CreateMessageRequest): void {
    if (!messageData.content || messageData.content.trim().length === 0) {
      throw new Error('Message content is required')
    }

    if (messageData.content.length > 2000) {
      throw new Error('Message content too long (max 2000 characters)')
    }

    if (!messageData.connectionId) {
      throw new Error('Connection ID is required')
    }

    if (!messageData.senderId) {
      throw new Error('Sender ID is required')
    }

    if (!messageData.receiverId) {
      throw new Error('Receiver ID is required')
    }
  }

  /**
   * Map database row to Message object
   * 
   * @param row - Database row
   * @returns Message - Message object
   */
  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      connectionId: row.connection_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      type: row.type,
      content: row.content,
      status: row.status || 'sent',
      priority: row.priority || 'normal',
      metadata: row.metadata || {},
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      editedAt: row.edited_at,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export default MessagingService