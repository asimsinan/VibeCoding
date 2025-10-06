'use client'

import { useState, useCallback, useEffect } from 'react'
import { StickyNote } from '../models/StickyNote'
import { StickyNoteService } from '../services/stickyNoteService'
import { useRealtimeSync } from './useRealtimeSync'

interface UseStickyNotesReturn {
  stickyNotes: StickyNote[]
  addStickyNote: (stickyNote: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => Promise<StickyNote>
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => Promise<StickyNote>
  deleteStickyNote: (id: string) => Promise<void>
  clearStickyNotes: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * useStickyNotes Hook
 * 
 * Custom hook for managing sticky note state and operations.
 * Provides CRUD operations for sticky notes with real-time synchronization.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @returns Sticky note state and operations
 */
export const useStickyNotes = (whiteboardId: string): UseStickyNotesReturn => {
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { subscribeToStickyNotes } = useRealtimeSync(whiteboardId)

  // Load sticky notes from service
  const loadStickyNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - please try again')), 30000) // 30 second timeout
      })
      
      const stickyNotesPromise = StickyNoteService.getStickyNotesForWhiteboard(whiteboardId)
      const stickyNotesData = await Promise.race([stickyNotesPromise, timeoutPromise])
      
      setStickyNotes(stickyNotesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sticky notes'
      
      console.error('Error loading sticky notes:', err)
      
      // If it's an authentication error, don't show it as an error
      if (errorMessage.includes('User must be authenticated')) {
        setStickyNotes([])
        setError(null) // Don't show authentication errors
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [whiteboardId])

  // Load sticky notes on mount
  useEffect(() => {
    loadStickyNotes()
  }, [loadStickyNotes])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToStickyNotes((event) => {
      if (event.action === 'INSERT' && event.payload) {
        setStickyNotes(prev => {
          // Check if sticky note already exists to prevent duplicates
          const exists = prev.some(note => note.id === event.payload.id)
          if (exists) {
            return prev
          }
          return [...prev, event.payload]
        })
      } else if (event.action === 'UPDATE' && event.payload) {
        setStickyNotes(prev => 
          prev.map(stickyNote => 
            stickyNote.id === event.payload.id ? event.payload : stickyNote
          )
        )
      } else if (event.action === 'DELETE' && event.payload?.id) {
        console.log('🗑️ Real-time DELETE event received for sticky note:', event.payload.id)
        setStickyNotes(prev => {
          const filtered = prev.filter(stickyNote => stickyNote.id !== event.payload.id)
          console.log('🗑️ Sticky notes after delete:', filtered.length, 'remaining')
          return filtered
        })
      }
    })
    
    return unsubscribe
  }, [subscribeToStickyNotes, whiteboardId])

  // Add new sticky note
  const addStickyNote = useCallback(async (stickyNoteData: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => {
    try {
      setError(null)
      const newStickyNote = await StickyNoteService.createStickyNote(whiteboardId, stickyNoteData)
      setStickyNotes(prev => [...prev, newStickyNote])
      return newStickyNote
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sticky note')
      throw err
    }
  }, [whiteboardId])

  // Update existing sticky note
  const updateStickyNote = useCallback(async (id: string, updates: Partial<StickyNote>) => {
    try {
      setError(null)
      const updatedStickyNote = await StickyNoteService.updateStickyNote(id, updates)
      
      // Only update local state if the sticky note still exists
      setStickyNotes(prev => {
        const stickyNoteExists = prev.some(note => note.id === id)
        if (!stickyNoteExists) {
          console.warn('Sticky note not found in local state during update:', id)
          return prev // Don't add the mock sticky note to local state
        }
        
        return prev.map(stickyNote => 
          stickyNote.id === id ? updatedStickyNote : stickyNote
        )
      })
      
      return updatedStickyNote
    } catch (err) {
      console.error('Error updating sticky note:', err)
      
      // If it's a "not found" error, handle it gracefully
      if (err instanceof Error && err.message.includes('not found')) {
        console.warn('Sticky note not found during update (may have been deleted by another user):', id)
        // Remove from local state if it exists
        setStickyNotes(prev => prev.filter(note => note.id !== id))
        // Return a mock sticky note to satisfy the return type
        return {
          id,
          content: updates.content || '',
          position: updates.position || { x: 0, y: 0 },
          color: updates.color || '#ffff00',
          whiteboardId: '',
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          update: async () => Promise.resolve({} as StickyNote),
          delete: async () => Promise.resolve()
        } as unknown as StickyNote
      }
      
      setError(err instanceof Error ? err.message : 'Failed to update sticky note')
      throw err
    }
  }, [])

  // Delete sticky note
  const deleteStickyNote = useCallback(async (id: string) => {
    try {
      console.log('Hook deleteStickyNote called for id:', id)
      setError(null)
      await StickyNoteService.deleteStickyNote(id)
      console.log('StickyNoteService.deleteStickyNote completed, waiting for real-time event')
      // Don't update local state immediately - let real-time events handle it
      console.log('Hook deleteStickyNote completed successfully')
    } catch (err) {
      console.error('Error in hook deleteStickyNote:', err)
      
      // If it's a "not found" error, handle it gracefully
      if (err instanceof Error && err.message.includes('not found')) {
        console.warn('Sticky note not found during delete (may have been deleted by another user):', id)
        // Remove from local state if it exists
        setStickyNotes(prev => prev.filter(note => note.id !== id))
        // Don't set error or throw - just log warning
        return
      }
      
      setError(err instanceof Error ? err.message : 'Failed to delete sticky note')
      throw err
    }
  }, [])

  // Clear all sticky notes
  const clearStickyNotes = useCallback(async () => {
    try {
      setError(null)
      console.log('🔄 Hook clearStickyNotes: Starting database clear...')
      await StickyNoteService.clearStickyNotesForWhiteboard(whiteboardId)
      console.log('🔄 Hook clearStickyNotes: Database clear completed, waiting for real-time events...')
      // Don't clear local state immediately - let real-time events handle it
      // setStickyNotes([]) // Removed to allow real-time events to clear the state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear sticky notes')
      throw err
    }
  }, [whiteboardId])

  return {
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    clearStickyNotes,
    isLoading,
    error
  }
}

export default useStickyNotes