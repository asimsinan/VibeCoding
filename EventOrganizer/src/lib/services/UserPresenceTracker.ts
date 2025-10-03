// Simple user presence tracking using session storage
export class UserPresenceTracker {
  private static readonly PRESENCE_KEY = 'event_presence'
  private static readonly PRESENCE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  /**
   * Mark user as present in an event
   */
  static markUserPresent(eventId: string, userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const presence = this.getPresenceData()
      presence[eventId] = presence[eventId] || {}
      presence[eventId][userId] = Date.now()
      
      localStorage.setItem(this.PRESENCE_KEY, JSON.stringify(presence))
    } catch (error) {
    }
  }

  /**
   * Mark user as absent from an event
   */
  static markUserAbsent(eventId: string, userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const presence = this.getPresenceData()
      if (presence[eventId]) {
        delete presence[eventId][userId]
        if (Object.keys(presence[eventId]).length === 0) {
          delete presence[eventId]
        }
      }
      
      localStorage.setItem(this.PRESENCE_KEY, JSON.stringify(presence))
    } catch (error) {
    }
  }

  /**
   * Get active users for an event
   */
  static getActiveUsers(eventId: string): string[] {
    if (typeof window === 'undefined') return []

    try {
      const presence = this.getPresenceData()
      const eventPresence = presence[eventId] || {}
      const now = Date.now()
      
      // Filter out users who haven't been active recently
      return Object.entries(eventPresence)
        .filter(([_, timestamp]) => now - (timestamp as number) < this.PRESENCE_TIMEOUT)
        .map(([userId, _]) => userId)
    } catch (error) {
      return []
    }
  }

  /**
   * Get presence data from localStorage
   */
  private static getPresenceData(): Record<string, Record<string, number>> {
    try {
      const data = localStorage.getItem(this.PRESENCE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      return {}
    }
  }

  /**
   * Clean up expired presence data
   */
  static cleanupExpiredPresence(): void {
    if (typeof window === 'undefined') return

    try {
      const presence = this.getPresenceData()
      const now = Date.now()
      
      Object.keys(presence).forEach(eventId => {
        Object.keys(presence[eventId]).forEach(userId => {
          if (now - presence[eventId][userId] >= this.PRESENCE_TIMEOUT) {
            delete presence[eventId][userId]
          }
        })
        
        if (Object.keys(presence[eventId]).length === 0) {
          delete presence[eventId]
        }
      })
      
      localStorage.setItem(this.PRESENCE_KEY, JSON.stringify(presence))
    } catch (error) {
    }
  }
}
