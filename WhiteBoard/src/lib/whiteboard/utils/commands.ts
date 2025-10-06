'use client'

import { BaseCommand } from './commandPattern'
import { Drawing } from '../models/Drawing'
import { StickyNote } from '../models/StickyNote'

/**
 * Concrete Command Classes for Whiteboard Actions
 * 
 * Each command encapsulates a specific action and provides execute/undo/redo functionality.
 */

// Drawing Commands
export class AddDrawingCommand extends BaseCommand {
  constructor(
    private drawing: Drawing,
    private addDrawingFn: (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Drawing>,
    private deleteDrawingFn: (id: string) => Promise<void>,
    private updateStateFn: (action: any) => void,
    private removeFromCanvasFn?: (id: string) => void
  ) {
    super(`Add ${drawing.tool} drawing`)
  }

  async execute(): Promise<void> {
    // Drawing is already added during creation, just update state
    this.updateStateFn({ type: 'ADD_DRAWING', payload: this.drawing })
    if (this.removeFromCanvasFn) {
      // Ensure drawing is visible on canvas
      console.log(`Drawing ${this.drawing.id} should be visible on canvas`)
    }
  }

  async undo(): Promise<void> {
    try {
      console.log(`🗑️ AddDrawingCommand.undo() - Removing drawing ID: ${this.drawing.id}`)
      console.log(`📝 Drawing details:`, {
        id: this.drawing.id,
        tool: this.drawing.tool,
        points: this.drawing.points?.length || 0,
        timestamp: this.drawing.createdAt
      })
      
      // First remove from canvas to ensure immediate visual feedback
      if (this.removeFromCanvasFn) {
        this.removeFromCanvasFn(this.drawing.id)
      }
      
      // Then update state to remove from context
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
      
      // Finally delete from database
      await this.deleteDrawingFn(this.drawing.id)
    } catch (error) {
      console.warn('Drawing not found in database during undo:', this.drawing.id)
      // Still update state and canvas even if database deletion fails
      if (this.removeFromCanvasFn) {
        this.removeFromCanvasFn(this.drawing.id)
      }
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
    }
  }

  async redo(): Promise<void> {
    try {
      console.log('Redoing AddDrawingCommand for drawing:', this.drawing.id)
      
      // For redo operations, we only need to update the state
      // The drawing should already exist in the database from the original creation
      // No need to make another database call - this is what makes redo slow
      this.updateStateFn({ type: 'ADD_DRAWING', payload: this.drawing })
      
      console.log('Drawing restored to state during redo (no database call needed)')
    } catch (error) {
      console.error('Failed to redo AddDrawingCommand:', error)
      // Still update state even if there's an error
      this.updateStateFn({ type: 'ADD_DRAWING', payload: this.drawing })
    }
  }
}

export class DeleteDrawingCommand extends BaseCommand {
  constructor(
    private drawing: Drawing,
    private addDrawingFn: (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Drawing>,
    private deleteDrawingFn: (id: string) => Promise<void>,
    private updateStateFn: (action: any) => void,
    private removeFromCanvasFn?: (id: string) => void
  ) {
    super(`Delete ${drawing.tool} drawing`)
  }

  async execute(): Promise<void> {
    try {
      console.log('🧹 DeleteDrawingCommand: About to delete from database:', this.drawing.id)
      await this.deleteDrawingFn(this.drawing.id)
      console.log('🧹 DeleteDrawingCommand: Database deletion successful, dispatching DELETE_DRAWING')
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
      console.log('🧹 DeleteDrawingCommand: DELETE_DRAWING action dispatched')
      if (this.removeFromCanvasFn) {
        console.log('🧹 DeleteDrawingCommand: Calling removeFromCanvasFn')
        this.removeFromCanvasFn(this.drawing.id)
      }
    } catch (error) {
      console.warn('🧹 DeleteDrawingCommand: Drawing not found in database:', this.drawing.id)
      // Still update state even if database deletion fails
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
      if (this.removeFromCanvasFn) {
        this.removeFromCanvasFn(this.drawing.id)
      }
    }
  }

  async undo(): Promise<void> {
    try {
      await this.addDrawingFn(this.drawing)
      this.updateStateFn({ type: 'ADD_DRAWING', payload: this.drawing })
    } catch (error) {
      console.error('Failed to restore drawing:', error)
      // Still update state even if there's an error
      this.updateStateFn({ type: 'ADD_DRAWING', payload: this.drawing })
    }
  }

  async redo(): Promise<void> {
    try {
      await this.deleteDrawingFn(this.drawing.id)
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
      if (this.removeFromCanvasFn) {
        this.removeFromCanvasFn(this.drawing.id)
      }
    } catch (error) {
      console.warn('Drawing not found in database:', this.drawing.id)
      // Still update state even if database deletion fails
      this.updateStateFn({ type: 'DELETE_DRAWING', payload: this.drawing.id })
      if (this.removeFromCanvasFn) {
        this.removeFromCanvasFn(this.drawing.id)
      }
    }
  }
}

export class UpdateDrawingCommand extends BaseCommand {
  constructor(
    private originalDrawing: Drawing,
    private updatedDrawing: Drawing,
    private updateDrawingFn: (id: string, updates: Partial<Drawing>) => Promise<Drawing>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Update ${originalDrawing.tool} drawing`)
  }

  async execute(): Promise<void> {
    await this.updateDrawingFn(this.originalDrawing.id, this.updatedDrawing)
    this.updateStateFn({ type: 'UPDATE_DRAWING', payload: this.updatedDrawing })
  }

  async undo(): Promise<void> {
    await this.updateDrawingFn(this.originalDrawing.id, this.originalDrawing)
    this.updateStateFn({ type: 'UPDATE_DRAWING', payload: this.originalDrawing })
  }

  async redo(): Promise<void> {
    await this.updateDrawingFn(this.originalDrawing.id, this.updatedDrawing)
    this.updateStateFn({ type: 'UPDATE_DRAWING', payload: this.updatedDrawing })
  }
}

export class ClearDrawingsCommand extends BaseCommand {
  constructor(
    private drawings: Drawing[],
    private clearDrawingsFn: () => Promise<void>,
    private addDrawingFn: (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Drawing>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Clear ${drawings.length} drawings`)
  }

