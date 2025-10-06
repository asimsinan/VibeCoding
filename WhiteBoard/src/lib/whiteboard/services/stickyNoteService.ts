/**
 * Sticky Note Service
 * Business logic for sticky note operations
 * 
 * @fileoverview Sticky note service with CRUD operations and positioning
 * @version 1.0.0
 */

import { StickyNote } from '../models/StickyNote'
import { CreateStickyNoteParams, UpdateStickyNoteParams, Position } from '@/contracts/types/domain'
// import { whiteboardApi, CreateStickyNoteRequest, UpdateStickyNoteRequest } from '@/lib/api/whiteboardApi' // Unused imports

export class StickyNoteService {
  /**
   * Create a new sticky note
   * FR-003: Create sticky note functionality
   */
  static async createStickyNote(whiteboardId: string, params: CreateStickyNoteParams): Promise<StickyNote> {
    try {
      // Call the model directly instead of going through the API to avoid circular dependency
      return await StickyNote.create(whiteboardId, params)
    } catch (error) {
      console.error('Error creating sticky note:', error)
      throw error
    }
  }

  /**
   * Get sticky note by ID
   * FR-003: Retrieve sticky note functionality
   */
  static async getStickyNote(id: string): Promise<StickyNote | null> {
    try {
      // For now, fallback to direct database access
      // In a full implementation, we'd have a GET /sticky-notes/{id} endpoint
      return await StickyNote.getById(id)
    } catch (error) {
      console.error('Error getting sticky note:', error)
      throw error
    }
  }

