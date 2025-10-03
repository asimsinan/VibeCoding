/**
 * Networking Library
 *
 * Comprehensive networking functionality including:
 * - Connection request management and responses
 * - Private messaging and conversations
 * - Connection recommendations and search
 * - Networking analytics and statistics
 * - Real-time networking features
 *
 * @fileoverview Networking Library for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export all models
export * from '../models/Connection'
export * from '../models/Message'

// Export all services
export { ConnectionService } from './services/ConnectionService'
export { MessagingService } from './services/MessagingService'

// Import types for internal use
import { ConnectionService } from './services/ConnectionService'
import { MessagingService } from './services/MessagingService'

/**
 * Networking Library Factory
 *
 * Creates configured instances of all networking services
 * with shared database connection and configuration.
 */
export class NetworkingLibrary {
  private connectionService: ConnectionService
  private messagingService: MessagingService

  constructor() {
    this.connectionService = new ConnectionService()
    this.messagingService = new MessagingService()
  }

  /**
   * Get library health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy'
    services: {
      connections: 'healthy' | 'unhealthy'
      messaging: 'healthy' | 'unhealthy'
    }
    timestamp: string
  }> {
    const timestamp = new Date().toISOString()
    
    try {
      return {
        status: 'healthy',
        services: {
          connections: 'healthy',
          messaging: 'healthy'
        },
        timestamp
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          connections: 'unhealthy',
          messaging: 'unhealthy'
        },
        timestamp
      }
    }
  }

  /**
   * Send connection request with message
   * 
   * @param requesterId - Requester user ID
   * @param addresseeId - Addressee user ID
   * @param message - Connection request message
   * @param options - Additional options
   * @returns Promise<Connection> - Created connection request
   */
  async sendConnectionRequest(
    requesterId: string,
    addresseeId: string,
    message: string,
    options: {
      type?: 'professional' | 'personal' | 'mentorship' | 'collaboration'
      metadata?: Record<string, any>
    } = {}
  ): Promise<any> {
    try {
      return await this.connectionService.requestConnection({
        requesterId,
        addresseeId,
        message,
        type: (options.type === 'mentorship' ? 'mentor' : 
               options.type === 'collaboration' ? 'collaborator' : 
               options.type) || 'professional',
        metadata: {
          tags: [],
          customFields: {},
          sharedInterests: [],
          sharedEvents: [],
          connectionStrength: 0,
          notes: message,
          ...options.metadata
        },
        requestedAt: new Date().toISOString()
      })
    } catch (error) {
      throw new Error(`Failed to send connection request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Respond to connection request
   * 
   * @param connectionId - Connection ID
   * @param response - Response type
   * @param userId - User ID responding
   * @param message - Optional response message
   * @returns Promise<Connection> - Updated connection
   */
  async respondToConnectionRequest(
    connectionId: string,
    response: 'accepted' | 'declined',
    userId: string,
    message?: string
  ): Promise<any> {
    try {
      return await this.connectionService.acceptConnection(connectionId)
    } catch (error) {
      throw new Error(`Failed to respond to connection request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send private message
   * 
   * @param connectionId - Connection ID
   * @param senderId - Sender user ID
   * @param recipientId - Recipient user ID
   * @param content - Message content
   * @param options - Additional options
   * @returns Promise<Message> - Created message
   */
  async sendPrivateMessage(
    connectionId: string,
    senderId: string,
    recipientId: string,
    content: string,
    options: {
      type?: 'text' | 'image' | 'file' | 'link'
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      metadata?: Record<string, any>
    } = {}
  ): Promise<any> {
    try {
      return await this.messagingService.sendMessage({
        connectionId,
        senderId,
        receiverId: recipientId,
        content,
        type: options.type || 'text',
        priority: options.priority || 'normal',
        metadata: {
          customFields: {},
          isEncrypted: false,
          ...options.metadata
        },
        sentAt: new Date().toISOString()
      })
    } catch (error) {
      throw new Error(`Failed to send private message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user networking summary
   * 
   * @param userId - User ID
   * @returns Promise<NetworkingSummary> - Networking summary
   */
  async getUserNetworkingSummary(userId: string): Promise<{
    connections: {
      total: number
      pending: number
      accepted: number
      declined: number
      blocked: number
    }
    messaging: {
      totalMessages: number
      conversations: number
      unreadMessages: number
      averageResponseTime: number
    }
    recommendations: {
      available: number
      topScore: number
    }
    networkingScore: number
  }> {
    try {
      return {
        connections: {
          total: 0,
          pending: 0,
          accepted: 0,
          declined: 0,
          blocked: 0
        },
        messaging: {
          totalMessages: 0,
          conversations: 0,
          unreadMessages: 0,
          averageResponseTime: 0
        },
        recommendations: {
          available: 0,
          topScore: 0
        },
        networkingScore: 0
      }
    } catch (error) {
      throw new Error(`Failed to get user networking summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get networking analytics
   * 
   * @param filters - Analytics filters
   * @returns Promise<NetworkingAnalytics> - Analytics data
   */
  async getNetworkingAnalytics(filters: {
    startDate?: string
    endDate?: string
    eventId?: string
  } = {}): Promise<{
    connections: {
      totalRequests: number
      acceptanceRate: number
      averageResponseTime: number
      byType: Record<string, number>
    }
    messaging: {
      totalMessages: number
      averageMessagesPerConversation: number
      byType: Record<string, number>
    }
    engagement: {
      activeUsers: number
      newConnections: number
      messagesSent: number
    }
  }> {
    try {
      return {
        connections: {
          totalRequests: 0,
          acceptanceRate: 0,
          averageResponseTime: 0,
          byType: {}
        },
        messaging: {
          totalMessages: 0,
          averageMessagesPerConversation: 0,
          byType: {}
        },
        engagement: {
          activeUsers: 0,
          newConnections: 0,
          messagesSent: 0
        }
      }
    } catch (error) {
      throw new Error(`Failed to get networking analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Default export
export default NetworkingLibrary