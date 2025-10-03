/**
 * Networking Service - Supabase Implementation
 * 
 * Provides comprehensive networking and connection functionality using Supabase
 * 
 * @fileoverview Networking Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { supabase } from '../../supabase'
import { Connection, CreateConnectionRequest, UpdateConnectionRequest, ConnectionStatus } from '../../models/Connection'
import { Message, CreateMessageRequest } from '../../models/Message'

export class ConnectionService {
  private supabase = supabase

  constructor() {
    // No need to create new client - use shared instance
  }

  /**
   * Request connection
   */
  async requestConnection(connectionData: CreateConnectionRequest): Promise<Connection> {
    try {
      const connection: Connection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requesterId: connectionData.requesterId,
        addresseeId: connectionData.addresseeId,
        status: 'pending' as ConnectionStatus,
        type: connectionData.type || 'professional',
        message: connectionData.message || '',
        metadata: connectionData.metadata || {
          tags: [],
          customFields: {},
          sharedInterests: [],
          sharedEvents: [],
          connectionStrength: 0
        },
        requestedAt: connectionData.requestedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('connections')
        .insert({
          id: connection.id,
          requester_id: connection.requesterId,
          recipient_id: connection.addresseeId,
          status: connection.status,
          type: connection.type,
          message: connection.message,
          metadata: connection.metadata,
          requested_at: connection.requestedAt,
          created_at: connection.createdAt,
          updated_at: connection.updatedAt
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return connection
    } catch (error) {
      throw new Error(`Failed to request connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get connection by ID
   */
  async getConnectionById(connectionId: string): Promise<Connection | null> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToConnection(data)
    } catch (error) {
      throw new Error(`Failed to get connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(connectionId: string, status: ConnectionStatus): Promise<Connection> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToConnection(data)
    } catch (error) {
      throw new Error(`Failed to update connection status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Accept connection
   */
  async acceptConnection(connectionId: string): Promise<Connection> {
    return this.updateConnectionStatus(connectionId, 'accepted')
  }

  /**
   * Decline connection
   */
  async declineConnection(connectionId: string): Promise<Connection> {
    return this.updateConnectionStatus(connectionId, 'declined')
  }

  /**
   * Block connection
   */
  async blockConnection(connectionId: string): Promise<Connection> {
    return this.updateConnectionStatus(connectionId, 'blocked')
  }

  /**
   * Get user connections
   */
  async getUserConnections(userId: string, filters: {
    status?: ConnectionStatus
    eventId?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    data: Connection[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        status,
        eventId,
        page = 1,
        limit = 20
      } = filters

      let query = this.supabase
        .from('connections')
        .select('*', { count: 'exact' })
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

      if (status) {
        query = query.eq('status', status)
      }

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const connections = data.map((row: any) => this.mapRowToConnection(row))

      return {
        data: connections,
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      throw new Error(`Failed to get user connections: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get pending connections for user
   */
  async getPendingConnections(userId: string): Promise<Connection[]> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map((row: any) => this.mapRowToConnection(row))
    } catch (error) {
      throw new Error(`Failed to get pending connections: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get connection messages
   */
  async getConnectionMessages(connectionId: string, filters: {
    page?: number
    limit?: number
  } = {}): Promise<{
    data: Message[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const {
        page = 1,
        limit = 50
      } = filters

      let query = this.supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('connection_id', connectionId)

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by created_at asc (oldest first)
      query = query.order('created_at', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const messages = data.map((row: any) => this.mapRowToMessage(row))

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
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<Message> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return this.mapRowToMessage(data)
    } catch (error) {
      throw new Error(`Failed to mark message as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          connections!inner(requester_id, recipient_id)
        `, { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)
        .or(`connections.requester_id.eq.${userId},connections.recipient_id.eq.${userId}`)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      throw new Error(`Failed to get unread message count: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map database row to Connection object
   */
  private mapRowToConnection(row: any): Connection {
    return {
      id: row.id,
      requesterId: row.requester_id,
      addresseeId: row.recipient_id,
      status: row.status,
      type: row.type || 'professional',
      message: row.message || '',
      metadata: row.metadata || {
        tags: [],
        customFields: {},
        sharedInterests: [],
        sharedEvents: [],
        connectionStrength: 0
      },
      requestedAt: row.requested_at,
      respondedAt: row.responded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  /**
   * Map database row to Message object
   */
  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      connectionId: row.connection_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      type: row.type,
      status: row.status || 'sent',
      priority: row.priority || 'normal',
      metadata: {
        ...row.metadata,
        fileUrl: row.attachment_url,
        fileName: row.attachment_name
      },
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

export default ConnectionService