'use client'

import { useState, useCallback, useEffect } from 'react'
import { ShapeObjectModel } from '../models/CanvasObjectModel'
import { ShapeService } from '../services/shapeService'
// import { useRealtimeSync } from './useRealtimeSync'

interface UseShapesReturn {
  shapes: ShapeObjectModel[]
  addShape: (shape: Omit<ShapeObjectModel, 'id' | 'createdAt'>) => Promise<ShapeObjectModel>
  updateShape: (id: string, updates: Partial<ShapeObjectModel>) => Promise<ShapeObjectModel>
  deleteShape: (id: string) => Promise<void>
  clearShapes: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * useShapes Hook
 * 
 * Custom hook for managing shape state and operations.
 * Provides CRUD operations for shapes with real-time synchronization.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @returns Shape state and operations
 */
export const useShapes = (whiteboardId: string): UseShapesReturn => {
  const [shapes, setShapes] = useState<ShapeObjectModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // const { subscribeToShapes, unsubscribeFromShapes } = useRealtimeSync(whiteboardId)

  // Load shapes from service
  const loadShapes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - please try again')), 30000) // 30 second timeout
      })
      
      const shapesPromise = ShapeService.getShapesForWhiteboard(whiteboardId)
      const shapesData = await Promise.race([shapesPromise, timeoutPromise])
      
      setShapes(shapesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shapes'
      console.error('Error loading shapes:', err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [whiteboardId])

  // Add shape
  const addShape = useCallback(async (shape: Omit<ShapeObjectModel, 'id' | 'createdAt'>): Promise<ShapeObjectModel> => {
    try {
      setError(null)
      const newShape = await ShapeService.createShape(whiteboardId, shape)
      
      // Add to local state
      setShapes(prev => [...prev, newShape])
      
      return newShape
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add shape'
      console.error('Error adding shape:', err)
      setError(errorMessage)
      throw err
    }
  }, [whiteboardId])

  // Update shape
  const updateShape = useCallback(async (id: string, updates: Partial<ShapeObjectModel>): Promise<ShapeObjectModel> => {
    try {
      setError(null)
      const updatedShape = await ShapeService.updateShape(id, updates)
      
      // Update local state
      setShapes(prev => prev.map(shape => 
        shape.id === id ? updatedShape : shape
      ))
      
      return updatedShape
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shape'
      console.error('Error updating shape:', err)
      setError(errorMessage)
      throw err
    }
  }, [])

  // Delete shape
  const deleteShape = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      await ShapeService.deleteShape(id)
      
      // Remove from local state
      setShapes(prev => prev.filter(shape => shape.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shape'
      console.error('Error deleting shape:', err)
      setError(errorMessage)
      throw err
    }
  }, [])

  // Clear all shapes
  const clearShapes = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      console.log('🔄 Hook clearShapes: Starting database clear...')
      await ShapeService.clearShapesForWhiteboard(whiteboardId)
      console.log('🔄 Hook clearShapes: Database clear completed, waiting for real-time events...')
      // Don't clear local state immediately - let real-time events handle it
      // setShapes([]) // Removed to allow real-time events to clear the state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear shapes'
      console.error('Error clearing shapes:', err)
      setError(errorMessage)
      throw err
    }
  }, [whiteboardId])

  // Load shapes on mount and when whiteboardId changes
  useEffect(() => {
    if (whiteboardId) {
      loadShapes()
    }
  }, [whiteboardId, loadShapes])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!whiteboardId) return

    const handleRealtimeEvent = (event: any) => {
      console.log('Shape real-time event received:', event)
      
      if (event.type === 'shape') {
        switch (event.action) {
          case 'INSERT':
            console.log('Adding shape from real-time:', event.payload)
            setShapes(prev => {
              // Check if shape already exists to avoid duplicates
              const exists = prev.some(shape => shape.id === event.payload.id)
              if (exists) return prev
              return [...prev, event.payload]
            })
            break
          case 'UPDATE':
            console.log('Updating shape from real-time:', event.payload)
            setShapes(prev => 
              prev.map(shape => 
                shape.id === event.payload.id ? event.payload : shape
              )
            )
            break
          case 'DELETE':
            console.log('Deleting shape from real-time:', event.payload)
            setShapes(prev => 
              prev.filter(shape => shape.id !== event.payload.id)
            )
            break
        }
      }
    }
    
    // Subscribe to shapes real-time events
    const { RealtimeService } = require('../services/realtimeService')
    const unsubscribe = RealtimeService.subscribeToShapes(whiteboardId, handleRealtimeEvent)
    
    return () => {
      unsubscribe()
    }
  }, [whiteboardId])

  return {
    shapes,
    addShape,
    updateShape,
    deleteShape,
    clearShapes,
    isLoading,
    error
  }
}
