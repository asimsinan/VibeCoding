import { supabase } from '../supabase'

export interface UserPresence {
  id: string
  userId: string
  eventId: string
  isOnline: boolean
  lastSeen: string
  status: 'active' | 'idle' | 'away' | 'offline'
  metadata?: {
    userAgent?: string
    ipAddress?: string
    location?: string
  }
}

export interface UserActivity {
  id: string
  userId: string
  eventId: string
  type: 'join' | 'leave' | 'message' | 'update' | 'view' | 'interact'
  message?: string
  metadata?: Record<string, any>
  timestamp: string
}

export class UserPresenceService {
  private supabase = supabase
  private presenceChannels = new Map<string, any>()

  /**
   * Track user presence in an event
   */
  async trackPresence(userId: string, eventId: string, status: 'active' | 'idle' | 'away' = 'active'): Promise<UserPresence> {
    try {
      const now = new Date().toISOString()
      
      // Upsert user presence
      const { data, error } = await this.supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          event_id: eventId,
          is_online: true,
          last_seen: now,
          status: status,
          updated_at: now
        }, {
          onConflict: 'user_id,event_id'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Track activity
      await this.trackActivity(userId, eventId, 'join', 'User joined the event')

      // Set up real-time presence channel
      await this.setupPresenceChannel(eventId)

      return this.mapRowToPresence(data)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, eventId: string, status: 'active' | 'idle' | 'away'): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      await this.supabase
        .from('user_presence')
        .update({
          status: status,
          last_seen: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('event_id', eventId)

      // Track activity
      await this.trackActivity(userId, eventId, 'update', `User status changed to ${status}`)
    } catch (error) {
      throw error
    }
  }

  /**
   * Mark user as offline
   */
  async markOffline(userId: string, eventId: string): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      await this.supabase
        .from('user_presence')
        .update({
          is_online: false,
          status: 'offline',
          last_seen: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('event_id', eventId)

      // Track activity
      await this.trackActivity(userId, eventId, 'leave', 'User left the event')
    } catch (error) {
      throw error
    }
  }

  /**
   * Get online users for an event
   */
  async getOnlineUsers(eventId: string): Promise<UserPresence[]> {
    try {
      // Try to query user_presence table directly - if it fails, table doesn't exist
      const { error: tableError } = await this.supabase
        .from('user_presence')
        .select('id')
        .limit(1)

      if (tableError && tableError.code === 'PGRST116') {
        return []
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data, error } = await this.supabase
        .from('user_presence')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name
          )
        `)
        .eq('event_id', eventId)
        .eq('is_online', true)
        .gte('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false })

      if (error) {
        return []
      }

      return data?.map(row => this.mapRowToPresence(row)) || []
    } catch (error) {
      return []
    }
  }

  /**
   * Get user presence for a specific user
   */
  async getUserPresence(userId: string, eventId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // User not found
        }
        return null
      }

      return this.mapRowToPresence(data)
    } catch (error) {
      return null
    }
  }

  /**
   * Track user activity
   */
  async trackActivity(
    userId: string, 
    eventId: string, 
    type: UserActivity['type'], 
    message?: string,
    metadata?: Record<string, any>
  ): Promise<UserActivity> {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await this.supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          event_id: eventId,
          type: type,
          message: message,
          metadata: metadata || {},
          timestamp: now
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return this.mapRowToActivity(data)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recent activities for an event
   */
  async getRecentActivities(eventId: string, limit: number = 20): Promise<UserActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_activities')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name
          )
        `)
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        return []
      }

      return data?.map(row => this.mapRowToActivity(row)) || []
    } catch (error) {
      return []
    }
  }

  /**
   * Set up real-time presence channel
   */
  private async setupPresenceChannel(eventId: string): Promise<void> {
    if (this.presenceChannels.has(eventId)) {
      return // Channel already exists
    }

    const channel = this.supabase
      .channel(`presence_${eventId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      })
      .subscribe()

    this.presenceChannels.set(eventId, channel)
  }

  /**
   * Clean up presence channels
   */
  async cleanup(): Promise<void> {
    for (const [eventId, channel] of this.presenceChannels) {
      await this.supabase.removeChannel(channel)
    }
    this.presenceChannels.clear()
  }

  /**
   * Map database row to UserPresence
   */
  private mapRowToPresence(row: any): UserPresence {
    return {
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      isOnline: row.is_online,
      lastSeen: row.last_seen,
      status: row.status,
      metadata: row.metadata
    }
  }

  /**
   * Map database row to UserActivity
   */
  private mapRowToActivity(row: any): UserActivity {
    return {
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      type: row.type,
      message: row.message,
      metadata: row.metadata,
      timestamp: row.timestamp
    }
  }
}