  /**
   * Update sticky note
   * FR-003: Update sticky note functionality
   */
  static async updateStickyNote(id: string, params: UpdateStickyNoteParams): Promise<StickyNote> {
    try {
      // First get the sticky note to find its whiteboard ID
      const stickyNote = await StickyNote.getById(id)
      if (!stickyNote) {
        console.warn('Sticky note not found during update (may have been deleted by another user):', id)
        // Return a mock sticky note to prevent UI crashes
        // This handles race conditions where the sticky note was deleted by another user
        return {
          id,
          content: params.content || '',
          position: params.position || { x: 0, y: 0 },
          color: params.color || '#ffff00',
          whiteboardId: '',
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          update: async () => Promise.resolve({} as StickyNote),
          delete: async () => Promise.resolve()
        } as unknown as StickyNote
      }

      // Call the model's update method directly
      return await stickyNote.update(params)
    } catch (error) {
      console.error('Error updating sticky note:', error)
      
      // If it's a "not found" error, handle it gracefully
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Sticky note not found during update (may have been deleted by another user):', id)
        // Return a mock sticky note to prevent UI crashes
        return {
          id,
          content: params.content || '',
          position: params.position || { x: 0, y: 0 },
          color: params.color || '#ffff00',
          whiteboardId: '',
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          update: async () => Promise.resolve({} as StickyNote),
          delete: async () => Promise.resolve()
        } as unknown as StickyNote
      }
      
      throw error
    }
  }

  /**
   * Delete sticky note
   * FR-003: Delete sticky note functionality
   */
  static async deleteStickyNote(id: string): Promise<void> {
    try {
      // First get the sticky note to find its whiteboard ID
      const stickyNote = await StickyNote.getById(id)
      if (!stickyNote) {
        console.warn('Sticky note not found during delete (may have been deleted by another user):', id)
        // Don't throw error - just log warning and return
        // This handles race conditions where the sticky note was already deleted
        return
      }

      // Call the model's delete method directly
      await stickyNote.delete()
    } catch (error) {
      console.error('Error deleting sticky note:', error)
      
      // If it's a "not found" error, handle it gracefully
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Sticky note not found during delete (may have been deleted by another user):', id)
        // Don't throw error - just log warning and return
        return
      }
      
      throw error
    }
  }

  /**
   * Get all sticky notes for whiteboard
   * FR-003: List sticky notes functionality
   */
  static async getStickyNotesForWhiteboard(whiteboardId: string): Promise<StickyNote[]> {
    try {
      // Call the model directly instead of going through the API to avoid circular dependency
      return await StickyNote.getByWhiteboardId(whiteboardId)
    } catch (error) {
      console.error('Error getting sticky notes:', error)
      throw error
    }
  }

  /**
   * Clear all sticky notes for whiteboard
   * FR-007: Clear whiteboard functionality
   */
  static async clearStickyNotesForWhiteboard(whiteboardId: string): Promise<void> {
    try {
      console.log(`🔄 Clearing all sticky notes for whiteboard: ${whiteboardId}`)
      
      // Get all sticky notes for the whiteboard first
      const stickyNotes = await StickyNote.getByWhiteboardId(whiteboardId)
      console.log(`🔄 Found ${stickyNotes.length} sticky notes to clear`)
      
      if (stickyNotes.length === 0) {
        console.log('✅ No sticky notes to clear')
        return
      }
      
      // Delete each sticky note individually to ensure real-time events are triggered
      const deletePromises = stickyNotes.map(async (stickyNote) => {
        console.log(`🔄 Deleting sticky note: ${stickyNote.id}`)
        return stickyNote.delete()
      })
      
      await Promise.all(deletePromises)
      console.log(`✅ Successfully cleared ${stickyNotes.length} sticky notes`)
    } catch (error) {
      console.error('Error clearing sticky notes:', error)
      throw error
    }
  }

  /**
   * Move sticky note to new position
   * FR-003: Update sticky note position functionality
   */
  static async moveStickyNote(id: string, newPosition: Position): Promise<StickyNote> {
    return await this.updateStickyNote(id, { position: newPosition })
  }

  /**
   * Update sticky note content
   * FR-003: Update sticky note content functionality
   */
  static async updateStickyNoteContent(id: string, content: string): Promise<StickyNote> {
    return await this.updateStickyNote(id, { content })
  }

  /**
   * Change sticky note color
   * FR-003: Update sticky note color functionality
   */
  static async changeStickyNoteColor(id: string, color: string): Promise<StickyNote> {
    return await this.updateStickyNote(id, { color })
  }

  /**
   * Validate position is within whiteboard bounds
   */
  static validatePosition(position: Position, whiteboardWidth: number, whiteboardHeight: number): boolean {
    return position.x >= 0 && position.x <= whiteboardWidth &&
           position.y >= 0 && position.y <= whiteboardHeight
  }

  /**
   * Check for sticky note collisions
   * Prevents overlapping sticky notes
   */
  static checkCollision(
    position: Position, 
    existingNotes: StickyNote[], 
    excludeId?: string,
    tolerance: number = 10
  ): boolean {
    const stickyNoteWidth = 200 // Default sticky note width
    const stickyNoteHeight = 150 // Default sticky note height

    return existingNotes.some(note => {
      if (excludeId && note.id === excludeId) return false

      const noteX = note.position.x
      const noteY = note.position.y

      return !(
        position.x + stickyNoteWidth + tolerance < noteX ||
        position.x > noteX + stickyNoteWidth + tolerance ||
        position.y + stickyNoteHeight + tolerance < noteY ||
        position.y > noteY + stickyNoteHeight + tolerance
      )
    })
  }

  /**
   * Find optimal position for new sticky note
   * Avoids collisions with existing notes
   */
  static findOptimalPosition(
    existingNotes: StickyNote[],
    whiteboardWidth: number,
    whiteboardHeight: number,
    preferredPosition?: Position
  ): Position {
    const stickyNoteWidth = 200
    const stickyNoteHeight = 150
    const step = 20

    // If preferred position is valid and doesn't collide, use it
    if (preferredPosition && 
        this.validatePosition(preferredPosition, whiteboardWidth, whiteboardHeight) &&
        !this.checkCollision(preferredPosition, existingNotes)) {
      return preferredPosition
    }

    // Search for a valid position
    for (let y = 50; y <= whiteboardHeight - stickyNoteHeight; y += step) {
      for (let x = 50; x <= whiteboardWidth - stickyNoteWidth; x += step) {
        const position: Position = { x, y }
        if (!this.checkCollision(position, existingNotes)) {
          return position
        }
      }
    }

    // Fallback to center if no position found
    return {
      x: Math.max(50, (whiteboardWidth - stickyNoteWidth) / 2),
      y: Math.max(50, (whiteboardHeight - stickyNoteHeight) / 2)
    }
  }

  /**
   * Get sticky notes in area
   * Returns sticky notes within a bounding box
   */
  static getStickyNotesInArea(
    stickyNotes: StickyNote[],
    topLeft: Position,
    bottomRight: Position
  ): StickyNote[] {
    return stickyNotes.filter(note => {
      const noteX = note.position.x
      const noteY = note.position.y
      const stickyNoteWidth = 200
      const stickyNoteHeight = 150

      return !(
        noteX + stickyNoteWidth < topLeft.x ||
        noteX > bottomRight.x ||
        noteY + stickyNoteHeight < topLeft.y ||
        noteY > bottomRight.y
      )
    })
  }

  /**
   * Search sticky notes by content
   * Case-insensitive search through sticky note content
   */
  static searchStickyNotes(stickyNotes: StickyNote[], query: string): StickyNote[] {
    if (!query.trim()) return stickyNotes

    const lowercaseQuery = query.toLowerCase()
    return stickyNotes.filter(note => 
      note.content.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Get sticky notes by color
   * Filter sticky notes by color
   */
  static getStickyNotesByColor(stickyNotes: StickyNote[], color: string): StickyNote[] {
    return stickyNotes.filter(note => note.color === color)
  }

  /**
   * Get sticky notes by user
   * Filter sticky notes by creator
   */
  static getStickyNotesByUser(stickyNotes: StickyNote[], userId: string): StickyNote[] {
    return stickyNotes.filter(note => note.userId === userId)
  }
}

// Export a singleton instance
export const stickyNoteService = new StickyNoteService()
export default stickyNoteService
