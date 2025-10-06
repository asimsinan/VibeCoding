'use client'

import { useCallback, useEffect, useRef } from 'react'
import { RealtimeService } from '../services/realtimeService'
// import { Drawing } from '../models/Drawing' // Unused import
// import { StickyNote } from '../models/StickyNote' // Unused import
// import { User } from '../models/User' // Unused import

interface UseRealtimeSyncReturn {
  subscribeToDrawings: (onEvent?: (event: any) => void) => void
  unsubscribeFromDrawings: () => void
  subscribeToStickyNotes: (onEvent?: (event: any) => void) => void
  unsubscribeFromStickyNotes: () => void
  subscribeToShapes: (onEvent?: (event: any) => void) => void
  unsubscribeFromShapes: () => void
  subscribeToTexts: (onEvent?: (event: any) => void) => void
  unsubscribeFromTexts: () => void
  subscribeToUsers: (onEvent?: (event: any) => void) => void
  unsubscribeFromUsers: () => void
  isConnected: boolean
}

/**
 * useRealtimeSync Hook
 * 
 * Custom hook for managing real-time synchronization subscriptions.
 * Provides WebSocket connection management and event handling.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @returns Real-time sync operations and connection status
 */
export const useRealtimeSync = (whiteboardId: string): UseRealtimeSyncReturn => {
  const subscriptionsRef = useRef<{
    drawings?: () => void
    stickyNotes?: () => void
    shapes?: () => void
    texts?: () => void
    users?: () => void
  }>({})

  // Subscribe to drawings
  const subscribeToDrawings = useCallback((onEvent?: (event: any) => void) => {
    console.log('🔄 useRealtimeSync: subscribeToDrawings called with onEvent:', !!onEvent)
    
    if (subscriptionsRef.current.drawings) {
      console.log('🔄 useRealtimeSync: Cleaning up existing drawings subscription')
      subscriptionsRef.current.drawings()
    }

    console.log('🔄 useRealtimeSync: Calling RealtimeService.subscribeToDrawings')
    const unsubscribe = RealtimeService.subscribeToDrawings(whiteboardId, onEvent)

    subscriptionsRef.current.drawings = unsubscribe
    console.log('🔄 useRealtimeSync: Drawings subscription completed')
  }, [whiteboardId])

  // Unsubscribe from drawings
  const unsubscribeFromDrawings = useCallback(() => {
    if (subscriptionsRef.current.drawings) {
      subscriptionsRef.current.drawings()
      delete subscriptionsRef.current.drawings
    }
  }, [])

  // Subscribe to sticky notes
  const subscribeToStickyNotes = useCallback((onEvent?: (event: any) => void) => {
    console.log('🔄 useRealtimeSync: subscribeToStickyNotes called with onEvent:', !!onEvent)
    console.log('🔄 useRealtimeSync: whiteboardId:', whiteboardId)
    
    if (subscriptionsRef.current.stickyNotes) {
      console.log('🔄 useRealtimeSync: Cleaning up existing sticky notes subscription')
      subscriptionsRef.current.stickyNotes()
    }

    console.log('🔄 useRealtimeSync: Calling RealtimeService.subscribeToStickyNotes')
    const unsubscribe = RealtimeService.subscribeToStickyNotes(whiteboardId, onEvent)

    subscriptionsRef.current.stickyNotes = unsubscribe
    console.log('🔄 useRealtimeSync: Sticky notes subscription completed, unsubscribe function:', typeof unsubscribe)
  }, [whiteboardId])

  // Unsubscribe from sticky notes
  const unsubscribeFromStickyNotes = useCallback(() => {
    if (subscriptionsRef.current.stickyNotes) {
      subscriptionsRef.current.stickyNotes()
      delete subscriptionsRef.current.stickyNotes
    }
  }, [])

  // Subscribe to shapes
  const subscribeToShapes = useCallback(() => {
    if (subscriptionsRef.current.shapes) {
      subscriptionsRef.current.shapes()
    }

    const unsubscribe = RealtimeService.subscribeToShapes(whiteboardId)

    subscriptionsRef.current.shapes = unsubscribe
  }, [whiteboardId])

  // Unsubscribe from shapes
  const unsubscribeFromShapes = useCallback(() => {
    if (subscriptionsRef.current.shapes) {
      subscriptionsRef.current.shapes()
      delete subscriptionsRef.current.shapes
    }
  }, [])

  // Subscribe to texts
  const subscribeToTexts = useCallback(() => {
    if (subscriptionsRef.current.texts) {
      subscriptionsRef.current.texts()
    }

    const unsubscribe = RealtimeService.subscribeToTexts(whiteboardId)

    subscriptionsRef.current.texts = unsubscribe
  }, [whiteboardId])

  // Unsubscribe from texts
  const unsubscribeFromTexts = useCallback(() => {
    if (subscriptionsRef.current.texts) {
      subscriptionsRef.current.texts()
      delete subscriptionsRef.current.texts
    }
  }, [])

  // Subscribe to users
  const subscribeToUsers = useCallback(() => {
    if (subscriptionsRef.current.users) {
      subscriptionsRef.current.users()
    }

    const unsubscribe = RealtimeService.subscribeToUsers(whiteboardId)

    subscriptionsRef.current.users = unsubscribe
  }, [whiteboardId])

  // Unsubscribe from users
  const unsubscribeFromUsers = useCallback(() => {
    if (subscriptionsRef.current.users) {
      subscriptionsRef.current.users()
      delete subscriptionsRef.current.users
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptionsRef.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
    }
  }, [])

  return {
    subscribeToDrawings,
    unsubscribeFromDrawings,
    subscribeToStickyNotes,
    unsubscribeFromStickyNotes,
    subscribeToShapes,
    unsubscribeFromShapes,
    subscribeToTexts,
    unsubscribeFromTexts,
    subscribeToUsers,
    unsubscribeFromUsers,
    isConnected: RealtimeService.getConnectionStatus() === 'connected'
  }
}

export default useRealtimeSync