  async execute(): Promise<void> {
    await this.clearDrawingsFn()
    this.updateStateFn({ type: 'SET_DRAWINGS', payload: [] })
  }

  async undo(): Promise<void> {
    // Restore all drawings
    for (const drawing of this.drawings) {
      try {
        await this.addDrawingFn(drawing)
        this.updateStateFn({ type: 'ADD_DRAWING', payload: drawing })
      } catch (error) {
        console.error('Failed to restore drawing:', drawing.id, error)
        // Continue with other drawings even if one fails
      }
    }
  }

  async redo(): Promise<void> {
    await this.clearDrawingsFn()
    this.updateStateFn({ type: 'SET_DRAWINGS', payload: [] })
  }
}

// Sticky Note Commands
export class AddStickyNoteCommand extends BaseCommand {
  constructor(
    private stickyNote: StickyNote,
    private addStickyNoteFn: (stickyNote: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StickyNote>,
    private deleteStickyNoteFn: (id: string) => Promise<void>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Add sticky note`)
  }

  async execute(): Promise<void> {
    // Sticky note is already added during creation, just update state
    this.updateStateFn({ type: 'ADD_STICKY_NOTE', payload: this.stickyNote })
  }

  async undo(): Promise<void> {
    try {
      await this.deleteStickyNoteFn(this.stickyNote.id)
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    } catch (error) {
      console.warn('Sticky note not found in database during undo:', this.stickyNote.id)
      // Still update state even if database deletion fails
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    }
  }

  async redo(): Promise<void> {
    try {
      await this.addStickyNoteFn(this.stickyNote)
      this.updateStateFn({ type: 'ADD_STICKY_NOTE', payload: this.stickyNote })
    } catch (error) {
      console.error('Failed to restore sticky note:', error)
      // Still update state even if there's an error
      this.updateStateFn({ type: 'ADD_STICKY_NOTE', payload: this.stickyNote })
    }
  }
}

export class DeleteStickyNoteCommand extends BaseCommand {
  constructor(
    private stickyNote: StickyNote,
    private addStickyNoteFn: (stickyNote: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StickyNote>,
    private deleteStickyNoteFn: (id: string) => Promise<void>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Delete sticky note`)
  }

