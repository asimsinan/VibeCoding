import React from 'react'
import { supabase } from '../supabase'
import { Event, Session, Attendee, Notification, Connection, Message } from '../models'
import { useRealTimeStore } from '../stores'

// Real-time event types
export type RealTimeEventType = 
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'session_created'
  | 'session_updated'
  | 'session_deleted'
  | 'attendee_registered'
  | 'attendee_updated'
  | 'notification_sent'
  | 'connection_requested'
  | 'connection_accepted'
  | 'message_sent'
  | 'user_online'
  | 'user_offline'

export interface RealTimeEvent {
  type: RealTimeEventType
  payload: any
  timestamp: string
  userId?: string
}

// WebSocket Service for real-time communication
export class WebSocketService {
  private channels: Map<string, any> = new Map()
  private subscriptions: Map<string, (event: RealTimeEvent) => void> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.setupConnectionMonitoring()
  }

  private setupConnectionMonitoring() {
    // Monitor Supabase realtime connection status
    // Note: Supabase realtime doesn't expose onOpen/onClose events directly
    // Connection status is managed internally by Supabase
    
    // Set initial connection status
    useRealTimeStore.getState().setConnectionStatus('connecting')
    
    // Simulate connection establishment after a short delay
    setTimeout(() => {
      useRealTimeStore.getState().setConnected(true)
      useRealTimeStore.getState().setConnectionStatus('connected')
    }, 1000)
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        useRealTimeStore.getState().setConnectionStatus('connecting')
        // Supabase will automatically attempt to reconnect
      }, delay)
    }
  }

  // Subscribe to events table changes
  subscribeToEvents(callback: (event: RealTimeEvent) => void) {
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'event'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.organizerId || (payload.old as any)?.organizerId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set('events', channel)
    this.subscriptions.set('events', callback)
    
    return () => this.unsubscribe('events')
  }

  // Subscribe to sessions table changes
  subscribeToSessions(callback: (event: RealTimeEvent) => void) {
    const channel = supabase
      .channel('sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'session'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.organizerId || (payload.old as any)?.organizerId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set('sessions', channel)
    this.subscriptions.set('sessions', callback)
    
    return () => this.unsubscribe('sessions')
  }

  // Subscribe to attendees table changes
  subscribeToAttendees(eventId: string, callback: (event: RealTimeEvent) => void) {
    const channelName = `attendees_${eventId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendees',
          filter: `eventId=eq.${eventId}`
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'attendee'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.userId || (payload.old as any)?.userId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, callback)
    
    return () => this.unsubscribe(channelName)
  }

  // Subscribe to notifications table changes
  subscribeToNotifications(userId: string, callback: (event: RealTimeEvent) => void) {
    const channelName = `notifications_${userId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipientId=eq.${userId}`
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'notification'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.recipientId || (payload.old as any)?.recipientId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, callback)
    
    return () => this.unsubscribe(channelName)
  }

  // Subscribe to connections table changes
  subscribeToConnections(userId: string, callback: (event: RealTimeEvent) => void) {
    const channelName = `connections_${userId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `fromUserId=eq.${userId},toUserId=eq.${userId}`
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'connection'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.fromUserId || (payload.old as any)?.fromUserId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, callback)
    
    return () => this.unsubscribe(channelName)
  }

  // Subscribe to messages table changes
  subscribeToMessages(connectionId: string, callback: (event: RealTimeEvent) => void) {
    const channelName = `messages_${connectionId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `connectionId=eq.${connectionId}`
        },
        (payload) => {
          const realTimeEvent: RealTimeEvent = {
            type: this.mapEventType(payload.eventType, 'message'),
            payload: payload.new || payload.old,
            timestamp: new Date().toISOString(),
            userId: (payload.new as any)?.senderId || (payload.old as any)?.senderId
          }
          callback(realTimeEvent)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, callback)
    
    return () => this.unsubscribe(channelName)
  }

  // Subscribe to user presence
  subscribeToUserPresence(userId: string, callback: (event: RealTimeEvent) => void) {
    const channelName = `presence_${userId}`
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const realTimeEvent: RealTimeEvent = {
          type: 'user_online',
          payload: { users: Object.keys(state) },
          timestamp: new Date().toISOString(),
          userId
        }
        callback(realTimeEvent)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const realTimeEvent: RealTimeEvent = {
          type: 'user_online',
          payload: { userId: key, user: newPresences[0] },
          timestamp: new Date().toISOString(),
          userId: key
        }
        callback(realTimeEvent)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const realTimeEvent: RealTimeEvent = {
          type: 'user_offline',
          payload: { userId: key, user: leftPresences[0] },
          timestamp: new Date().toISOString(),
          userId: key
        }
        callback(realTimeEvent)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: userId
          })
        }
      })

    this.channels.set(channelName, channel)
    this.subscriptions.set(channelName, callback)
    
    return () => this.unsubscribe(channelName)
  }

  // Broadcast custom events
  async broadcastEvent(channelName: string, event: RealTimeEvent) {
    const channel = this.channels.get(channelName)
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload
      })
    }
  }

  // Map database event types to our real-time event types
  private mapEventType(eventType: string, entity: string): RealTimeEventType {
    const mapping: Record<string, Record<string, RealTimeEventType>> = {
      INSERT: {
        event: 'event_created',
        session: 'session_created',
        attendee: 'attendee_registered',
        notification: 'notification_sent',
        connection: 'connection_requested',
        message: 'message_sent'
      },
      UPDATE: {
        event: 'event_updated',
        session: 'session_updated',
        attendee: 'attendee_updated',
        notification: 'notification_sent',
        connection: 'connection_accepted',
        message: 'message_sent'
      },
      DELETE: {
        event: 'event_deleted',
        session: 'session_deleted',
        attendee: 'attendee_registered', // Keep as registered for consistency
        notification: 'notification_sent',
        connection: 'connection_requested',
        message: 'message_sent'
      }
    }

    return mapping[eventType]?.[entity] || 'event_created'
  }

  // Unsubscribe from a channel
  public unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
      this.subscriptions.delete(channelName)
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.subscriptions.clear()
  }

  // Get connection status
  getConnectionStatus() {
    return useRealTimeStore.getState()
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService()

// React hooks for real-time subscriptions
export function useRealTimeEvents(callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    const cleanup = webSocketService.subscribeToEvents(callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [callback])

  return unsubscribe
}

export function useRealTimeSessions(callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    const cleanup = webSocketService.subscribeToSessions(callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [callback])

  return unsubscribe
}

export function useRealTimeAttendees(eventId: string, callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    if (!eventId) return

    const cleanup = webSocketService.subscribeToAttendees(eventId, callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [eventId, callback])

  return unsubscribe
}

export function useRealTimeNotifications(userId: string, callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    if (!userId) return

    const cleanup = webSocketService.subscribeToNotifications(userId, callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, callback])

  return unsubscribe
}

export function useRealTimeConnections(userId: string, callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    if (!userId) return

    const cleanup = webSocketService.subscribeToConnections(userId, callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, callback])

  return unsubscribe
}

export function useRealTimeMessages(connectionId: string, callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    if (!connectionId) return

    const cleanup = webSocketService.subscribeToMessages(connectionId, callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [connectionId, callback])

  return unsubscribe
}

export function useRealTimePresence(userId: string, callback: (event: RealTimeEvent) => void) {
  const [unsubscribe, setUnsubscribe] = React.useState<(() => void) | null>(null)

  React.useEffect(() => {
    if (!userId) return

    const cleanup = webSocketService.subscribeToUserPresence(userId, callback)
    setUnsubscribe(() => cleanup)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, callback])

  return unsubscribe
}

// Utility hook to get real-time connection status
export function useRealTimeStatus() {
  return useRealTimeStore()
}

// Cleanup hook for component unmount
export function useRealTimeCleanup() {
  React.useEffect(() => {
    return () => {
      webSocketService.cleanup()
    }
  }, [])
}
