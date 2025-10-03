import { supabase } from '../supabase'

export interface UserPresence {
  userId: string
  eventId: string
  isOnline: boolean
  lastSeen: string
  status: 'active' | 'idle' | 'away'
}

export class ServerPresenceTracker {
  private static readonly HEARTBEAT_INTERVAL = 30000 // 30 seconds
  private static readonly PRESENCE_TIMEOUT = 45000 // 45 seconds
  private static heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
  private static cleanupInterval: NodeJS.Timeout | null = null

  // Initialize cleanup interval
  static {
    // Run cleanup every 10 seconds for very responsive updates
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPresence()
    }, 10000)
  }

  /**
   * Start tracking user presence for an event
   */
  static async startTracking(eventId: string, userId: string): Promise<void> {
    try {
      
      // Mark user as online
      await this.updatePresence(eventId, userId, true, 'active')

      // Set up heartbeat to keep user marked as active
      this.setupHeartbeat(eventId, userId)

      // Listen for page visibility changes
      this.setupVisibilityListener(eventId, userId)

      // Listen for beforeunload to mark user as offline
      this.setupBeforeUnloadListener(eventId, userId)

    } catch (error) {
    }
  }

  /**
   * Stop tracking user presence
   */
  static async stopTracking(eventId: string, userId: string): Promise<void> {
    try {
      
      // Clear heartbeat for this specific user first
      const intervalKey = `${eventId}-${userId}`
      const interval = this.heartbeatIntervals.get(intervalKey)
      if (interval) {
        clearInterval(interval)
        this.heartbeatIntervals.delete(intervalKey)
      }

      // Mark user as offline immediately - try multiple times to ensure it works
      for (let i = 0; i < 3; i++) {
        try {
          await this.updatePresence(eventId, userId, false, 'away')
          break
        } catch (error) {
          if (i === 2) throw error // Throw on final attempt
        }
      }

      // Trigger immediate cleanup to remove this user
      setTimeout(() => {
        this.cleanupExpiredPresence()
      }, 1000)

    } catch (error) {
    }
  }

  /**
   * Get all active users for an event
   */
  static async getActiveUsers(eventId: string): Promise<UserPresence[]> {
    try {
      
      // First, let's see all presence records for this event
      const { data: allPresence, error: allError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('event_id', eventId)
      
      
      if (allError) {
      }
      
      // Log details about each presence record
      if (allPresence) {
        const now = new Date()
        const timeoutThreshold = new Date(now.getTime() - this.PRESENCE_TIMEOUT)
        
        allPresence.forEach((record, index) => {
          const lastSeen = new Date(record.last_seen)
          const isWithinTimeout = lastSeen >= timeoutThreshold
        })
      }
      
      // Now get active users
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_online', true)
        .gte('last_seen', new Date(Date.now() - this.PRESENCE_TIMEOUT).toISOString())

      if (error) {
        return []
      }

      
      // Map database fields to interface
      const mappedUsers = (data || []).map(user => ({
        userId: user.user_id,
        eventId: user.event_id,
        isOnline: user.is_online,
        lastSeen: user.last_seen,
        status: user.status as 'active' | 'idle' | 'away'
      }))
      
      return mappedUsers
    } catch (error) {
      return []
    }
  }

  /**
   * Update user presence status
   */
  private static async updatePresence(
    eventId: string, 
    userId: string, 
    isOnline: boolean, 
    status: 'active' | 'idle' | 'away'
  ): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Use raw SQL for proper upsert with ON CONFLICT
      const { error } = await supabase.rpc('upsert_user_presence', {
        p_user_id: userId,
        p_event_id: eventId,
        p_is_online: isOnline,
        p_status: status,
        p_last_seen: now,
        p_updated_at: now
      })

      if (error) {
        // Fallback to simple upsert
        await this.simpleUpsert(eventId, userId, isOnline, status, now)
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Simple upsert fallback
   */
  private static async simpleUpsert(
    eventId: string, 
    userId: string, 
    isOnline: boolean, 
    status: 'active' | 'idle' | 'away',
    timestamp: string
  ): Promise<void> {
    try {
      // Try update first
      const { data: updateData, error: updateError } = await supabase
        .from('user_presence')
        .update({
          is_online: isOnline,
          status: status,
          last_seen: timestamp,
          updated_at: timestamp
        })
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .select()

      // If no rows updated, insert
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('user_presence')
          .insert({
            user_id: userId,
            event_id: eventId,
            is_online: isOnline,
            status: status,
            last_seen: timestamp,
            updated_at: timestamp
          })

        if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
        }
      }
    } catch (error) {
    }
  }

  /**
   * Set up heartbeat to keep user active
   */
  private static setupHeartbeat(eventId: string, userId: string): void {
    const intervalKey = `${eventId}-${userId}`
    
    // Clear existing heartbeat for this user
    const existingInterval = this.heartbeatIntervals.get(intervalKey)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Set up new heartbeat
    const interval = setInterval(async () => {
      await this.updatePresence(eventId, userId, true, 'active')
    }, this.HEARTBEAT_INTERVAL)

    this.heartbeatIntervals.set(intervalKey, interval)
  }

  /**
   * Set up page visibility listener
   */
  private static setupVisibilityListener(eventId: string, userId: string): void {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await this.updatePresence(eventId, userId, true, 'idle')
      } else {
        await this.updatePresence(eventId, userId, true, 'active')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Set up beforeunload listener
   */
  private static setupBeforeUnloadListener(eventId: string, userId: string): void {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = async () => {
      // Use sendBeacon for reliable delivery
      await this.updatePresence(eventId, userId, false, 'away')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  /**
   * Clean up expired presence records
   */
  static async cleanupExpiredPresence(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.PRESENCE_TIMEOUT).toISOString()
      
      
      // Mark users as offline if they haven't been seen recently
      const { data: expiredUsers, error: updateError } = await supabase
        .from('user_presence')
        .update({ is_online: false, status: 'away' })
        .lt('last_seen', cutoffTime)
        .eq('is_online', true)
        .select()

      if (updateError) {
      } else {
      }

      // Also clean up any users who haven't been seen for a very long time (delete their records)
      const veryOldCutoff = new Date(Date.now() - (this.PRESENCE_TIMEOUT * 2)).toISOString() // 90 seconds
      const { data: veryOldUsers, error: deleteError } = await supabase
        .from('user_presence')
        .delete()
        .lt('last_seen', veryOldCutoff)
        .select()

      if (deleteError) {
      } else if (veryOldUsers && veryOldUsers.length > 0) {
      }

      // Force cleanup of any users marked as away for more than 30 seconds
      const awayCutoff = new Date(Date.now() - 30000).toISOString() // 30 seconds
      const { data: awayUsers, error: awayError } = await supabase
        .from('user_presence')
        .delete()
        .eq('status', 'away')
        .lt('last_seen', awayCutoff)
        .select()

      if (awayError) {
      } else if (awayUsers && awayUsers.length > 0) {
      }
    } catch (error) {
    }
  }

  /**
   * Force cleanup all presence for an event (debug method)
   */
  static async forceCleanupEvent(eventId: string): Promise<void> {
    try {
      
      // Get all presence records for this event
      const { data: allPresence, error: fetchError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('event_id', eventId)

      if (fetchError) {
        return
      }


      if (allPresence && allPresence.length > 0) {
        // Mark all as offline
        const { error: updateError } = await supabase
          .from('user_presence')
          .update({ is_online: false, status: 'away' })
          .eq('event_id', eventId)

        if (updateError) {
        } else {
        }
      }
    } catch (error) {
    }
  }

  /**
   * Get debug information about presence tracking
   */
  static async getDebugInfo(eventId: string): Promise<any> {
    try {
      const { data: allPresence, error: allError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('event_id', eventId)

      const { data: activeUsers, error: activeError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_online', true)
        .gte('last_seen', new Date(Date.now() - this.PRESENCE_TIMEOUT).toISOString())

      return {
        allPresence: allPresence || [],
        activeUsers: activeUsers || [],
        heartbeatIntervals: Array.from(this.heartbeatIntervals.keys()),
        errors: {
          allError,
          activeError
        }
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }
}
