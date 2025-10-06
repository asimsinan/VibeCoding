/**
 * Real-time Service
 * WebSocket management and real-time synchronization
 * 
 * @fileoverview Real-time service for WebSocket connections and live updates
 * @version 1.0.0
 */

import { supabase } from '@/lib/supabase/client'
import { RealtimeEvent, RealtimeEventType } from '@/contracts/types/domain'

export class RealtimeService {
  private static channels: Map<string, any> = new Map()
  private static eventHandlers: Map<string, Set<(event: RealtimeEvent) => void>> = new Map()
  private static connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected'
  private static reconnectAttempts: number = 0
  private static maxReconnectAttempts: number = 5
  private static reconnectDelay: number = 1000

  /**
   * Subscribe to whiteboard changes
   * FR-004: Real-time synchronization functionality
   */
  static async subscribeToWhiteboard(
    whiteboardId: string,
    onEvent: (event: RealtimeEvent) => void
  ): Promise<void> {
    const channelName = `whiteboard-${whiteboardId}`
    
    // Store event handler
    if (!this.eventHandlers.has(channelName)) {
      this.eventHandlers.set(channelName, new Set())
    }
    this.eventHandlers.get(channelName)!.add(onEvent)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return
      }
      
      try {
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'whiteboards',
              filter: `id=eq.${whiteboardId}`
            }, 
            (payload) => this.handleWhiteboardEvent(whiteboardId, payload)
          )
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'drawings',
              filter: `whiteboard_id=eq.${whiteboardId}`
            }, 
            (payload) => this.handleDrawingEvent(whiteboardId, payload)
          )
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'sticky_notes',
              filter: `whiteboard_id=eq.${whiteboardId}`
            }, 
            (payload) => this.handleStickyNoteEvent(whiteboardId, payload)
          )
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'users'
            }, 
            (payload) => this.handleUserEvent(whiteboardId, payload)
          )
          .subscribe()

        this.channels.set(channelName, channel)
      } catch (error) {
        console.error('❌ Error creating whiteboard subscription:', error)
      }
    }
  }

  /**
   * Unsubscribe from whiteboard changes
   * FR-004: Real-time synchronization cleanup
   */
  static async unsubscribeFromWhiteboard(whiteboardId: string): Promise<void> {
    const channelName = `whiteboard-${whiteboardId}`
    
    // Remove event handlers
    this.eventHandlers.delete(channelName)

    // Remove channel
    const channel = this.channels.get(channelName)
    if (channel && supabase) {
      await supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to user presence changes
   * FR-006: User presence functionality
   */
  static async subscribeToUserPresence(
    whiteboardId: string,
    onEvent: (event: RealtimeEvent) => void
  ): Promise<void> {
    const channelName = `presence-${whiteboardId}`
    
    // Store event handler
    if (!this.eventHandlers.has(channelName)) {
      this.eventHandlers.set(channelName, new Set())
    }
    this.eventHandlers.get(channelName)!.add(onEvent)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return
      }
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'users'
          }, 
          (payload) => this.handleUserPresenceEvent(whiteboardId, payload)
        )
        .subscribe()

      this.channels.set(channelName, channel)
    }
  }

  /**
   * Unsubscribe from user presence changes
   * FR-006: User presence cleanup
   */
  static async unsubscribeFromUserPresence(whiteboardId: string): Promise<void> {
    const channelName = `presence-${whiteboardId}`
    
    // Remove event handlers
    this.eventHandlers.delete(channelName)

    // Remove channel
    const channel = this.channels.get(channelName)
    if (channel && supabase) {
      await supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Broadcast drawing event
   * FR-004: Real-time drawing synchronization
   */
  static async broadcastDrawingEvent(
    whiteboardId: string,
    eventType: RealtimeEventType,
    data: any
  ): Promise<void> {
    const channelName = `whiteboard-${whiteboardId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'drawing-event',
        payload: {
          type: eventType,
          whiteboardId,
          data,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  /**
   * Broadcast sticky note event
   * FR-004: Real-time sticky note synchronization
   */
  static async broadcastStickyNoteEvent(
    whiteboardId: string,
    eventType: RealtimeEventType,
    data: any
  ): Promise<void> {
    const channelName = `whiteboard-${whiteboardId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'sticky-note-event',
        payload: {
          type: eventType,
          whiteboardId,
          data,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  /**
   * Broadcast user presence event
   * FR-006: Real-time user presence synchronization
   */
  static async broadcastUserPresenceEvent(
    whiteboardId: string,
    eventType: RealtimeEventType,
    data: any
  ): Promise<void> {
    const channelName = `presence-${whiteboardId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'user-presence-event',
        payload: {
          type: eventType,
          whiteboardId,
          data,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  /**
   * Handle whiteboard events
   */
  private static handleWhiteboardEvent(whiteboardId: string, payload: any): void {
    const event: RealtimeEvent = {
      type: this.mapEventType(payload.eventType),
      payload: payload.new || payload.old,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    this.notifyHandlers(`whiteboard-${whiteboardId}`, event)
  }

  /**
   * Handle drawing events
   */
  private static handleDrawingEvent(whiteboardId: string, payload: any): void {
    console.log('🔄 handleDrawingEvent called with payload:', payload)
    console.log('🔄 Payload details - eventType:', payload.eventType, 'new:', payload.new, 'old:', payload.old)
    
    // For DELETE events, use payload.old (contains the deleted record)
    // For INSERT/UPDATE events, use payload.new (contains the new/updated record)
    let eventPayload: any
    if (payload.eventType === 'DELETE') {
      eventPayload = payload.old || { id: payload.old?.id }
    } else {
      eventPayload = payload.new || payload.old
    }
    
    const event: RealtimeEvent = {
      type: this.mapEventType(payload.eventType),
      payload: eventPayload,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    console.log('🔄 Created drawing event:', event)
    // Use consistent channel name that matches subscription
    this.notifyHandlers(`drawings-${whiteboardId}`, event)
  }

  /**
   * Handle sticky note events
   */
  private static handleStickyNoteEvent(whiteboardId: string, payload: any): void {
    console.log('🔄 handleStickyNoteEvent called with payload:', payload)
    
    // For DELETE events, use payload.old (contains the deleted record)
    // For INSERT/UPDATE events, use payload.new (contains the new/updated record)
    let eventPayload: any
    if (payload.eventType === 'DELETE') {
      eventPayload = payload.old || { id: payload.old?.id }
    } else {
      eventPayload = payload.new || payload.old
    }
    
    const event: RealtimeEvent = {
      type: this.mapEventType(payload.eventType),
      payload: eventPayload,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    console.log('🔄 Created sticky note event:', event)
    // Use consistent channel name that matches subscription
    this.notifyHandlers(`sticky-notes-${whiteboardId}`, event)
  }

  /**
   * Handle user events
   */
  private static handleUserEvent(whiteboardId: string, payload: any): void {
    const event: RealtimeEvent = {
      type: this.mapEventType(payload.eventType),
      payload: payload.new || payload.old,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    this.notifyHandlers(`whiteboard-${whiteboardId}`, event)
  }

  /**
   * Handle shape events
   */
  private static handleShapeEvent(whiteboardId: string, payload: any): void {
    const event: RealtimeEvent = {
      type: 'shape',
      payload: payload.new || payload.old,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    this.notifyHandlers(`shapes-${whiteboardId}`, event)
  }

  /**
   * Handle user presence events
   */
  private static handleUserPresenceEvent(whiteboardId: string, payload: any): void {
    const event: RealtimeEvent = {
      type: 'user_presence',
      payload: payload.new,
      action: 'UPDATE',
      timestamp: new Date().toISOString()
    }

    this.notifyHandlers(`presence-${whiteboardId}`, event)
  }

  /**
   * Handle text events
   */
  private static handleTextEvent(whiteboardId: string, payload: any): void {
    const event: RealtimeEvent = {
      type: 'text',
      payload: payload.new || payload.old,
      action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR',
      timestamp: new Date().toISOString()
    }

    this.notifyHandlers(`texts-${whiteboardId}`, event)
  }

  /**
   * Map database event type to realtime event type
   */
  private static mapEventType(eventType: string): RealtimeEventType {
    switch (eventType) {
      case 'INSERT':
        return 'drawing'
      case 'UPDATE':
        return 'drawing'
      case 'DELETE':
        return 'drawing'
      default:
        return 'drawing'
    }
  }

  /**
   * Notify event handlers
   */
        private static notifyHandlers(channelName: string, event: RealtimeEvent): void {
          console.log(`🔄 notifyHandlers called for channel: ${channelName}`)
          console.log(`🔄 Available handler channels:`, Array.from(this.eventHandlers.keys()))
          console.log(`🔄 Event details:`, { type: event.type, action: event.action, payload: event.payload })
          console.log(`🔄 Event timestamp:`, new Date().toISOString())
          
          const handlers = this.eventHandlers.get(channelName)
          console.log(`🔄 Found ${handlers?.size || 0} handlers for channel: ${channelName}`)
          
          if (handlers && handlers.size > 0) {
            let handlerIndex = 0
            handlers.forEach((handler: (event: RealtimeEvent) => void) => {
              try {
                handlerIndex++
                console.log(`🔄 Calling handler ${handlerIndex}/${handlers.size} with event:`, event)
                if (typeof handler === 'function') {
                  handler(event)
                  console.log(`✅ Handler ${handlerIndex} executed successfully`)
                } else {
                  console.warn(`⚠️ Handler ${handlerIndex} is not a function:`, typeof handler)
                }
              } catch (error) {
                console.error(`❌ Error in realtime event handler ${handlerIndex}:`, error)
              }
            })
          } else {
            console.warn(`⚠️ No handlers found for channel: ${channelName}`)
            console.log(`🔄 All registered channels:`, Array.from(this.eventHandlers.keys()))
            console.log(`🔄 Channel name being searched:`, channelName)
            
            // Try to find similar channel names
            const similarChannels = Array.from(this.eventHandlers.keys()).filter(ch => 
              ch.includes(channelName.split('-')[0]) || channelName.includes(ch.split('-')[0])
            )
            if (similarChannels.length > 0) {
              console.log(`🔄 Similar channels found:`, similarChannels)
            }
            
            // Health check
            console.log(`🔄 Health check: ${this.getConnectionStatus()} (${this.channels.size} channels)`)
          }
        }

  /**
   * Clean up all subscriptions
   */
  static async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up realtime subscriptions...')
    
    try {
      const cleanupPromises = Array.from(this.channels.values()).map(async (channel) => {
        try {
          if (supabase) {
            await supabase.removeChannel(channel)
          }
        } catch (error) {
          console.warn('Warning: Error removing channel:', error)
        }
      })
      
      await Promise.all(cleanupPromises)
      this.channels.clear()
      this.eventHandlers.clear()
      
      console.log('✅ Realtime cleanup completed')
    } catch (error) {
      console.error('❌ Error during realtime cleanup:', error)
      // Force clear even if cleanup failed
      this.channels.clear()
      this.eventHandlers.clear()
    }
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus
  }

  /**
   * Set connection status
   */
  private static setConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.connectionStatus = status
    console.log(`🔄 Realtime connection status: ${status}`)
  }

  /**
   * Handle connection errors and reconnection
   */
  private static async handleConnectionError(error: any): Promise<void> {
    console.error('❌ Realtime connection error:', error)
    this.setConnectionStatus('disconnected')
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(async () => {
        await this.reconnect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.')
    }
  }

  /**
   * Reconnect to realtime service
   */
  static async reconnect(): Promise<void> {
    try {
      this.setConnectionStatus('connecting')
      
      // Clean up existing channels
      await this.cleanup()
      
      // Recreate channels based on handler channel names
      const eventHandlersArray = Array.from(this.eventHandlers.entries())
      for (const [handlerChannelName, handlers] of eventHandlersArray) {
        const whiteboardId = handlerChannelName.replace(/^(drawings|sticky-notes|shapes|texts|users)-/, '')
        const channelType = handlerChannelName.split('-')[0]
        const firstHandler = Array.from(handlers)[0]
        
        if (firstHandler) {
          console.log(`🔄 Reconnecting ${channelType} subscription for whiteboard: ${whiteboardId}`)
          
          switch (channelType) {
            case 'drawings':
              this.subscribeToDrawings(whiteboardId, firstHandler)
              break
            case 'sticky-notes':
              this.subscribeToStickyNotes(whiteboardId, firstHandler)
              break
            case 'shapes':
              this.subscribeToShapes(whiteboardId, firstHandler)
              break
            case 'texts':
              this.subscribeToTexts(whiteboardId, firstHandler)
              break
            case 'users':
              this.subscribeToUsers(whiteboardId)
              break
            default:
              console.warn(`Unknown channel type: ${channelType}`)
          }
        }
      }
      
      this.setConnectionStatus('connected')
      this.reconnectAttempts = 0
      console.log('✅ Realtime reconnection successful')
    } catch (error) {
      console.error('❌ Realtime reconnection failed:', error)
      await this.handleConnectionError(error)
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return RealtimeService.getConnectionStatus() === 'connected'
  }

  /**
   * Subscribe to drawings with robust error handling
   */
  static subscribeToDrawings(whiteboardId: string, onEvent?: (event: any) => void): () => void {
    console.log('🔄 RealtimeService: subscribeToDrawings called for whiteboard:', whiteboardId)
    console.log('🔄 RealtimeService: onEvent provided:', !!onEvent)
    
    // Use consistent channel name for handlers
    const handlerChannelName = `drawings-${whiteboardId}`
    // Create unique channel name for Supabase to prevent conflicts
    const channelName = `drawings-${whiteboardId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Store event handler if provided
    if (onEvent) {
      if (!this.eventHandlers.has(handlerChannelName)) {
        this.eventHandlers.set(handlerChannelName, new Set())
      }
      this.eventHandlers.get(handlerChannelName)!.add(onEvent)
      console.log(`✅ RealtimeService: Registered handler for channel: ${handlerChannelName}`)
      console.log(`✅ RealtimeService: Total handlers for this channel: ${this.eventHandlers.get(handlerChannelName)!.size}`)
      console.log(`✅ RealtimeService: All handler channels:`, Array.from(this.eventHandlers.keys()))
    } else {
      console.log(`⚠️ RealtimeService: No event handler provided for channel: ${handlerChannelName}`)
    }
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.log('Channel already exists, returning existing unsubscribe function')
      return () => {
        console.log('Unsubscribing from drawings (existing channel)')
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }
    
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return () => {}
    }
    
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Authentication status:', session ? 'Authenticated' : 'Not authenticated')
      if (session) {
        console.log('👤 User ID:', session.user.id)
      }
    })
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'drawings'
          }, 
          (payload) => {
            console.log('🔄 Drawing change received:', payload)
            // Filter manually in the handler to work around Supabase DELETE filter limitation
            const isRelevantEvent = 
              payload.eventType === 'DELETE' || 
              ((payload.new as any)?.whiteboard_id === whiteboardId) ||
              ((payload.old as any)?.whiteboard_id === whiteboardId)
            
            if (isRelevantEvent) {
              this.handleDrawingEvent(whiteboardId, payload)
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Drawing subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.setConnectionStatus('connected')
            console.log('✅ Drawing subscription successful')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Drawing subscription error:', err)
            this.setConnectionStatus('disconnected')
            // Attempt to reconnect after a delay
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect drawing subscription...')
              this.reconnect()
            }, 2000)
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Drawing subscription timed out')
            this.setConnectionStatus('disconnected')
            // Attempt to reconnect
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect after timeout...')
              this.reconnect()
            }, 1000)
          } else if (status === 'CLOSED') {
            console.log('🔒 Drawing subscription closed')
            this.setConnectionStatus('disconnected')
          }
        })
      
      this.channels.set(channelName, channel)
      
      return () => {
        console.log('Unsubscribing from drawings')
        if (onEvent) {
          const handlers = this.eventHandlers.get(handlerChannelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(handlerChannelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    } catch (error) {
      console.error('❌ Error creating drawings subscription:', error)
      return () => {}
    }
  }

  /**
   * Subscribe to sticky notes
   */
  static subscribeToStickyNotes(whiteboardId: string, onEvent?: (event: any) => void): () => void {
    console.log('🔄 RealtimeService: Subscribing to sticky notes for whiteboard:', whiteboardId)
    console.log('🔄 RealtimeService: onEvent provided:', !!onEvent)
    
    // Use consistent channel name for handlers
    const handlerChannelName = `sticky-notes-${whiteboardId}`
    // Create unique channel name for Supabase to prevent conflicts
    const channelName = `sticky-notes-${whiteboardId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🔄 RealtimeService: Handler channel name:', handlerChannelName)
    console.log('🔄 RealtimeService: Supabase channel name:', channelName)
    
    // Store event handler if provided
    if (onEvent) {
      if (!this.eventHandlers.has(handlerChannelName)) {
        this.eventHandlers.set(handlerChannelName, new Set())
        console.log('🔄 RealtimeService: Created new handler set for:', handlerChannelName)
      }
      this.eventHandlers.get(handlerChannelName)!.add(onEvent)
      console.log('🔄 RealtimeService: Added event handler. Total handlers for', handlerChannelName, ':', this.eventHandlers.get(handlerChannelName)!.size)
    }
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.log('Channel already exists, returning existing unsubscribe function')
      return () => {
        console.log('Unsubscribing from sticky notes (existing channel)')
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }
    
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return () => {}
    }
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sticky_notes'
          }, 
          (payload) => {
            console.log('Sticky note real-time event:', payload)
            // Filter manually in the handler to work around Supabase DELETE filter limitation
            const isRelevantEvent = 
              payload.eventType === 'DELETE' || 
              ((payload.new as any)?.whiteboard_id === whiteboardId) ||
              ((payload.old as any)?.whiteboard_id === whiteboardId)
            
            if (isRelevantEvent) {
              this.handleStickyNoteEvent(whiteboardId, payload)
            }
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
      console.log('🔄 RealtimeService: Sticky notes channel created and stored:', channelName)
      console.log('🔄 RealtimeService: Total channels:', this.channels.size)
      console.log('🔄 RealtimeService: Total event handlers:', this.eventHandlers.size)
      
      return () => {
        console.log('🔄 RealtimeService: Unsubscribing from sticky notes')
        if (onEvent) {
          const handlers = this.eventHandlers.get(handlerChannelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(handlerChannelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    } catch (error) {
      console.error('❌ Error creating sticky notes subscription:', error)
      return () => {}
    }
  }

  /**
   * Subscribe to shapes
   */
  static subscribeToShapes(whiteboardId: string, onEvent?: (event: RealtimeEvent) => void): () => void {
    console.log('Subscribing to shapes for whiteboard:', whiteboardId)
    
    const channelName = `shapes-${whiteboardId}`
    
    // Store event handler if provided
    if (onEvent) {
      if (!this.eventHandlers.has(channelName)) {
        this.eventHandlers.set(channelName, new Set())
      }
      this.eventHandlers.get(channelName)!.add(onEvent)
    }
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.log('Channel already exists, returning existing unsubscribe function')
      return () => {
        console.log('Unsubscribing from shapes (existing channel)')
        if (onEvent) {
          const handlers = this.eventHandlers.get(channelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(channelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }
    
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return () => {}
    }
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'shapes',
            filter: `whiteboard_id=eq.${whiteboardId}`
          }, 
          (payload) => {
            console.log('🔄 Shape change received:', payload)
            this.handleShapeEvent(whiteboardId, payload)
          }
        )
        .subscribe((status) => {
          console.log('📡 Shape subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            this.setConnectionStatus('disconnected')
          }
        })

      this.channels.set(channelName, channel)
      
      return () => {
        console.log('Unsubscribing from shapes')
        if (onEvent) {
          const handlers = this.eventHandlers.get(channelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(channelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    } catch (error) {
      console.error('❌ Error creating shapes subscription:', error)
      return () => {}
    }
  }

  /**
   * Subscribe to texts
   */
  static subscribeToTexts(whiteboardId: string, onEvent?: (event: RealtimeEvent) => void): () => void {
    console.log('Subscribing to texts for whiteboard:', whiteboardId)
    
    const channelName = `texts-${whiteboardId}`
    
    // Store event handler if provided
    if (onEvent) {
      if (!this.eventHandlers.has(channelName)) {
        this.eventHandlers.set(channelName, new Set())
      }
      this.eventHandlers.get(channelName)!.add(onEvent)
    }
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.log('Channel already exists, returning existing unsubscribe function')
      return () => {
        console.log('Unsubscribing from texts (existing channel)')
        if (onEvent) {
          const handlers = this.eventHandlers.get(channelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(channelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }
    
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return () => {}
    }
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'text_objects',
            filter: `whiteboard_id=eq.${whiteboardId}`
          }, 
          (payload) => {
            console.log('🔄 Text change received:', payload)
            this.handleTextEvent(whiteboardId, payload)
          }
        )
        .subscribe((status) => {
          console.log('📡 Text subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            this.setConnectionStatus('disconnected')
          }
        })

      this.channels.set(channelName, channel)
      
      return () => {
        console.log('Unsubscribing from texts')
        if (onEvent) {
          const handlers = this.eventHandlers.get(channelName)
          if (handlers) {
            handlers.delete(onEvent)
            if (handlers.size === 0) {
              this.eventHandlers.delete(channelName)
            }
          }
        }
        const channel = this.channels.get(channelName)
        if (channel && supabase) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    } catch (error) {
      console.error('❌ Error creating texts subscription:', error)
      return () => {}
    }
  }

  /**
   * Subscribe to users
   */
  static subscribeToUsers(whiteboardId: string): () => void {
    // Mock implementation - return empty unsubscribe function
    console.log('Subscribing to users for whiteboard:', whiteboardId)
    return () => console.log('Unsubscribed from users')
  }

  /**
   * Subscribe to drawings (instance method)
   */
  subscribeToDrawings(whiteboardId: string): () => void {
    return RealtimeService.subscribeToDrawings(whiteboardId)
  }

  /**
   * Subscribe to sticky notes (instance method)
   */
  subscribeToStickyNotes(whiteboardId: string): () => void {
    return RealtimeService.subscribeToStickyNotes(whiteboardId)
  }

  /**
   * Subscribe to shapes (instance method)
   */
  subscribeToShapes(whiteboardId: string): () => void {
    return RealtimeService.subscribeToShapes(whiteboardId)
  }

  /**
   * Subscribe to texts (instance method)
   */
  subscribeToTexts(whiteboardId: string): () => void {
    return RealtimeService.subscribeToTexts(whiteboardId)
  }

  /**
   * Subscribe to users (instance method)
   */
  subscribeToUsers(whiteboardId: string): () => void {
    return RealtimeService.subscribeToUsers(whiteboardId)
  }

  /**
   * Check connection health
   */
  static async checkConnectionHealth(): Promise<boolean> {
    try {
      if (!supabase) {
        this.setConnectionStatus('disconnected')
        return false
      }
      
      // Check if we have active channels
      const channels = supabase.realtime.getChannels()
      const hasActiveChannels = channels.length > 0
      
      // Simple health check - if we have channels, consider it healthy
      const isHealthy = hasActiveChannels
      this.setConnectionStatus(isHealthy ? 'connected' : 'disconnected')
      
      console.log(`🔍 Health check: ${isHealthy ? 'healthy' : 'unhealthy'} (${channels.length} channels)`)
      return isHealthy
    } catch (error) {
      console.error('❌ Connection health check failed:', error)
      this.setConnectionStatus('disconnected')
      return false
    }
  }

  /**
   * Initialize connection monitoring with enhanced reliability
   */
  static initializeConnectionMonitoring(): void {
    console.log('🔄 Initializing enhanced connection monitoring...')
    
    // Check connection health every 15 seconds (more frequent)
    setInterval(async () => {
      const isHealthy = await this.checkConnectionHealth()
      if (!isHealthy && this.connectionStatus !== 'connecting') {
        console.log('🔄 Connection unhealthy, attempting reconnection...')
        await this.reconnect()
      }
    }, 15000)
    
    // Monitor for network changes
    window.addEventListener('online', () => {
      console.log('🌐 Network came online, checking real-time connection...')
      setTimeout(() => {
        this.checkConnectionHealth().then(isHealthy => {
          if (!isHealthy) {
            console.log('🔄 Network online but connection unhealthy, reconnecting...')
            this.reconnect()
          }
        })
      }, 1000)
    })
    
    window.addEventListener('offline', () => {
      console.log('🌐 Network went offline')
      this.setConnectionStatus('disconnected')
    })
    
    // Set initial connection status
    this.setConnectionStatus('connected')
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService()
export default realtimeService
