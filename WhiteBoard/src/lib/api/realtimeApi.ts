/**
 * Real-time API Service
 * 
 * Real-time API integration for collaborative features.
 * Handles WebSocket connections, real-time subscriptions, and live updates.
 * 
 * @fileoverview Real-time API service with WebSocket management
 * @version 1.0.0
 */

import { supabase } from '@/lib/supabase/client'
import { Drawing } from '../whiteboard/models/Drawing'
import { StickyNote } from '../whiteboard/models/StickyNote'
import { User } from '../whiteboard/models/User'

// Real-time Event Types
export interface RealtimeEvent<T = any> {
  type: string
  data: T
  timestamp: string
  userId: string
  whiteboardId: string
}

export interface DrawingEvent extends RealtimeEvent<Drawing> {
  type: 'DRAWING_CREATED' | 'DRAWING_UPDATED' | 'DRAWING_DELETED'
}

export interface StickyNoteEvent extends RealtimeEvent<StickyNote> {
  type: 'STICKY_NOTE_CREATED' | 'STICKY_NOTE_UPDATED' | 'STICKY_NOTE_DELETED'
}

export interface UserEvent extends RealtimeEvent<User> {
  type: 'USER_JOINED' | 'USER_LEFT' | 'USER_PRESENCE_UPDATED'
}

export interface WhiteboardEvent extends RealtimeEvent {
  type: 'WHITEBOARD_CLEARED' | 'WHITEBOARD_UPDATED'
}

export type AnyRealtimeEvent = DrawingEvent | StickyNoteEvent | UserEvent | WhiteboardEvent

// Event Handlers
export type EventHandler<T = any> = (event: RealtimeEvent<T>) => void

// Subscription Management
interface Subscription {
  channel: any
  eventType: string
  handler: EventHandler
  isActive: boolean
}

/**
 * Real-time API Service Class
 */
