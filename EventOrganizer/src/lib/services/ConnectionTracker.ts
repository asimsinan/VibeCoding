import { supabase } from '../supabase'

interface ConnectionInfo {
  userId: string
  eventId: string
  connectedAt: Date
  lastSeen: Date
}

export class ConnectionTracker {
  private connections = new Map<string, ConnectionInfo>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  /**
   * Track a user connection to an event
   */
  async trackConnection(userId: string, eventId: string): Promise<void> {
    const connectionKey = `${userId}-${eventId}`
    const now = new Date()
    
    this.connections.set(connectionKey, {
      userId,
      eventId,
      connectedAt: now,
      lastSeen: now
    })

    // Broadcast connection status via Supabase Realtime
    try {
      const channel = supabase.channel(`event-connections-${eventId}`)
      await channel.send({
        type: 'broadcast',
        event: 'user-connected',
        payload: {
          userId,
          eventId,
          connectedAt: now.toISOString(),
          activeConnections: this.getActiveConnectionsForEvent(eventId)
        }
      })
    } catch (error) {
    }
  }

  /**
   * Update last seen timestamp for a user
   */
  updateLastSeen(userId: string, eventId: string): void {
    const connectionKey = `${userId}-${eventId}`
    const connection = this.connections.get(connectionKey)
    
    if (connection) {
      connection.lastSeen = new Date()
      this.connections.set(connectionKey, connection)
    }
  }

  /**
   * Remove a user connection
   */
  async removeConnection(userId: string, eventId: string): Promise<void> {
    const connectionKey = `${userId}-${eventId}`
    this.connections.delete(connectionKey)

    // Broadcast disconnection status
    try {
      const channel = supabase.channel(`event-connections-${eventId}`)
      await channel.send({
        type: 'broadcast',
        event: 'user-disconnected',
        payload: {
          userId,
          eventId,
          activeConnections: this.getActiveConnectionsForEvent(eventId)
        }
      })
    } catch (error) {
    }
  }

  /**
   * Get active connections for a specific event
   */
  getActiveConnectionsForEvent(eventId: string): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    return Array.from(this.connections.values())
      .filter(conn => 
        conn.eventId === eventId && 
        conn.lastSeen >= fiveMinutesAgo
      ).length
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    return Array.from(this.connections.values())
      .filter(conn => conn.lastSeen >= fiveMinutesAgo)
      .length
  }

  /**
   * Get connection info for a specific user and event
   */
  getConnectionInfo(userId: string, eventId: string): ConnectionInfo | null {
    const connectionKey = `${userId}-${eventId}`
    return this.connections.get(connectionKey) || null
  }

  /**
   * Start cleanup of stale connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      // Remove stale connections
      for (const [key, connection] of this.connections.entries()) {
        if (connection.lastSeen < fiveMinutesAgo) {
          this.connections.delete(key)
        }
      }
    }, 60000) // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Export singleton instance
export const connectionTracker = new ConnectionTracker()
