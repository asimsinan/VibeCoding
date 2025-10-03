#!/usr/bin/env node
/**
 * WebSocket Service
 * 
 * Provides real-time communication functionality including:
 * - WebSocket connection management
 * - Connection pooling and failover
 * - Message queuing and delivery
 * - Connection health monitoring
 * - Real-time event broadcasting
 * 
 * @fileoverview WebSocket Service for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { EventEmitter } from 'events'

export interface WebSocketMessage {
  id: string
  type: 'event_update' | 'session_start' | 'session_end' | 'notification' | 'chat_message' | 'attendee_join' | 'attendee_leave'
  data: any
  timestamp: string
  target?: {
    eventId?: string
    sessionId?: string
    userId?: string
    userIds?: string[]
  }
}

export interface WebSocketConnection {
  id: string
  userId: string
  eventId?: string
  sessionId?: string
  socket: any
  connectedAt: string
  lastPing?: string
  isAlive: boolean
}

export interface ConnectionOptions {
  heartbeatInterval?: number
  reconnectAttempts?: number
  reconnectDelay?: number
  maxConnections?: number
}

/**
 * WebSocket Service
 * 
 * Handles all WebSocket-related functionality including connection
 * management, message broadcasting, and real-time communication.
 */
export class WebSocketService extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map()
  private messageQueue: WebSocketMessage[] = []
  private heartbeatInterval: NodeJS.Timeout | null = null
  private options: ConnectionOptions
  private isRunning: boolean = false

  constructor(options: ConnectionOptions = {}) {
    super()
    this.options = {
      heartbeatInterval: 30000, // 30 seconds
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxConnections: 1000,
      ...options
    }
  }

  /**
   * Start WebSocket service
   */
  async start(): Promise<void> {
    try {
      this.isRunning = true
      this.startHeartbeat()
      this.emit('started')
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to start WebSocket service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stop WebSocket service
   */
  async stop(): Promise<void> {
    try {
      this.isRunning = false
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }

      // Close all connections
      for (const connection of this.connections.values()) {
        this.closeConnection(connection.id)
      }

      this.connections.clear()
      this.messageQueue = []
      this.emit('stopped')
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to stop WebSocket service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Add WebSocket connection
   * 
   * @param connectionId - Unique connection ID
   * @param userId - User ID
   * @param socket - WebSocket instance
   * @param eventId - Optional event ID
   * @param sessionId - Optional session ID
   * @returns Promise<string> - Connection ID
   */
  async addConnection(
    connectionId: string,
    userId: string,
    socket: any,
    eventId?: string,
    sessionId?: string
  ): Promise<string> {
    try {
      // Check connection limit
      if (this.connections.size >= this.options.maxConnections!) {
        throw new Error('Maximum connections reached')
      }

      // Check if user already has a connection
      const existingConnection = this.findConnectionByUserId(userId)
      if (existingConnection) {
        await this.removeConnection(existingConnection.id)
      }

      const connection: WebSocketConnection = {
        id: connectionId,
        userId,
        eventId,
        sessionId,
        socket,
        connectedAt: new Date().toISOString(),
        isAlive: true
      }

      this.connections.set(connectionId, connection)

      // Set up socket event handlers
      this.setupSocketHandlers(connection)

      this.emit('connection_added', connection)
      return connectionId
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to add connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Remove WebSocket connection
   * 
   * @param connectionId - Connection ID
   * @returns Promise<boolean> - Success status
   */
  async removeConnection(connectionId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId)
      if (!connection) {
        return false
      }

      this.closeConnection(connectionId)
      this.connections.delete(connectionId)
      this.emit('connection_removed', connection)
      return true
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to remove connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send message to specific connection
   * 
   * @param connectionId - Connection ID
   * @param message - Message to send
   * @returns Promise<boolean> - Success status
   */
  async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId)
      if (!connection || !connection.isAlive) {
        return false
      }

      if (connection.socket.readyState === 1) { // WebSocket.OPEN
        connection.socket.send(JSON.stringify(message))
        return true
      } else {
        await this.removeConnection(connectionId)
        return false
      }
    } catch (error) {
      this.emit('error', error)
      return false
    }
  }

  /**
   * Broadcast message to multiple connections
   * 
   * @param message - Message to broadcast
   * @param target - Target criteria
   * @returns Promise<number> - Number of connections that received the message
   */
  async broadcastMessage(message: WebSocketMessage, target?: {
    eventId?: string
    sessionId?: string
    userIds?: string[]
    excludeUserIds?: string[]
  }): Promise<number> {
    try {
      let sentCount = 0
      const connections = this.getTargetConnections(target)

      for (const connection of connections) {
        const success = await this.sendToConnection(connection.id, message)
        if (success) {
          sentCount++
        }
      }

      this.emit('message_broadcast', { message, sentCount })
      return sentCount
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to broadcast message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Queue message for delivery
   * 
   * @param message - Message to queue
   * @returns Promise<string> - Message ID
   */
  async queueMessage(message: WebSocketMessage): Promise<string> {
    try {
      message.id = message.id || this.generateMessageId()
      message.timestamp = new Date().toISOString()
      
      this.messageQueue.push(message)
      this.emit('message_queued', message)
      
      return message.id
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to queue message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process queued messages
   * 
   * @returns Promise<number> - Number of messages processed
   */
  async processQueuedMessages(): Promise<number> {
    try {
      let processedCount = 0
      const messagesToProcess = [...this.messageQueue]
      this.messageQueue = []

      for (const message of messagesToProcess) {
        try {
          await this.broadcastMessage(message, message.target)
          processedCount++
        } catch (error) {
          // Re-queue failed messages
          this.messageQueue.push(message)
        }
      }

      this.emit('messages_processed', { processedCount, remaining: this.messageQueue.length })
      return processedCount
    } catch (error) {
      this.emit('error', error)
      throw new Error(`Failed to process queued messages: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get connection statistics
   * 
   * @returns Connection statistics
   */
  getConnectionStats(): {
    totalConnections: number
    activeConnections: number
    connectionsByEvent: Record<string, number>
    connectionsBySession: Record<string, number>
    queuedMessages: number
    uptime: number
  } {
    const now = Date.now()
    const connectionsByEvent: Record<string, number> = {}
    const connectionsBySession: Record<string, number> = {}
    let activeConnections = 0

    for (const connection of this.connections.values()) {
      if (connection.isAlive) {
        activeConnections++
      }

      if (connection.eventId) {
        connectionsByEvent[connection.eventId] = (connectionsByEvent[connection.eventId] || 0) + 1
      }

      if (connection.sessionId) {
        connectionsBySession[connection.sessionId] = (connectionsBySession[connection.sessionId] || 0) + 1
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      connectionsByEvent,
      connectionsBySession,
      queuedMessages: this.messageQueue.length,
      uptime: this.isRunning ? now - (this as any).startTime : 0
    }
  }

  /**
   * Get connections for specific criteria
   * 
   * @param criteria - Connection criteria
   * @returns Array of connections
   */
  getConnections(criteria?: {
    eventId?: string
    sessionId?: string
    userId?: string
    activeOnly?: boolean
  }): WebSocketConnection[] {
    const connections: WebSocketConnection[] = []

    for (const connection of this.connections.values()) {
      if (criteria?.activeOnly && !connection.isAlive) {
        continue
      }

      if (criteria?.eventId && connection.eventId !== criteria.eventId) {
        continue
      }

      if (criteria?.sessionId && connection.sessionId !== criteria.sessionId) {
        continue
      }

      if (criteria?.userId && connection.userId !== criteria.userId) {
        continue
      }

      connections.push(connection)
    }

    return connections
  }

  // Private helper methods

  private setupSocketHandlers(connection: WebSocketConnection): void {
    const socket = connection.socket

    socket.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString())
        this.emit('message_received', { connection, message })
      } catch (error) {
        this.emit('error', { connection, error })
      }
    })

    socket.on('close', () => {
      this.removeConnection(connection.id)
    })

    socket.on('error', (error: any) => {
      this.emit('error', { connection, error })
      this.removeConnection(connection.id)
    })

    socket.on('pong', () => {
      connection.lastPing = new Date().toISOString()
      connection.isAlive = true
    })
  }

  private closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection && connection.socket) {
      try {
        connection.socket.close()
      } catch (error) {
        // Ignore close errors
      }
    }
  }

  private findConnectionByUserId(userId: string): WebSocketConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.userId === userId) {
        return connection
      }
    }
    return null
  }

  private getTargetConnections(target?: {
    eventId?: string
    sessionId?: string
    userIds?: string[]
    excludeUserIds?: string[]
  }): WebSocketConnection[] {
    const connections: WebSocketConnection[] = []

    for (const connection of this.connections.values()) {
      if (!connection.isAlive) {
        continue
      }

      if (target?.eventId && connection.eventId !== target.eventId) {
        continue
      }

      if (target?.sessionId && connection.sessionId !== target.sessionId) {
        continue
      }

      if (target?.userIds && !target.userIds.includes(connection.userId)) {
        continue
      }

      if (target?.excludeUserIds && target.excludeUserIds.includes(connection.userId)) {
        continue
      }

      connections.push(connection)
    }

    return connections
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const connection of this.connections.values()) {
        if (connection.socket.readyState === 1) { // WebSocket.OPEN
          connection.socket.ping()
        } else {
          connection.isAlive = false
        }
      }
    }, this.options.heartbeatInterval)
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default WebSocketService