export class RealtimeApiService {
  private supabase: any
  private subscriptions: Map<string, Subscription> = new Map()
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  constructor() {
    this.supabase = supabase
    this.setupConnectionHandlers()
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    // Monitor connection status
    this.supabase.realtime.onOpen(() => {
      console.log('Real-time connection opened')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.supabase.realtime.onClose(() => {
      console.log('Real-time connection closed')
      this.isConnected = false
      this.handleReconnection()
    })

    this.supabase.realtime.onError((error: any) => {
      console.error('Real-time connection error:', error)
      this.isConnected = false
      this.handleReconnection()
    })
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.reconnect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  /**
   * Reconnect to real-time service
   */
  private async reconnect(): Promise<void> {
    try {
      await this.supabase.realtime.connect()
    } catch (error) {
      console.error('Reconnection failed:', error)
    }
  }

  /**
   * Subscribe to whiteboard events
   */
  async subscribeToWhiteboard(
    whiteboardId: string,
    handlers: {
      onDrawingEvent?: EventHandler<Drawing>
      onStickyNoteEvent?: EventHandler<StickyNote>
      onUserEvent?: EventHandler<User>
      onWhiteboardEvent?: EventHandler
    }
  ): Promise<void> {
    try {
      // Subscribe to drawings table
      if (handlers.onDrawingEvent) {
        const drawingsChannel = this.supabase
          .channel(`whiteboard-${whiteboardId}-drawings`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'drawings',
              filter: `whiteboard_id=eq.${whiteboardId}`
            },
            (payload: any) => {
              const event: DrawingEvent = {
                type: this.getEventType(payload.eventType, 'DRAWING') as DrawingEvent['type'],
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                userId: payload.new?.user_id || payload.old?.user_id,
                whiteboardId
              }
              handlers.onDrawingEvent!(event)
            }
          )
          .subscribe()

        this.subscriptions.set(`drawings-${whiteboardId}`, {
          channel: drawingsChannel,
          eventType: 'drawings',
          handler: handlers.onDrawingEvent,
          isActive: true
        })
      }

      // Subscribe to sticky_notes table
      if (handlers.onStickyNoteEvent) {
        const stickyNotesChannel = this.supabase
          .channel(`whiteboard-${whiteboardId}-sticky-notes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sticky_notes',
              filter: `whiteboard_id=eq.${whiteboardId}`
            },
            (payload: any) => {
              const event: StickyNoteEvent = {
                type: this.getEventType(payload.eventType, 'STICKY_NOTE') as StickyNoteEvent['type'],
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                userId: payload.new?.user_id || payload.old?.user_id,
                whiteboardId
              }
              handlers.onStickyNoteEvent!(event)
            }
          )
          .subscribe()

        this.subscriptions.set(`sticky-notes-${whiteboardId}`, {
          channel: stickyNotesChannel,
          eventType: 'sticky_notes',
          handler: handlers.onStickyNoteEvent,
          isActive: true
        })
      }

      // Subscribe to users table
      if (handlers.onUserEvent) {
        const usersChannel = this.supabase
          .channel(`whiteboard-${whiteboardId}-users`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `whiteboard_id=eq.${whiteboardId}`
            },
            (payload: any) => {
              const event: UserEvent = {
                type: this.getEventType(payload.eventType, 'USER') as UserEvent['type'],
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                userId: payload.new?.id || payload.old?.id,
                whiteboardId
              }
              handlers.onUserEvent!(event)
            }
          )
          .subscribe()

        this.subscriptions.set(`users-${whiteboardId}`, {
          channel: usersChannel,
          eventType: 'users',
          handler: handlers.onUserEvent,
          isActive: true
        })
      }

      // Subscribe to whiteboard table
      if (handlers.onWhiteboardEvent) {
        const whiteboardChannel = this.supabase
          .channel(`whiteboard-${whiteboardId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'whiteboards',
              filter: `id=eq.${whiteboardId}`
            },
            (payload: any) => {
              const event: WhiteboardEvent = {
                type: this.getEventType(payload.eventType, 'WHITEBOARD') as WhiteboardEvent['type'],
                data: payload.new || payload.old,
                timestamp: new Date().toISOString(),
                userId: payload.new?.user_id || payload.old?.user_id || 'system',
                whiteboardId
              }
              handlers.onWhiteboardEvent!(event)
            }
          )
          .subscribe()

        this.subscriptions.set(`whiteboard-${whiteboardId}`, {
          channel: whiteboardChannel,
          eventType: 'whiteboard',
          handler: handlers.onWhiteboardEvent,
          isActive: true
        })
      }

      console.log(`Subscribed to whiteboard ${whiteboardId} events`)
    } catch (error) {
      console.error('Failed to subscribe to whiteboard events:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from whiteboard events
   */
  async unsubscribeFromWhiteboard(whiteboardId: string): Promise<void> {
    const subscriptionKeys = [
      `drawings-${whiteboardId}`,
      `sticky-notes-${whiteboardId}`,
      `users-${whiteboardId}`,
      `whiteboard-${whiteboardId}`
    ]

    for (const key of subscriptionKeys) {
      const subscription = this.subscriptions.get(key)
      if (subscription && subscription.isActive) {
        try {
          await this.supabase.removeChannel(subscription.channel)
          subscription.isActive = false
          this.subscriptions.delete(key)
        } catch (error) {
          console.error(`Failed to unsubscribe from ${key}:`, error)
        }
      }
    }

    console.log(`Unsubscribed from whiteboard ${whiteboardId} events`)
  }

  /**
   * Broadcast drawing event
   */
  async broadcastDrawingEvent(whiteboardId: string, drawing: Drawing): Promise<void> {
    try {
      const channel = this.supabase.channel(`whiteboard-${whiteboardId}-broadcast`)
      await channel.send({
        type: 'broadcast',
        event: 'drawing_updated',
        payload: {
          drawing,
          timestamp: new Date().toISOString(),
          whiteboardId
        }
      })
    } catch (error) {
      console.error('Failed to broadcast drawing event:', error)
    }
  }

  /**
   * Broadcast sticky note event
   */
  async broadcastStickyNoteEvent(whiteboardId: string, stickyNote: StickyNote): Promise<void> {
    try {
      const channel = this.supabase.channel(`whiteboard-${whiteboardId}-broadcast`)
      await channel.send({
        type: 'broadcast',
        event: 'sticky_note_updated',
        payload: {
          stickyNote,
          timestamp: new Date().toISOString(),
          whiteboardId
        }
      })
    } catch (error) {
      console.error('Failed to broadcast sticky note event:', error)
    }
  }

  /**
   * Broadcast user presence event
   */
  async broadcastUserPresenceEvent(whiteboardId: string, user: User): Promise<void> {
    try {
      const channel = this.supabase.channel(`whiteboard-${whiteboardId}-broadcast`)
      await channel.send({
        type: 'broadcast',
        event: 'user_presence_updated',
        payload: {
          user,
          timestamp: new Date().toISOString(),
          whiteboardId
        }
      })
    } catch (error) {
      console.error('Failed to broadcast user presence event:', error)
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive).length
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    this.subscriptions.forEach(async (subscription, key) => {
      if (subscription.isActive) {
        try {
          await this.supabase.removeChannel(subscription.channel)
          subscription.isActive = false
        } catch (error) {
          console.error(`Failed to cleanup subscription ${key}:`, error)
        }
      }
    })
    this.subscriptions.clear()
    console.log('Cleaned up all real-time subscriptions')
  }

  /**
   * Convert database event type to application event type
   */
  private getEventType(dbEventType: string, entityType: string): string {
    const eventMap: Record<string, Record<string, string>> = {
      'INSERT': {
        'DRAWING': 'DRAWING_CREATED',
        'STICKY_NOTE': 'STICKY_NOTE_CREATED',
        'USER': 'USER_JOINED',
        'WHITEBOARD': 'WHITEBOARD_UPDATED'
      },
      'UPDATE': {
        'DRAWING': 'DRAWING_UPDATED',
        'STICKY_NOTE': 'STICKY_NOTE_UPDATED',
        'USER': 'USER_PRESENCE_UPDATED',
        'WHITEBOARD': 'WHITEBOARD_UPDATED'
      },
      'DELETE': {
        'DRAWING': 'DRAWING_DELETED',
        'STICKY_NOTE': 'STICKY_NOTE_DELETED',
        'USER': 'USER_LEFT',
        'WHITEBOARD': 'WHITEBOARD_UPDATED'
      }
    }

    return eventMap[dbEventType]?.[entityType] || `${entityType}_UPDATED`
  }
}

// Singleton instance
export const realtimeApi = new RealtimeApiService()

// Types are already exported via interface declarations above
