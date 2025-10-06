'use client'

import { useState, useCallback, useEffect } from 'react'
import { Drawing } from '../models/Drawing'
import { DrawingService } from '../services/drawingService'
import { useRealtimeSync } from './useRealtimeSync'

interface UseDrawingReturn {
  drawings: Drawing[]
  addDrawing: (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => Promise<Drawing>
  updateDrawing: (id: string, updates: Partial<Drawing>) => Promise<Drawing>
  deleteDrawing: (id: string) => Promise<void>
  clearDrawings: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * useDrawing Hook
 * 
 * Custom hook for managing drawing state and operations.
 * Provides CRUD operations for drawings with real-time synchronization.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @returns Drawing state and operations
 */
export const useDrawing = (whiteboardId: string): UseDrawingReturn => {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { subscribeToDrawings } = useRealtimeSync(whiteboardId)

  // Load drawings from service
  const loadDrawings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - please try again')), 30000) // 30 second timeout
      })
      
      const drawingsPromise = DrawingService.getDrawingsForWhiteboard(whiteboardId)
      const drawingsData = await Promise.race([drawingsPromise, timeoutPromise])
      
      setDrawings(drawingsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drawings'
      
      console.error('Error loading drawings:', err)
      
      // If it's an authentication error, don't show it as an error
      if (errorMessage.includes('User must be authenticated')) {
        setDrawings([])
        setError(null) // Don't show authentication errors
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [whiteboardId])

  // Load drawings on mount
  useEffect(() => {
    loadDrawings()
  }, [loadDrawings])

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('🔄 useDrawing: Setting up real-time subscription for drawings')
    
    const unsubscribe = subscribeToDrawings((event) => {
      console.log('🔄 useDrawing: Real-time drawing event received:', event)
      
      if (event.action === 'INSERT' && event.payload) {
        console.log('🔄 useDrawing: Adding drawing from real-time event:', event.payload)
        setDrawings(prev => {
          // Check if drawing already exists to prevent duplicates
          const exists = prev.some(d => d.id === event.payload.id)
          if (exists) {
            console.log('🔄 useDrawing: Drawing already exists, skipping:', event.payload.id)
            return prev
          }
          return [...prev, event.payload]
        })
      } else if (event.action === 'UPDATE' && event.payload) {
        console.log('🔄 useDrawing: Updating drawing from real-time event:', event.payload)
        setDrawings(prev => 
          prev.map(drawing => 
            drawing.id === event.payload.id ? event.payload : drawing
          )
        )
      } else if (event.action === 'DELETE' && event.payload?.id) {
        console.log('🔄 useDrawing: Deleting drawing from real-time event:', event.payload.id)
        setDrawings(prev => prev.filter(drawing => drawing.id !== event.payload.id))
      }
    })
    
    return unsubscribe
  }, [subscribeToDrawings])

  // Add new drawing
  const addDrawing = useCallback(async (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => {
    try {
      setError(null)
      const newDrawing = await DrawingService.createDrawing(whiteboardId, drawing)
      setDrawings(prev => [...prev, newDrawing])
      return newDrawing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add drawing')
      throw err
    }
  }, [whiteboardId])

  // Update existing drawing
  const updateDrawing = useCallback(async (id: string, updates: Partial<Drawing>) => {
    try {
      setError(null)
      const updatedDrawing = await DrawingService.updateDrawing(id, updates)
      setDrawings(prev => 
        prev.map(drawing => 
          drawing.id === id ? updatedDrawing : drawing
        )
      )
      return updatedDrawing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update drawing')
      throw err
    }
  }, [])

  // Delete drawing
  const deleteDrawing = useCallback(async (id: string) => {
    try {
      console.log('🧹 useDrawing deleteDrawing called for:', id)
      setError(null)
      console.log('🧹 About to call DrawingService.deleteDrawing')
      await DrawingService.deleteDrawing(id)
      console.log('🧹 DrawingService.deleteDrawing completed successfully')
      setDrawings(prev => prev.filter(drawing => drawing.id !== id))
      console.log('🧹 Local state updated, drawing removed')
    } catch (err) {
      console.error('🧹 Error in hook deleteDrawing:', err)
      
      // If it's a "not found" error, handle it gracefully
      if (err instanceof Error && err.message.includes('not found')) {
        console.warn('🧹 Drawing not found during delete (may have been deleted by another user):', id)
        // Remove from local state if it exists
        setDrawings(prev => prev.filter(drawing => drawing.id !== id))
        // Don't set error or throw - just log warning
        return
      }
      
      setError(err instanceof Error ? err.message : 'Failed to delete drawing')
      throw err
    }
  }, [])

  // Clear all drawings
  const clearDrawings = useCallback(async () => {
    try {
      setError(null)
      console.log('🔄 Hook clearDrawings: Starting database clear...')
      await DrawingService.clearDrawingsForWhiteboard(whiteboardId)
      console.log('🔄 Hook clearDrawings: Database clear completed, waiting for real-time events...')
      // Don't clear local state immediately - let real-time events handle it
      // setDrawings([]) // Removed to allow real-time events to clear the state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear drawings')
      throw err
    }
  }, [whiteboardId])

  // Real-time updates are now handled by WhiteboardContext
  // This prevents duplicate subscriptions and flickering

  return {
    drawings,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    clearDrawings,
    isLoading,
    error
  }
}