  async execute(): Promise<void> {
    try {
      await this.deleteStickyNoteFn(this.stickyNote.id)
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    } catch (error) {
      console.warn('Sticky note not found in database:', this.stickyNote.id)
      // Still update state even if database deletion fails
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    }
  }

  async undo(): Promise<void> {
    try {
      await this.addStickyNoteFn(this.stickyNote)
      this.updateStateFn({ type: 'ADD_STICKY_NOTE', payload: this.stickyNote })
    } catch (error) {
      console.error('Failed to restore sticky note:', error)
      // Still update state even if there's an error
      this.updateStateFn({ type: 'ADD_STICKY_NOTE', payload: this.stickyNote })
    }
  }

  async redo(): Promise<void> {
    try {
      await this.deleteStickyNoteFn(this.stickyNote.id)
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    } catch (error) {
      console.warn('Sticky note not found in database:', this.stickyNote.id)
      // Still update state even if database deletion fails
      this.updateStateFn({ type: 'DELETE_STICKY_NOTE', payload: this.stickyNote.id })
    }
  }
}

export class UpdateStickyNoteCommand extends BaseCommand {
  constructor(
    private originalStickyNote: StickyNote,
    private updatedStickyNote: StickyNote,
    private updateStickyNoteFn: (id: string, updates: Partial<StickyNote>) => Promise<StickyNote>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Update sticky note`)
  }

  async execute(): Promise<void> {
    await this.updateStickyNoteFn(this.originalStickyNote.id, this.updatedStickyNote)
    this.updateStateFn({ type: 'UPDATE_STICKY_NOTE', payload: this.updatedStickyNote })
  }

  async undo(): Promise<void> {
    await this.updateStickyNoteFn(this.originalStickyNote.id, this.originalStickyNote)
    this.updateStateFn({ type: 'UPDATE_STICKY_NOTE', payload: this.originalStickyNote })
  }

  async redo(): Promise<void> {
    await this.updateStickyNoteFn(this.originalStickyNote.id, this.updatedStickyNote)
    this.updateStateFn({ type: 'UPDATE_STICKY_NOTE', payload: this.updatedStickyNote })
  }
}

export class MoveStickyNoteCommand extends BaseCommand {
  constructor(
    private stickyNoteId: string,
    private oldPosition: { x: number; y: number },
    private newPosition: { x: number; y: number },
    private updateStickyNoteFn: (id: string, updates: Partial<StickyNote>) => Promise<StickyNote>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Move sticky note`)
  }

  async execute(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { position: this.newPosition })
    // Find the sticky note in state and update it
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, position: this.newPosition } 
    })
  }

  async undo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { position: this.oldPosition })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, position: this.oldPosition } 
    })
  }

  async redo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { position: this.newPosition })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, position: this.newPosition } 
    })
  }
}

export class ChangeStickyNoteTextCommand extends BaseCommand {
  constructor(
    private stickyNoteId: string,
    private oldContent: string,
    private newContent: string,
    private updateStickyNoteFn: (id: string, updates: Partial<StickyNote>) => Promise<StickyNote>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Change sticky note text`)
  }

  async execute(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { content: this.newContent })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, content: this.newContent } 
    })
  }

  async undo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { content: this.oldContent })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, content: this.oldContent } 
    })
  }

  async redo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { content: this.newContent })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, content: this.newContent } 
    })
  }
}

export class ChangeStickyNoteColorCommand extends BaseCommand {
  constructor(
    private stickyNoteId: string,
    private oldColor: string,
    private newColor: string,
    private updateStickyNoteFn: (id: string, updates: Partial<StickyNote>) => Promise<StickyNote>,
    private updateStateFn: (action: any) => void
  ) {
    super(`Change sticky note color`)
  }

  async execute(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { color: this.newColor })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, color: this.newColor } 
    })
  }

  async undo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { color: this.oldColor })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, color: this.oldColor } 
    })
  }

  async redo(): Promise<void> {
    await this.updateStickyNoteFn(this.stickyNoteId, { color: this.newColor })
    this.updateStateFn({ 
      type: 'UPDATE_STICKY_NOTE', 
      payload: { id: this.stickyNoteId, color: this.newColor } 
    })
  }
}
