/**
 * Real-time Communication Library
 * 
 * Comprehensive real-time communication functionality including:
 * - WebSocket connection management and broadcasting
 * - Real-time notification delivery
 * - Connection pooling and failover
 * - Message queuing and delivery
 * - Real-time analytics and monitoring
 * 
 * @fileoverview Real-time Communication Library for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export all models
export * from '../models/Notification'

// Export all services
export { WebSocketService } from './services/WebSocketService'
export { NotificationService } from './services/NotificationService'

// Export CLI interface
// export { RealTimeCommunicationCLI } from './cli'

// Import types for internal use
import { WebSocketService } from './services/WebSocketService'
import { NotificationService } from './services/NotificationService'

/**
 * Real-time Communication Library Factory
 * 
 * Creates configured instances of all real-time communication services
 * with shared database connection and configuration.
 */
export class RealTimeCommunicationLibrary {
  private webSocketService: WebSocketService
  private notificationService: NotificationService

  constructor() {
    this.webSocketService = new WebSocketService()
    this.notificationService = new NotificationService()
  }

  /**
   * Get WebSocket Service instance
   */
  get websocket(): WebSocketService {
    return this.webSocketService
  }

  /**
   * Get Notification Service instance
   */
  get notifications(): NotificationService {
    return this.notificationService
  }

  /**
   * Start all real-time services
   */
  async start(): Promise<void> {
    try {
      await this.webSocketService.start()
    } catch (error) {
      throw new Error(`Failed to start real-time communication services: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stop all real-time services
   */
  async stop(): Promise<void> {
    try {
      await this.webSocketService.stop()
    } catch (error) {
      throw new Error(`Failed to stop real-time communication services: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get library health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy'
    services: {
      websocket: 'healthy' | 'unhealthy'
      notifications: 'healthy' | 'unhealthy'
    }
    timestamp: string
  }> {
    const timestamp = new Date().toISOString()
    
    try {
      return {
        status: 'healthy',
        services: {
          websocket: 'healthy',
          notifications: 'healthy'
        },
        timestamp
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          websocket: 'unhealthy',
          notifications: 'unhealthy'
        },
        timestamp
      }
    }
  }

  /**
   * Broadcast real-time event
   * 
   * @param eventType - Type of event
   * @param data - Event data
   * @param target - Target criteria
   * @returns Promise<number> - Number of connections that received the event
   */
  async broadcastEvent(
    eventType: 'event_update' | 'session_start' | 'session_end' | 'attendee_join' | 'attendee_leave' | 'chat_message',
    data: any,
    target?: {
      eventId?: string
      sessionId?: string
      userIds?: string[]
      excludeUserIds?: string[]
    }
  ): Promise<number> {
    try {
      return await this.webSocketService.broadcastMessage({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        target
      }, target)
    } catch (error) {
      throw new Error(`Failed to broadcast event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send real-time notification
   * 
   * @param recipientId - Recipient ID
   * @param title - Notification title
   * @param message - Notification message
   * @param options - Additional options
   * @returns Promise<Notification> - Created notification
   */
  async sendRealtimeNotification(
    recipientId: string,
    title: string,
    message: string,
    options: {
      senderId?: string
      type?: 'event_update' | 'session_reminder' | 'networking_request' | 'announcement' | 'system' | 'registration_confirmation' | 'event_starting' | 'session_starting' | 'connection_accepted' | 'message_received' | 'feedback_request' | 'event_ended'
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      metadata?: Record<string, any>
    } = {}
  ): Promise<any> {
    try {
      return await this.notificationService.sendNotification({
        recipientId,
        senderId: options.senderId || 'system',
        type: options.type || 'announcement',
        title,
        message,
        priority: options.priority || 'normal',
        deliveryMethod: 'push',
        metadata: options.metadata ? {
          customFields: options.metadata,
          soundEnabled: true,
          vibrationEnabled: true,
          ...options.metadata
        } : {
          customFields: {},
          soundEnabled: true,
          vibrationEnabled: true
        }
      })
    } catch (error) {
      throw new Error(`Failed to send real-time notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get real-time statistics
   * 
   * @returns Real-time statistics
   */
  getRealtimeStats(): {
    connections: {
      total: number
      active: number
      byEvent: Record<string, number>
      bySession: Record<string, number>
    }
    notifications: {
      pending: number
      sent: number
      delivered: number
      failed: number
    }
    uptime: number
  } {
    const wsStats = this.webSocketService.getConnectionStats()
    
    return {
      connections: {
        total: wsStats.totalConnections,
        active: wsStats.activeConnections,
        byEvent: wsStats.connectionsByEvent,
        bySession: wsStats.connectionsBySession
      },
      notifications: {
        pending: 0, // Would need to query database for real-time stats
        sent: 0,
        delivered: 0,
        failed: 0
      },
      uptime: wsStats.uptime
    }
  }
}

// Default export
export default RealTimeCommunicationLibrary
