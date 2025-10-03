'use client'

import React, { useState, useEffect, useRef } from 'react'
// import { useRealTimeEventUpdates } from '@/lib/hooks/useRealTime'
import { connectionTracker } from '@/lib/services/ConnectionTracker';
import { eventMessageService, EventMessage } from '@/lib/services/EventMessageService';
import { ServerPresenceTracker } from '@/lib/services/ServerPresenceTracker';
import { UserDisplayService } from '@/lib/services/UserDisplayService';
import { Event } from '@/lib/models';

interface RealTimeEventUpdatesProps {
  eventId: string
  onEventUpdate?: (event: Event) => void
  onSessionUpdate?: (sessionId: string) => void
  onAttendeeUpdate?: (attendeeId: string) => void
}

export const RealTimeEventUpdates: React.FC<RealTimeEventUpdatesProps> = ({
  eventId,
  onEventUpdate,
  onSessionUpdate,
  onAttendeeUpdate
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  // useRealTimeEventUpdates(eventId)

  useEffect(() => {
    const handleEventUpdate = (event: any) => {
      setLastUpdate(new Date())
      setUpdateCount(prev => prev + 1)

      switch (event.type) {
        case 'event_updated':
          if (onEventUpdate && event.payload) {
            onEventUpdate(event.payload)
          }
          break
        case 'session_created':
        case 'session_updated':
        case 'session_deleted':
          if (onSessionUpdate && event.payload?.id) {
            onSessionUpdate(event.payload.id)
          }
          break
        case 'attendee_registered':
        case 'attendee_updated':
          if (onAttendeeUpdate && event.payload?.id) {
            onAttendeeUpdate(event.payload.id)
          }
          break
      }
    }

    // This would be connected to the real-time service
    // For now, we'll simulate updates
    const interval = setInterval(() => {
      // Simulate periodic updates
      if (Math.random() > 0.8) {
        handleEventUpdate({
          type: 'event_updated',
          payload: { id: eventId, lastModified: new Date().toISOString() }
        })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [eventId, onEventUpdate, onSessionUpdate, onAttendeeUpdate])

  return (
    <div className="text-xs text-gray-500">
      {lastUpdate && (
        <div>
          Last updated: {lastUpdate.toLocaleTimeString()}
          {updateCount > 0 && (
            <span className="ml-2">
              ({updateCount} updates)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Live attendee counter component
interface LiveAttendeeCounterProps {
  eventId: string
  initialCount: number
}

export const LiveAttendeeCounter: React.FC<LiveAttendeeCounterProps> = ({
  eventId,
  initialCount
}) => {
  const [count, setCount] = useState(initialCount)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Fetch real attendee count periodically
    const fetchRealCount = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        
        const { count: realCount } = await supabase
          .from('attendees')
          .select('id', { count: 'exact' })
          .eq('event_id', eventId)
        
        if (realCount !== null && realCount !== count) {
          setCount(realCount)
          setIsLive(true)
          setTimeout(() => setIsLive(false), 2000)
        }
      } catch (error) {
      }
    }

    // Fetch immediately
    fetchRealCount()
    
    // Then fetch every 10 seconds
    const interval = setInterval(fetchRealCount, 10000)

    return () => clearInterval(interval)
  }, [eventId, count])

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">
        {count} attendees
      </span>
      {isLive && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-500">LIVE</span>
        </div>
      )}
    </div>
  )
}

// Real-time chat component
interface RealTimeChatProps {
  eventId: string
  userId: string
}

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
  eventId,
  userId
}) => {
  const [messages, setMessages] = useState<EventMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load existing messages and set up real-time chat
    const setupChat = async (retryCount = 0) => {
      try {
        // Start server-side presence tracking
        ServerPresenceTracker.startTracking(eventId, userId)
        
        // Load existing messages from database
        const existingMessages = await eventMessageService.getEventMessages(eventId, 50)
        setMessages(existingMessages)
        setIsLoading(false)

        const { supabase } = await import('@/lib/supabase')
        
        // Check if Supabase client is properly initialized
        console.log('Supabase client:', supabase)
        console.log('Event ID:', eventId)
        
        // Test basic Supabase connection
        try {
          const { data, error } = await supabase.from('events').select('id').limit(1)
          if (error) {
            console.log('Supabase connection test failed:', error)
            setConnectionError(`Database connection failed: ${error.message}`)
          } else {
            console.log('Supabase connection test successful')
          }
        } catch (err) {
          console.log('Supabase connection test error:', err)
          setConnectionError('Failed to connect to Supabase - check CORS settings')
        }
        
        // Subscribe to chat channel for this event
        const channel = supabase.channel(`event-chat-${eventId}`)
        console.log('Channel created:', channel)
        
        channel
          .on('broadcast', { event: 'chat-message' }, (payload) => {
            const { message, userId: senderId, userName, timestamp } = payload
            
            // Don't add duplicate messages (messages sent by current user)
            if (senderId === userId) {
              return
            }
            
            // Determine display name - use the userName from payload if available
            let displayName = 'Unknown User'
            
            if (userName && userName !== 'You' && userName.trim() !== '') {
              displayName = userName
            } else if (senderId) {
              displayName = `User ${senderId.slice(0, 8)}`
            }
            
            
            // Add message to local state
            const messageId = `${senderId || 'unknown'}-${timestamp || Date.now()}`
            const newMessage: EventMessage = {
              id: messageId,
              eventId,
              userId: senderId,
              message,
              userName: displayName,
              metadata: {},
              createdAt: timestamp || new Date().toISOString(),
              updatedAt: timestamp || new Date().toISOString()
            }
            setMessages(prev => [...prev, newMessage])
            
            // Always try to get proper display name for the sender
            if (senderId && (displayName === 'Unknown User' || displayName.startsWith('User '))) {
              // Try to get display name if we're using a fallback
              UserDisplayService.getUserDisplayInfo(senderId)
                .then(senderDisplayInfo => {
                  // Update the message in the state with the proper name
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                      ? { ...msg, userName: senderDisplayInfo.displayName }
                      : msg
                  ))
                })
                .catch(error => {
                  // If we can't get the display name, try auth metadata as fallback
                  if (senderId) {
                    import('@/lib/supabase').then(({ supabase }) => {
                      return supabase.auth.getUser()
                    }).then(({ data: authUser }) => {
                      if (authUser?.user?.id === senderId) {
                        const authName = authUser.user?.user_metadata?.full_name || 
                                       authUser.user?.email?.split('@')[0] || 
                                       `User ${senderId.slice(0, 8)}`
                        setMessages(prev => prev.map(msg => 
                          msg.id === messageId 
                            ? { ...msg, userName: authName }
                            : msg
                        ))
                      }
                    }).catch(() => {
                      // Keep the original fallback name
                    })
                  }
                })
            }
          })
          .on('broadcast', { event: 'typing' }, (payload) => {
            // Handle typing indicators if needed
          })
          .subscribe((status) => {
            console.log('Supabase channel status:', status)
            setIsConnected(status === 'SUBSCRIBED')
            if (status === 'SUBSCRIBED') {
              setConnectionError(null)
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionError('Channel connection failed')
            } else if (status === 'TIMED_OUT') {
              setConnectionError('Connection timed out')
            } else if (status === 'CLOSED') {
              setConnectionError('Connection closed')
            } else {
              setConnectionError(`Connection status: ${status}`)
            }
          })

        // Add a timeout to detect if subscription never completes
        setTimeout(() => {
          if (!isConnected) {
            console.log('Connection timeout - still not connected after 5 seconds')
            setConnectionError('Connection timeout - check Supabase CORS and real-time settings')
          }
        }, 5000)

        // Cleanup on unmount
        return () => {
          channel.unsubscribe()
          // Stop presence tracking when leaving
          ServerPresenceTracker.stopTracking(eventId, userId)
        }
      } catch (error) {
        setConnectionError('Failed to setup chat connection')
        setIsConnected(false)
        
        // Retry connection after a delay
        if (retryCount < 3) {
          setTimeout(() => {
            setupChat(retryCount + 1)
          }, 2000 * (retryCount + 1)) // Exponential backoff
        }
      }
    }

    setupChat()

    // Set up periodic presence updates
    const presenceInterval = setInterval(() => {
      // ServerPresenceTracker handles its own heartbeat
    }, 60000) // Update every minute

    // Cleanup interval on unmount
    return () => {
      clearInterval(presenceInterval)
    }
  }, [eventId, userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageText = newMessage.trim()
    const timestamp = new Date().toISOString()
    
    // Get proper display name for the user with fallback
    let userName = 'You'
    try {
      const userDisplayInfo = await UserDisplayService.getUserDisplayInfo(userId)
      userName = userDisplayInfo.displayName || 'You'
      
      // If we got a fallback name, try to get a better one from auth metadata
      if (userName === 'You' || userName.startsWith('User ')) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user?.id === userId) {
            const authName = authUser.user.user_metadata?.full_name || 
                           authUser.user.email?.split('@')[0] || 
                           'User'
            userName = authName
          }
        } catch (authError) {
          // Keep the fallback name
        }
      }
    } catch (error) {
      // If we can't get the display name, use a fallback
      userName = 'You'
    }

    try {
      // Save message to database first
      const savedMessage = await eventMessageService.saveMessage({
        eventId,
        userId,
        message: messageText,
        userName
      })
      

      // Add message to local state immediately for better UX
          setMessages(prev => [...prev, savedMessage])
          setNewMessage('')
          setIsTyping(false)
          
          // Auto-scroll to bottom after sending message
          setTimeout(scrollToBottom, 100)

      // Update connection tracker (user is actively participating)
      connectionTracker.updateLastSeen(userId, eventId)
      
      // Send message via Supabase Realtime broadcast
      const { supabase } = await import('@/lib/supabase')
      const channel = supabase.channel(`event-chat-${eventId}`)
      
      await channel.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: {
          message: messageText,
          userId,
          userName,
          timestamp
        }
      })

    } catch (error) {
      // Still add to local state even if database save fails
      const fallbackMessage: EventMessage = {
        id: `${userId}-${Date.now()}`,
        eventId,
        userId,
        message: messageText,
        userName: 'You',
        metadata: {},
        createdAt: timestamp,
        updatedAt: timestamp
      }
      setMessages(prev => [...prev, fallbackMessage])
      setNewMessage('')
      setIsTyping(false)
      
      // Auto-scroll to bottom after sending fallback message
      setTimeout(scrollToBottom, 100)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  return (
    <div className="border rounded-lg p-4 h-64 flex flex-col">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b">
        <h4 className="text-sm font-medium text-gray-700">Event Chat</h4>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : connectionError || 'Disconnected'}
          </span>
          {!isConnected && (
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg ${
                message.userId === userId 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <div className="text-sm">{message.message}</div>
                <div className="text-xs opacity-75 mt-1">
                  {message.userName} • {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {/* Scroll target for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
      
      {isTyping && (
        <div className="text-xs text-gray-500 mt-1">
          Typing...
        </div>
      )}
    </div>
  )
}
