import { useState, useEffect, useCallback } from 'react'
import { UserPresenceService, UserPresence, UserActivity } from '../services/UserPresenceService'
import { useAuth } from '../auth/context'

export interface UseUserPresenceOptions {
  eventId: string
  autoTrack?: boolean
  refreshInterval?: number
}

export interface UseUserPresenceReturn {
  isOnline: boolean
  lastSeen: Date | null
  status: 'active' | 'idle' | 'away' | 'offline'
  trackPresence: (status?: 'active' | 'idle' | 'away') => Promise<void>
  updateStatus: (status: 'active' | 'idle' | 'away') => Promise<void>
  markOffline: () => Promise<void>
  loading: boolean
  error: string | null
}

export function useUserPresence(options: UseUserPresenceOptions): UseUserPresenceReturn {
  const { eventId, autoTrack = true, refreshInterval = 30000 } = options
  const { user } = useAuth()
  
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<Date | null>(null)
  const [status, setStatus] = useState<'active' | 'idle' | 'away' | 'offline'>('offline')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const presenceService = new UserPresenceService()

  // Track user presence
  const trackPresence = useCallback(async (status: 'active' | 'idle' | 'away' = 'active') => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const presence = await presenceService.trackPresence(user.id, eventId, status)
      setIsOnline(presence.isOnline)
      setLastSeen(new Date(presence.lastSeen))
      setStatus(presence.status)
    } catch (err) {
      setError('Failed to track presence')
    } finally {
      setLoading(false)
    }
  }, [user, eventId, presenceService])

  // Update user status
  const updateStatus = useCallback(async (newStatus: 'active' | 'idle' | 'away') => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      await presenceService.updateStatus(user.id, eventId, newStatus)
      setStatus(newStatus)
      setLastSeen(new Date())
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setLoading(false)
    }
  }, [user, eventId, presenceService])

  // Mark user as offline
  const markOffline = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      await presenceService.markOffline(user.id, eventId)
      setIsOnline(false)
      setStatus('offline')
      setLastSeen(new Date())
    } catch (err) {
      setError('Failed to mark offline')
    } finally {
      setLoading(false)
    }
  }, [user, eventId, presenceService])

  // Load initial presence
  useEffect(() => {
    if (!user) return
    
    const loadPresence = async () => {
      try {
        const presence = await presenceService.getUserPresence(user.id, eventId)
        if (presence) {
          setIsOnline(presence.isOnline)
          setLastSeen(new Date(presence.lastSeen))
          setStatus(presence.status)
        }
      } catch (err) {
      }
    }
    
    loadPresence()
  }, [user, eventId, presenceService])

  // Auto-track presence
  useEffect(() => {
    if (!user || !autoTrack) return
    
    // Track presence on mount
    trackPresence('active')
    
    // Set up periodic presence updates
    const interval = setInterval(() => {
      trackPresence('active')
    }, refreshInterval)
    
    // Track presence on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackPresence('active')
      } else {
        updateStatus('idle')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Track presence on page unload
    const handleBeforeUnload = () => {
      markOffline()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      markOffline()
    }
  }, [user, eventId, autoTrack, refreshInterval, trackPresence, updateStatus, markOffline])

  return {
    isOnline,
    lastSeen,
    status,
    trackPresence,
    updateStatus,
    markOffline,
    loading,
    error
  }
}

export interface UseOnlineUsersOptions {
  eventId: string
  refreshInterval?: number
}

export interface UseOnlineUsersReturn {
  users: UserPresence[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOnlineUsers(options: UseOnlineUsersOptions): UseOnlineUsersReturn {
  const { eventId, refreshInterval = 10000 } = options
  
  const [users, setUsers] = useState<UserPresence[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const presenceService = new UserPresenceService()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const onlineUsers = await presenceService.getOnlineUsers(eventId)
      setUsers(onlineUsers)
    } catch (err) {
      setError('Failed to fetch online users')
    } finally {
      setLoading(false)
    }
  }, [eventId, presenceService])

  useEffect(() => {
    fetchUsers()
    
    const interval = setInterval(fetchUsers, refreshInterval)
    
    return () => clearInterval(interval)
  }, [fetchUsers, refreshInterval])

  return {
    users,
    loading,
    error,
    refresh: fetchUsers
  }
}

export interface UseActivityFeedOptions {
  eventId: string
  refreshInterval?: number
  limit?: number
}

export interface UseActivityFeedReturn {
  activities: UserActivity[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  trackActivity: (type: UserActivity['type'], message?: string, metadata?: Record<string, any>) => Promise<void>
}

export function useActivityFeed(options: UseActivityFeedOptions): UseActivityFeedReturn {
  const { eventId, refreshInterval = 5000, limit = 20 } = options
  const { user } = useAuth()
  
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const presenceService = new UserPresenceService()

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const recentActivities = await presenceService.getRecentActivities(eventId, limit)
      setActivities(recentActivities)
    } catch (err) {
      setError('Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }, [eventId, limit, presenceService])

  const trackActivity = useCallback(async (
    type: UserActivity['type'], 
    message?: string, 
    metadata?: Record<string, any>
  ) => {
    if (!user) return
    
    try {
      await presenceService.trackActivity(user.id, eventId, type, message, metadata)
      // Refresh activities after tracking
      await fetchActivities()
    } catch (err) {
    }
  }, [user, eventId, presenceService, fetchActivities])

  useEffect(() => {
    fetchActivities()
    
    const interval = setInterval(fetchActivities, refreshInterval)
    
    return () => clearInterval(interval)
  }, [fetchActivities, refreshInterval])

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
    trackActivity
  }
}
