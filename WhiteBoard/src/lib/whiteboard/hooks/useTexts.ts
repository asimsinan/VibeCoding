'use client'

import { useState, useCallback, useEffect } from 'react'
import { TextObjectModel } from '../models/CanvasObjectModel'
import { TextService } from '../services/textService'
// import { useRealtimeSync } from './useRealtimeSync'

interface UseTextsReturn {
  texts: TextObjectModel[]
  addText: (text: Omit<TextObjectModel, 'id' | 'createdAt'>) => Promise<TextObjectModel>
  updateText: (id: string, updates: Partial<TextObjectModel>) => Promise<TextObjectModel>
  deleteText: (id: string) => Promise<void>
  clearTexts: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * useTexts Hook
 * 
 * Custom hook for managing text object state and operations.
 * Provides CRUD operations for text objects with real-time synchronization.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @returns Text object state and operations
 */
export const useTexts = (whiteboardId: string): UseTextsReturn => {
  const [texts, setTexts] = useState<TextObjectModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // const { subscribeToTexts, unsubscribeFromTexts } = useRealtimeSync(whiteboardId)

  // Load texts from service
  const loadTexts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - please try again')), 30000) // 30 second timeout
      })
      
      const textsPromise = TextService.getTextsForWhiteboard(whiteboardId)
      const textsData = await Promise.race([textsPromise, timeoutPromise])
      
      setTexts(textsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load text objects'
      console.error('Error loading text objects:', err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [whiteboardId])

  // Add text
  const addText = useCallback(async (text: Omit<TextObjectModel, 'id' | 'createdAt'>): Promise<TextObjectModel> => {
    try {
      setError(null)
      const newText = await TextService.createText(whiteboardId, text)
      
      // Add to local state
      setTexts(prev => [...prev, newText])
      
      return newText
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add text object'
      console.error('Error adding text object:', err)
      setError(errorMessage)
      throw err
    }
  }, [whiteboardId])

  // Update text
  const updateText = useCallback(async (id: string, updates: Partial<TextObjectModel>): Promise<TextObjectModel> => {
    try {
      setError(null)
      const updatedText = await TextService.updateText(id, updates)
      
      // Update local state
      setTexts(prev => prev.map(text => 
        text.id === id ? updatedText : text
      ))
      
      return updatedText
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update text object'
      console.error('Error updating text object:', err)
      setError(errorMessage)
      throw err
    }
  }, [])

  // Delete text
  const deleteText = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      await TextService.deleteText(id)
      
      // Remove from local state
      setTexts(prev => prev.filter(text => text.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete text object'
      console.error('Error deleting text object:', err)
      setError(errorMessage)
      throw err
    }
  }, [])

  // Clear all texts
  const clearTexts = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      console.log('🔄 Hook clearTexts: Starting database clear...')
      await TextService.clearTextsForWhiteboard(whiteboardId)
      console.log('🔄 Hook clearTexts: Database clear completed, waiting for real-time events...')
      // Don't clear local state immediately - let real-time events handle it
      // setTexts([]) // Removed to allow real-time events to clear the state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear text objects'
      console.error('Error clearing text objects:', err)
      setError(errorMessage)
      throw err
    }
  }, [whiteboardId])

  // Load texts on mount and when whiteboardId changes
  useEffect(() => {
    if (whiteboardId) {
      loadTexts()
    }
  }, [whiteboardId, loadTexts])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!whiteboardId) return

    const handleRealtimeEvent = (event: any) => {
      console.log('Text real-time event received:', event)
      
      if (event.type === 'text') {
        switch (event.action) {
          case 'INSERT':
            console.log('Adding text from real-time:', event.payload)
            setTexts(prev => {
              // Check if text already exists to avoid duplicates
              const exists = prev.some(text => text.id === event.payload.id)
              if (exists) return prev
              return [...prev, event.payload]
            })
            break
          case 'UPDATE':
            console.log('Updating text from real-time:', event.payload)
            setTexts(prev => 
              prev.map(text => 
                text.id === event.payload.id ? event.payload : text
              )
            )
            break
          case 'DELETE':
            console.log('Deleting text from real-time:', event.payload)
            setTexts(prev => 
              prev.filter(text => text.id !== event.payload.id)
            )
            break
        }
      }
    }
    
    // Subscribe to texts real-time events
    const { RealtimeService } = require('../services/realtimeService')
    const unsubscribe = RealtimeService.subscribeToTexts(whiteboardId, handleRealtimeEvent)
    
    return () => {
      unsubscribe()
    }
  }, [whiteboardId])

  return {
    texts,
    addText,
    updateText,
    deleteText,
    clearTexts,
    isLoading,
    error
  }
}
