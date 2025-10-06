'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { Whiteboard } from '../models/Whiteboard'
import { Drawing } from '../models/Drawing'
import { StickyNote } from '../models/StickyNote'
import { CanvasObjectModel, TextObjectModel, ShapeObjectModel } from '../models/CanvasObjectModel'
import { User } from '../models/User'
import { useDrawing } from '../hooks/useDrawing'
import { useStickyNotes } from '../hooks/useStickyNotes'
// Removed useAuth import to avoid circular dependency
import { useTexts } from '../hooks/useTexts'
import { useShapes } from '../hooks/useShapes'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { whiteboardCommandManager } from '../utils/commandPattern'
import { supabase } from '@/lib/supabase/client'
import { 
  AddDrawingCommand, 
  DeleteDrawingCommand, 
  ClearDrawingsCommand,
  AddStickyNoteCommand,
  DeleteStickyNoteCommand
} from '../utils/commands'

// State interface
interface WhiteboardState {
  currentWhiteboard: Whiteboard | null
  drawings: Drawing[]
  stickyNotes: StickyNote[]
  canvasObjects: CanvasObjectModel[]
  users: User[]
  isConnected: boolean
  isLoading: boolean
  error: string | null
  selectedTool: 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow'
  selectedColor: string
  selectedSize: number
  zoomLevel: number
  isFullscreen: boolean
  isClearOperation: boolean
  // Undo/Redo state
  canUndo: boolean
  canRedo: boolean
  isUndoRedoOperation: boolean
  // Sticky note color state
  selectedStickyNoteColor: string
  isStickyNoteColorMode: boolean
  // Drawing canvas ref for direct canvas operations
  drawingCanvasRef: React.RefObject<any> | null
  // Function reference for removing drawings from canvas
  removeDrawingFromCanvasFn: ((id: string) => void) | null
}

// Action types
type WhiteboardAction =
  | { type: 'SET_WHITEBOARD'; payload: Whiteboard }
  | { type: 'SET_DRAWINGS'; payload: Drawing[] }
  | { type: 'ADD_DRAWING'; payload: Drawing }
  | { type: 'UPDATE_DRAWING'; payload: Drawing }
  | { type: 'DELETE_DRAWING'; payload: string }
  | { type: 'SET_STICKY_NOTES'; payload: StickyNote[] }
  | { type: 'SET_CANVAS_OBJECTS'; payload: CanvasObjectModel[] }
  | { type: 'SET_TEXT_CANVAS_OBJECTS'; payload: CanvasObjectModel[] }
  | { type: 'SET_SHAPE_CANVAS_OBJECTS'; payload: CanvasObjectModel[] }
  | { type: 'ADD_STICKY_NOTE'; payload: StickyNote }
  | { type: 'UPDATE_STICKY_NOTE'; payload: StickyNote }
  | { type: 'DELETE_STICKY_NOTE'; payload: string }
  | { type: 'ADD_CANVAS_OBJECT'; payload: CanvasObjectModel }
  | { type: 'UPDATE_CANVAS_OBJECT'; payload: CanvasObjectModel }
  | { type: 'DELETE_CANVAS_OBJECT'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_TOOL'; payload: 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' }
  | { type: 'SET_SELECTED_COLOR'; payload: string }
  | { type: 'SET_SELECTED_SIZE'; payload: number }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_CLEAR_OPERATION'; payload: boolean }
  | { type: 'SET_UNDO_REDO_OPERATION'; payload: boolean }
  | { type: 'UPDATE_UNDO_REDO_STATE' }
  | { type: 'SET_SELECTED_STICKY_NOTE_COLOR'; payload: string }
  | { type: 'SET_STICKY_NOTE_COLOR_MODE'; payload: boolean }
  | { type: 'SET_DRAWING_CANVAS_REF'; payload: React.RefObject<any> | null }
  | { type: 'SET_REMOVE_DRAWING_FROM_CANVAS_FN'; payload: ((id: string) => void) | null }

// Initial state
const initialState: WhiteboardState = {
  currentWhiteboard: null,
  drawings: [],
  stickyNotes: [],
  canvasObjects: [],
  users: [],
  isConnected: false,
  isLoading: false,
  error: null,
  selectedTool: 'pen',
  selectedColor: '#000000',
  selectedSize: 2,
  zoomLevel: 1,
  isFullscreen: false,
  isClearOperation: false,
  // Undo/Redo state
  canUndo: false,
  canRedo: false,
  isUndoRedoOperation: false,
  // Sticky note color state
  selectedStickyNoteColor: '#FFE066',
  isStickyNoteColorMode: false,
  // Drawing canvas ref for direct canvas operations
  drawingCanvasRef: null,
  // Function reference for removing drawings from canvas
  removeDrawingFromCanvasFn: null
}

// Reducer
function whiteboardReducer(state: WhiteboardState, action: WhiteboardAction): WhiteboardState {
  switch (action.type) {
    case 'SET_WHITEBOARD':
      return { ...state, currentWhiteboard: action.payload }
    
    case 'SET_DRAWINGS':
      return { ...state, drawings: action.payload || [] }
    
    case 'ADD_DRAWING':
      // Prevent duplicate drawings by checking if ID already exists
      const existingDrawings = state.drawings || []
      const drawingExists = existingDrawings.some(drawing => drawing.id === action.payload.id)
      
      if (drawingExists) {
        console.warn('Drawing with ID already exists, skipping duplicate:', action.payload.id)
        return state
      }
      
      return { ...state, drawings: [...existingDrawings, action.payload] }
    
    case 'UPDATE_DRAWING':
      return {
        ...state,
        drawings: (state.drawings || []).map(drawing =>
          drawing.id === action.payload.id ? action.payload : drawing
        )
      }
    
    case 'DELETE_DRAWING':
      return {
        ...state,
        drawings: (state.drawings || []).filter(drawing => drawing.id !== action.payload)
      }
    
    case 'SET_STICKY_NOTES':
      return { ...state, stickyNotes: action.payload || [] }
    
    case 'SET_CANVAS_OBJECTS':
      return { ...state, canvasObjects: action.payload || [] }
    
    case 'SET_TEXT_CANVAS_OBJECTS':
      // Merge text objects with existing canvas objects (shapes)
      const existingShapes = state.canvasObjects.filter(obj => obj.type !== 'text')
      const allCanvasObjects = [...existingShapes, ...(action.payload || [])]
      return { ...state, canvasObjects: allCanvasObjects }
    
    case 'SET_SHAPE_CANVAS_OBJECTS':
      // Merge shape objects with existing canvas objects (texts)
      const existingTexts = state.canvasObjects.filter(obj => obj.type === 'text')
      const allCanvasObjectsWithShapes = [...existingTexts, ...(action.payload || [])]
      return { ...state, canvasObjects: allCanvasObjectsWithShapes }
    
    case 'ADD_STICKY_NOTE':
      // Prevent duplicate sticky notes by checking if ID already exists
      const existingStickyNotes = state.stickyNotes || []
      const stickyNoteExists = existingStickyNotes.some(note => note.id === action.payload.id)
      
      if (stickyNoteExists) {
        console.warn('Sticky note with ID already exists, skipping duplicate:', action.payload.id)
        return state
      }
      
      return { ...state, stickyNotes: [...existingStickyNotes, action.payload] }
    
    case 'UPDATE_STICKY_NOTE':
      return {
        ...state,
        stickyNotes: (state.stickyNotes || []).map(note =>
          note.id === action.payload.id ? action.payload : note
        )
      }
    
    case 'DELETE_STICKY_NOTE':
      return {
        ...state,
        stickyNotes: (state.stickyNotes || []).filter(note => note.id !== action.payload)
      }
    
    case 'ADD_CANVAS_OBJECT':
      // Prevent duplicate canvas objects by checking if ID already exists
      const existingCanvasObjects = state.canvasObjects || []
      const canvasObjectExists = existingCanvasObjects.some(obj => obj.id === action.payload.id)
      
      if (canvasObjectExists) {
        console.warn('Canvas object with ID already exists, skipping duplicate:', action.payload.id)
        return state
      }
      
      return { ...state, canvasObjects: [...existingCanvasObjects, action.payload] }
    
    case 'UPDATE_CANVAS_OBJECT':
      return {
        ...state,
        canvasObjects: state.canvasObjects.map(obj =>
          obj.id === action.payload.id ? action.payload : obj
        )
      }
    
    case 'DELETE_CANVAS_OBJECT':
      return {
        ...state,
        canvasObjects: state.canvasObjects.filter(obj => obj.id !== action.payload)
      }
    
    case 'SET_USERS':
      return { ...state, users: action.payload || [] }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_SELECTED_TOOL':
      return { ...state, selectedTool: action.payload }
    
    case 'SET_SELECTED_COLOR':
      return { ...state, selectedColor: action.payload }
    
    case 'SET_SELECTED_SIZE':
      return { ...state, selectedSize: action.payload }
    
    case 'SET_ZOOM_LEVEL':
      return {
        ...state,
        zoomLevel: Math.max(0.1, Math.min(5, action.payload)) // Clamp between 0.1x and 5x
      }
    
    case 'TOGGLE_FULLSCREEN':
      return {
        ...state,
        isFullscreen: !state.isFullscreen
      }
    
    case 'SET_CLEAR_OPERATION':
      return { ...state, isClearOperation: action.payload }
    
    case 'SET_UNDO_REDO_OPERATION':
      return { ...state, isUndoRedoOperation: action.payload }
    
    case 'UPDATE_UNDO_REDO_STATE':
      return {
        ...state,
        canUndo: whiteboardCommandManager.canUndo(),
        canRedo: whiteboardCommandManager.canRedo()
      }
    
    case 'SET_SELECTED_STICKY_NOTE_COLOR':
      return { ...state, selectedStickyNoteColor: action.payload }
    
    case 'SET_STICKY_NOTE_COLOR_MODE':
      return { ...state, isStickyNoteColorMode: action.payload }
    
    case 'SET_DRAWING_CANVAS_REF':
      return { ...state, drawingCanvasRef: action.payload }
    
    case 'SET_REMOVE_DRAWING_FROM_CANVAS_FN':
      return { ...state, removeDrawingFromCanvasFn: action.payload }
    
    default:
      return state
  }
}

// Context interface
interface WhiteboardContextType {
  state: WhiteboardState
  dispatch: React.Dispatch<WhiteboardAction>
  // Drawing actions
  addDrawing: (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => Promise<void>
  updateDrawing: (id: string, updates: Partial<Drawing>) => Promise<void>
  deleteDrawing: (id: string) => Promise<void>
  clearDrawings: () => Promise<void>
  // Sticky note actions
  addStickyNote: (stickyNote: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => Promise<void>
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => Promise<void>
  deleteStickyNote: (id: string) => Promise<void>
  clearStickyNotes: () => Promise<void>
  // Canvas object actions
  addTextObject: (textObject: Omit<TextObjectModel, 'id' | 'createdAt'>) => Promise<void>
  addShapeObject: (shapeObject: Omit<ShapeObjectModel, 'id' | 'createdAt'>) => Promise<void>
  updateCanvasObject: (id: string, updates: Partial<CanvasObjectModel>) => Promise<void>
  deleteCanvasObject: (id: string) => Promise<void>
  // Tool actions
  setSelectedTool: (tool: 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow') => void
  setSelectedColor: (color: string) => void
  setSelectedSize: (size: number) => void
  // Sticky note color actions
  setSelectedStickyNoteColor: (color: string) => void
  setStickyNoteColorMode: (mode: boolean) => void
  toggleStickyNoteColorMode: () => void
  // Undo/Redo actions
  undo: () => Promise<void>
  redo: () => Promise<void>
  clearHistory: () => void
  // Command manager access
  commandManager: typeof whiteboardCommandManager
  // State management
  updateState: (action: WhiteboardAction) => void
  removeDrawingFromCanvasFn: ((drawingId: string) => void) | null
  // View actions
  setZoomLevel: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void
  fitToScreen: () => void
  toggleFullscreen: () => void
  // Whiteboard actions
  clearWhiteboard: () => Promise<void>
  saveWhiteboard: () => Promise<void>
  exportWhiteboard: () => void
  // Canvas actions
  setDrawingCanvasRef: (ref: React.RefObject<any> | null) => void
  setRemoveDrawingFromCanvasFn: (fn: ((id: string) => void) | null) => void
}

// Create context
const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined)

// Provider component
interface WhiteboardProviderProps {
  children: ReactNode
  whiteboardId: string
  userId: string
}

export const WhiteboardProvider: React.FC<WhiteboardProviderProps> = ({
  children,
  whiteboardId,
  userId: _userId = 'system'
}) => {
  const [state, dispatch] = useReducer(whiteboardReducer, initialState)

  // Custom hooks
  const {
    drawings,
    addDrawing: addDrawingHook,
    updateDrawing: updateDrawingHook,
    deleteDrawing: deleteDrawingHook,
    clearDrawings: clearDrawingsHook,
    isLoading: drawingsLoading,
    error: drawingsError
  } = useDrawing(whiteboardId)

  const {
    stickyNotes,
    addStickyNote: addStickyNoteHook,
    updateStickyNote: updateStickyNoteHook,
    deleteStickyNote: deleteStickyNoteHook,
    clearStickyNotes: clearStickyNotesHook,
    isLoading: stickyNotesLoading,
    error: stickyNotesError
  } = useStickyNotes(whiteboardId)

  const {
    shapes,
    addShape: addShapeHook,
    updateShape: updateShapeHook,
    deleteShape: deleteShapeHook,
    clearShapes: clearShapesHook,
    isLoading: shapesLoading,
    error: shapesError
  } = useShapes(whiteboardId)

  const {
    texts,
    addText: addTextHook,
    updateText: updateTextHook,
    deleteText: deleteTextHook,
    clearTexts: clearTextsHook,
    isLoading: textsLoading,
    error: textsError
  } = useTexts(whiteboardId)

  // Use userId prop instead of useAuth to avoid circular dependency
  // const user = { id: userId }

  // Remove duplicate useUserPresence call - it's already handled in UserPresence component
  const users = useMemo(() => [], [])
  const usersLoading = false
  const usersError = null

  const {
    subscribeToDrawings,
    subscribeToStickyNotes,
    subscribeToShapes,
    subscribeToTexts,
    subscribeToUsers,
    unsubscribeFromDrawings,
    unsubscribeFromStickyNotes,
    unsubscribeFromShapes,
    unsubscribeFromTexts,
    unsubscribeFromUsers,
    isConnected
  } = useRealtimeSync(whiteboardId)

  // Set up real-time subscriptions when whiteboardId changes
  useEffect(() => {
    if (!whiteboardId) return
    
    console.log('🔄 Setting up real-time subscriptions for whiteboard:', whiteboardId)
    
    // Flag to prevent multiple subscriptions (React Strict Mode protection)
    let isSubscribed = true
    let subscriptionCleanup: (() => void)[] = []
    
    // Create unique channel names to prevent conflicts
    // const channelSuffix = `-${whiteboardId}-${Date.now()}`
    
    // Subscribe to all real-time events with handlers
    const drawingsUnsubscribe = subscribeToDrawings((event) => {
      if (!isSubscribed) return
      console.log('🔄 Real-time drawing event received:', event)
      console.log('🔄 Event action:', event.action)
      console.log('🔄 Event payload:', event.payload)
      
      if (event.action === 'INSERT' && event.payload) {
        console.log('🔄 Adding drawing from real-time event:', event.payload)
        dispatch({ type: 'ADD_DRAWING', payload: event.payload })
      } else if (event.action === 'UPDATE' && event.payload) {
        console.log('🔄 Updating drawing from real-time event:', event.payload)
        dispatch({ type: 'UPDATE_DRAWING', payload: event.payload })
      } else if (event.action === 'DELETE' && event.payload?.id) {
        console.log('🧹 Real-time DELETE event received for drawing:', event.payload.id)
        console.log('🧹 Current drawings before real-time delete:', state.drawings.map(d => d.id))
        dispatch({ type: 'DELETE_DRAWING', payload: event.payload.id })
        console.log('🧹 DELETE_DRAWING action dispatched from real-time event')
      }
    })
    
    // Sticky notes real-time updates are handled by useStickyNotes hook
    // This prevents duplicate subscriptions and conflicts
    const stickyNotesUnsubscribe = () => {} // No-op since useStickyNotes handles it
    
    // const shapesUnsubscribe = subscribeToShapes()
    // const textsUnsubscribe = subscribeToTexts()
    // const usersUnsubscribe = subscribeToUsers()
    
    // Store cleanup functions (only those that return functions)
    subscriptionCleanup = [
      drawingsUnsubscribe,
      stickyNotesUnsubscribe
    ].filter(fn => typeof fn === 'function') as (() => void)[]
    
    // Handle Page Visibility API for tab focus changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab became visible, checking real-time connection...')
        // Re-establish subscriptions when tab becomes visible
        setTimeout(() => {
          if (isSubscribed) {
            console.log('🔄 Re-establishing subscriptions after tab focus...')
            // Clean up existing subscriptions first
            subscriptionCleanup.forEach(cleanup => cleanup())
            
            // Re-subscribe
            subscriptionCleanup = [
              subscribeToDrawings(),
              subscribeToStickyNotes()
            ].filter(fn => typeof fn === 'function') as (() => void)[]
          }
        }, 500)
      } else {
        console.log('🔄 Tab became hidden, maintaining subscriptions...')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions for whiteboard:', whiteboardId)
      isSubscribed = false
      
      // Remove visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Call all unsubscribe functions
      subscriptionCleanup.forEach(cleanup => cleanup())
      
      // Also call the hook unsubscribe functions as backup
      unsubscribeFromDrawings()
      unsubscribeFromStickyNotes()
      unsubscribeFromShapes()
      unsubscribeFromTexts()
      unsubscribeFromUsers()
    }
  }, [whiteboardId, subscribeToDrawings, subscribeToStickyNotes, subscribeToShapes, subscribeToTexts, subscribeToUsers])

  // Set current whiteboard when whiteboardId changes
  useEffect(() => {
    if (whiteboardId) {
      const loadOrCreateWhiteboard = async () => {
        try {
          console.log('🔍 Checking if whiteboard exists:', whiteboardId)
          
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(whiteboardId)) {
            console.error('❌ Invalid UUID format for whiteboard ID:', whiteboardId)
            dispatch({ type: 'SET_ERROR', payload: 'Invalid whiteboard ID format. Please use a valid UUID.' })
            return
          }
          
          // First, try to load the whiteboard from database
          const { data: existingWhiteboard, error } = await supabase
            .from('whiteboards')
            .select('*')
            .eq('id', whiteboardId)
            .single()
          
          if (existingWhiteboard) {
            console.log('✅ Found existing whiteboard:', existingWhiteboard)
            dispatch({ type: 'SET_WHITEBOARD', payload: existingWhiteboard as Whiteboard })
            return
          }
          
          if (error && error.code === 'PGRST116') {
            // Whiteboard doesn't exist, create it
            console.log('📝 Whiteboard not found, creating new one...')
            
            const { data: newWhiteboard, error: createError } = await (supabase as any)
              .from('whiteboards')
              .insert({
                id: whiteboardId, // Use the whiteboardId from URL
                name: `Whiteboard ${whiteboardId.slice(0, 8)}`,
                settings: {
                  width: 1920,
                  height: 1080,
                  backgroundColor: '#FFFFFF'
                }
              })
              .select()
              .single()
            
            if (createError) {
              console.error('❌ Error creating whiteboard:', createError)
              dispatch({ type: 'SET_ERROR', payload: `Failed to create whiteboard: ${createError.message}` })
              return
            }
            
            console.log('✅ Created new whiteboard:', newWhiteboard)
            dispatch({ type: 'SET_WHITEBOARD', payload: newWhiteboard as Whiteboard })
          } else {
            console.error('❌ Error loading whiteboard:', error)
            dispatch({ type: 'SET_ERROR', payload: `Failed to load whiteboard: ${error?.message || 'Unknown error'}` })
          }
        } catch (error) {
          console.error('❌ Exception in loadOrCreateWhiteboard:', error)
          dispatch({ type: 'SET_ERROR', payload: `Failed to load whiteboard: ${error instanceof Error ? error.message : 'Unknown error'}` })
        }
      }
      
      loadOrCreateWhiteboard()
    }
  }, [whiteboardId])

  // Enhanced state sync with conflict detection and event recovery
  useEffect(() => {
    // Only update if we're not in the middle of a clear operation or undo/redo operation
    if (!state.isClearOperation && !state.isUndoRedoOperation) {
      console.log('Restoring drawings from database:', drawings.length)
      
      // Check if the drawings from database are significantly different from current state
      const currentDrawingIds = new Set(state.drawings.map(d => d.id))
      const dbDrawingIds = new Set(drawings.map(d => d.id))
      
      // Only restore if there are substantial differences (not just redo operations)
      const hasSignificantChanges = 
        currentDrawingIds.size !== dbDrawingIds.size ||
        Array.from(currentDrawingIds).some(id => !dbDrawingIds.has(id)) ||
        Array.from(dbDrawingIds).some(id => !currentDrawingIds.has(id))
      
      if (hasSignificantChanges) {
        console.log('Significant changes detected, restoring drawings from database')
        
        // Event recovery: Check for missed events
        const missedDrawings = drawings.filter(dbDrawing => !currentDrawingIds.has(dbDrawing.id))
        if (missedDrawings.length > 0) {
          console.log(`🔄 Event recovery: Found ${missedDrawings.length} missed drawings`)
          // Add missed drawings individually to trigger proper event handling
          missedDrawings.forEach(drawing => {
            dispatch({ type: 'ADD_DRAWING', payload: drawing })
          })
        } else {
          // No missed events, just restore normally
          dispatch({ type: 'SET_DRAWINGS', payload: drawings })
        }
      } else {
        console.log('No significant changes, skipping database restoration')
      }
    } else {
      console.log('Skipping drawings restoration - clear or undo/redo operation in progress')
    }
  }, [drawings, state.isClearOperation, state.isUndoRedoOperation, state.drawings])

  useEffect(() => {
    // Only update if we're not in the middle of a clear operation or undo/redo operation
    if (!state.isClearOperation && !state.isUndoRedoOperation) {
      console.log('Restoring sticky notes from database:', stickyNotes.length)
      
      // Check if the sticky notes from database are significantly different from current state
      const currentStickyNoteIds = new Set(state.stickyNotes.map(n => n.id))
      const dbStickyNoteIds = new Set(stickyNotes.map(n => n.id))
      
      // Only restore if there are substantial differences (not just real-time updates)
      const hasSignificantChanges = 
        currentStickyNoteIds.size !== dbStickyNoteIds.size ||
        Array.from(currentStickyNoteIds).some(id => !dbStickyNoteIds.has(id)) ||
        Array.from(dbStickyNoteIds).some(id => !currentStickyNoteIds.has(id))
      
      if (hasSignificantChanges) {
        console.log('Significant changes detected, restoring sticky notes from database')
        
        // Event recovery: Check for missed events
        const missedStickyNotes = stickyNotes.filter(dbNote => !currentStickyNoteIds.has(dbNote.id))
        if (missedStickyNotes.length > 0) {
          console.log(`🔄 Event recovery: Found ${missedStickyNotes.length} missed sticky notes`)
          // Add missed sticky notes individually to trigger proper event handling
          missedStickyNotes.forEach(note => {
            dispatch({ type: 'ADD_STICKY_NOTE', payload: note })
          })
        } else {
          // No missed events, just restore normally
          dispatch({ type: 'SET_STICKY_NOTES', payload: stickyNotes })
        }
      } else {
        console.log('No significant changes, skipping sticky notes restoration')
      }
    } else {
      console.log('Skipping sticky notes restoration - clear or undo/redo operation in progress')
    }
  }, [stickyNotes, state.isClearOperation, state.isUndoRedoOperation, state.stickyNotes])

  // Direct sync of sticky notes from hook to context state
  // This ensures real-time updates from useStickyNotes are reflected in the context
  useEffect(() => {
    if (!state.isClearOperation && !state.isUndoRedoOperation) {
      // Check if the hook state is different from context state
      const contextIds = new Set(state.stickyNotes.map(n => n.id))
      const hookIds = new Set(stickyNotes.map(n => n.id))
      
      // If IDs are different, sync the entire state
      if (contextIds.size !== hookIds.size || 
          Array.from(contextIds).some(id => !hookIds.has(id)) ||
          Array.from(hookIds).some(id => !contextIds.has(id))) {
        dispatch({ type: 'SET_STICKY_NOTES', payload: stickyNotes })
      } else {
        // Check for content/position changes in existing sticky notes
        const hasContentChanges = stickyNotes.some(hookNote => {
          const contextNote = state.stickyNotes.find(n => n.id === hookNote.id)
          if (!contextNote) return false
          
          return (
            contextNote.content !== hookNote.content ||
            contextNote.position.x !== hookNote.position.x ||
            contextNote.position.y !== hookNote.position.y ||
            contextNote.color !== hookNote.color
          )
        })
        
        if (hasContentChanges) {
          dispatch({ type: 'SET_STICKY_NOTES', payload: stickyNotes })
        }
      }
    }
  }, [stickyNotes, state.isClearOperation, state.isUndoRedoOperation])

  // Sync shapes from database
  useEffect(() => {
    // Only update if we're not in the middle of a clear operation or undo/redo operation
    if (!state.isClearOperation && !state.isUndoRedoOperation) {
      console.log('Restoring shapes from database:', shapes.length)
      
      // Convert shapes to canvas objects
      const shapeCanvasObjects = shapes.map(shape => ({
        ...shape,
        type: shape.type as 'rectangle' | 'circle' | 'line' | 'arrow'
      }))
      
      // Dispatch shapes separately - let the reducer handle merging
      dispatch({ type: 'SET_SHAPE_CANVAS_OBJECTS', payload: shapeCanvasObjects })
    } else {
      console.log('Skipping shapes restoration - clear or undo/redo operation in progress')
    }
  }, [shapes, state.isClearOperation, state.isUndoRedoOperation])

  // Sync texts from database
  useEffect(() => {
    // Only update if we're not in the middle of a clear operation or undo/redo operation
    if (!state.isClearOperation && !state.isUndoRedoOperation) {
      console.log('Restoring texts from database:', texts.length)
      
      // Convert texts to canvas objects
      const textCanvasObjects = texts.map(text => ({
        ...text,
        type: text.type as 'text'
      }))
      
      // Dispatch texts separately - let the reducer handle merging
      dispatch({ type: 'SET_TEXT_CANVAS_OBJECTS', payload: textCanvasObjects })
    } else {
      console.log('Skipping texts restoration - clear or undo/redo operation in progress')
    }
  }, [texts, state.isClearOperation, state.isUndoRedoOperation])

  useEffect(() => {
    dispatch({ type: 'SET_USERS', payload: users })
  }, [users])

  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected })
  }, [isConnected])

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: drawingsLoading || stickyNotesLoading || shapesLoading || textsLoading || usersLoading })
  }, [drawingsLoading, stickyNotesLoading, shapesLoading, textsLoading, usersLoading])

  useEffect(() => {
    const error = drawingsError || stickyNotesError || shapesError || textsError || usersError
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [drawingsError, stickyNotesError, shapesError, textsError, usersError])

  // Initialize undo/redo state
  useEffect(() => {
    dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
  }, [])

  // Drawing actions
  const addDrawing = async (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => {
    try {
      const newDrawing = await addDrawingHook(drawing)
      
      // Add to state
      dispatch({ type: 'ADD_DRAWING', payload: newDrawing })
      
      // Create and execute command
      const command = new AddDrawingCommand(
        newDrawing,
        addDrawingHook,
        deleteDrawingHook,
        dispatch,
        state.removeDrawingFromCanvasFn || undefined
      )
      
      await whiteboardCommandManager.executeCommand(command)
      dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add drawing' })
    }
  }

  const updateDrawing = async (id: string, updates: Partial<Drawing>) => {
    try {
      const updatedDrawing = await updateDrawingHook(id, updates)
      dispatch({ type: 'UPDATE_DRAWING', payload: updatedDrawing })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update drawing' })
    }
  }

  const deleteDrawing = async (id: string) => {
    try {
      console.log('🧹 WhiteboardContext deleteDrawing called for:', id)
      console.log('🧹 Current drawings before delete:', state.drawings.map(d => d.id))
      
      // Find the drawing to delete for undo purposes
      const drawingToDelete = state.drawings.find(d => d.id === id)
      
      if (drawingToDelete) {
        console.log('🧹 Found drawing in state, using command pattern')
        // Create and execute command
        const command = new DeleteDrawingCommand(
          drawingToDelete,
          addDrawingHook,
          deleteDrawingHook,
          dispatch,
          state.removeDrawingFromCanvasFn || undefined
        )
        
        console.log('🧹 About to execute DeleteDrawingCommand')
        await whiteboardCommandManager.executeCommand(command)
        console.log('🧹 Command executed, dispatching UPDATE_UNDO_REDO_STATE')
        dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
        console.log('🧹 Command executed successfully')
      } else {
        console.log('🧹 Drawing not found in state, deleting from database only')
        // Drawing not found in state, just delete from database
        try {
          await deleteDrawingHook(id)
          console.log('🧹 Successfully deleted drawing from database:', id)
        } catch (dbError) {
          console.warn('🧹 Drawing not found in database:', id)
        }
        dispatch({ type: 'DELETE_DRAWING', payload: id })
        console.log('🧹 DELETE_DRAWING action dispatched')
      }
      
    } catch (error) {
      console.error('ERROR: deleteDrawing failed:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete drawing' })
    }
  }

  const clearDrawings = async () => {
    try {
      console.log('Clearing drawings...')
      
      // Store current drawings for undo purposes
      const drawingsToClear = [...state.drawings]
      
      if (drawingsToClear.length > 0) {
        // Create and execute command
        const command = new ClearDrawingsCommand(
          drawingsToClear,
          clearDrawingsHook,
          addDrawingHook,
          dispatch
        )
        
        await whiteboardCommandManager.executeCommand(command)
        dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
      } else {
        // No drawings to clear, just perform the operation
        await clearDrawingsHook()
        dispatch({ type: 'SET_DRAWINGS', payload: [] })
      }
      
      console.log('Drawings cleared from context')
      
    } catch (error) {
      console.error('Clear drawings error:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clear drawings' })
    }
  }

  // Sticky note actions
  const addStickyNote = async (stickyNote: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'>) => {
    console.log('=== ADD STICKY NOTE CONTEXT DEBUG ===')
    console.log('addStickyNote called with:', stickyNote)
    
    try {
      console.log('Calling addStickyNoteHook...')
      const newStickyNote = await addStickyNoteHook(stickyNote)
      console.log('SUCCESS: addStickyNoteHook completed, new sticky note:', newStickyNote)
      
      // Add to state
      console.log('Dispatching ADD_STICKY_NOTE action...')
      dispatch({ type: 'ADD_STICKY_NOTE', payload: newStickyNote })
      console.log('SUCCESS: ADD_STICKY_NOTE action dispatched')
      
      // Create and execute command
      const command = new AddStickyNoteCommand(
        newStickyNote,
        addStickyNoteHook,
        deleteStickyNoteHook,
        dispatch
      )
      
      await whiteboardCommandManager.executeCommand(command)
      dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
      
      console.log('SUCCESS: addStickyNote completed successfully')
      
    } catch (error) {
      console.error('ERROR: addStickyNote failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add sticky note' })
    }
    console.log('=== END ADD STICKY NOTE CONTEXT DEBUG ===')
  }

  // Text object actions
  const addTextObject = async (textObject: Omit<TextObjectModel, 'id' | 'createdAt'>) => {
    try {
      console.log('addTextObject called with:', textObject)
      
      // Call the database hook for persistence
      console.log('Calling addTextHook...')
      const newTextObject = await addTextHook(textObject)
      console.log('SUCCESS: addTextHook completed, new text object:', newTextObject)
      
      // Add to local state for immediate UI update
      dispatch({ type: 'ADD_CANVAS_OBJECT', payload: newTextObject })
      
      console.log('SUCCESS: addTextObject completed successfully')
      
    } catch (error) {
      console.error('ERROR: addTextObject failed:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add text object' })
    }
  }

  // Shape object actions
  const addShapeObject = async (shapeObject: Omit<ShapeObjectModel, 'id' | 'createdAt'>) => {
    try {
      console.log('addShapeObject called with:', shapeObject)
      
      // Call the database hook for persistence
      console.log('Calling addShapeHook...')
      const newShapeObject = await addShapeHook(shapeObject)
      console.log('SUCCESS: addShapeHook completed, new shape object:', newShapeObject)
      
      // Add to local state for immediate UI update
      dispatch({ type: 'ADD_CANVAS_OBJECT', payload: newShapeObject })
      
      console.log('SUCCESS: addShapeObject completed successfully')
      
    } catch (error) {
      console.error('ERROR: addShapeObject failed:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add shape object' })
    }
  }

  const updateCanvasObject = async (id: string, updates: Partial<CanvasObjectModel>) => {
    try {
      // Find the existing canvas object
      const existingObject = state.canvasObjects.find(obj => obj.id === id)
      if (!existingObject) {
        throw new Error(`Canvas object with id ${id} not found`)
      }
      
      // Handle text and shape objects with database persistence
      if (existingObject.type === 'text') {
        await updateTextHook(id, updates as Partial<TextObjectModel>)
      } else {
        await updateShapeHook(id, updates as Partial<ShapeObjectModel>)
      }
      
      // Create updated object
      const updatedObject: CanvasObjectModel = {
        ...existingObject,
        ...updates
      } as CanvasObjectModel
      
      // Update state
      dispatch({ type: 'UPDATE_CANVAS_OBJECT', payload: updatedObject })
      
    } catch (error) {
      console.error('ERROR: updateCanvasObject failed:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update canvas object' })
    }
  }

  const deleteCanvasObject = async (id: string) => {
    try {
      // Check if object exists
      const existingObject = state.canvasObjects.find(obj => obj.id === id)
      if (!existingObject) {
        console.warn(`Canvas object with id ${id} not found`)
        return
      }
      
      // Handle text and shape objects with database persistence
      if (existingObject.type === 'text') {
        await deleteTextHook(id)
      } else {
        await deleteShapeHook(id)
      }
      
      // Remove from state
      dispatch({ type: 'DELETE_CANVAS_OBJECT', payload: id })
      
    } catch (error) {
      console.error('ERROR: deleteCanvasObject failed:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete canvas object' })
    }
  }

  const updateStickyNote = async (id: string, updates: Partial<StickyNote>) => {
    try {
      const updatedStickyNote = await updateStickyNoteHook(id, updates)
      dispatch({ type: 'UPDATE_STICKY_NOTE', payload: updatedStickyNote })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update sticky note' })
    }
  }

  const deleteStickyNote = async (id: string) => {
    try {
      console.log('🗑️ WhiteboardContext deleteStickyNote called for:', id)
      console.log('🗑️ Current sticky notes before delete:', state.stickyNotes.map(n => n.id))
      
      // Find the sticky note to delete for undo purposes
      const stickyNoteToDelete = state.stickyNotes.find(s => s.id === id)
      
      if (stickyNoteToDelete) {
        // Create and execute command
        const command = new DeleteStickyNoteCommand(
          stickyNoteToDelete,
          addStickyNoteHook,
          deleteStickyNoteHook,
          dispatch
        )
        
        await whiteboardCommandManager.executeCommand(command)
        dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
      } else {
        // Sticky note not found in state, just delete from database
        try {
          await deleteStickyNoteHook(id)
          console.log('Successfully deleted sticky note from database:', id)
        } catch (dbError) {
          console.warn('Sticky note not found in database:', id)
        }
        dispatch({ type: 'DELETE_STICKY_NOTE', payload: id })
      }
      
      console.log('Delete sticky note completed successfully')
      
    } catch (error) {
      console.error('Error in context deleteStickyNote:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete sticky note' })
    }
  }

  const clearStickyNotes = async () => {
    try {
      await clearStickyNotesHook()
      dispatch({ type: 'SET_STICKY_NOTES', payload: [] })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clear sticky notes' })
    }
  }

  // Tool actions
  const setSelectedTool = useCallback((tool: 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow') => {
    dispatch({ type: 'SET_SELECTED_TOOL', payload: tool })
  }, [])

  const setSelectedColor = useCallback((color: string) => {
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color })
  }, [])

  const setSelectedSize = useCallback((size: number) => {
    dispatch({ type: 'SET_SELECTED_SIZE', payload: size })
  }, [])

  // Sticky note color actions
  const setSelectedStickyNoteColor = useCallback((color: string) => {
    dispatch({ type: 'SET_SELECTED_STICKY_NOTE_COLOR', payload: color })
  }, [])

  const setStickyNoteColorMode = useCallback((mode: boolean) => {
    dispatch({ type: 'SET_STICKY_NOTE_COLOR_MODE', payload: mode })
  }, [])

  const toggleStickyNoteColorMode = useCallback(() => {
    dispatch({ type: 'SET_STICKY_NOTE_COLOR_MODE', payload: !state.isStickyNoteColorMode })
  }, [state.isStickyNoteColorMode])

  // View actions
  const setZoomLevel = (level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level })
  }

  const zoomIn = () => {
    const newLevel = Math.min(5, state.zoomLevel + 0.25)
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: newLevel })
  }

  const zoomOut = () => {
    const newLevel = Math.max(0.1, state.zoomLevel - 0.25)
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: newLevel })
  }

  const fitToScreen = () => {
    // Reset zoom to fit the canvas to screen
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: 1 })
  }

  const toggleFullscreen = () => {
    dispatch({ type: 'TOGGLE_FULLSCREEN' })
    
    if (!state.isFullscreen) {
      // Enter fullscreen
      const element = document.documentElement
      if (element.requestFullscreen) {
        element.requestFullscreen()
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Whiteboard actions
  const clearWhiteboard = async () => {
    try {
      console.log('Starting clear whiteboard...')
      console.log('Current drawings count:', state.drawings.length)
      console.log('Current sticky notes count:', state.stickyNotes.length)
      console.log('Current canvas objects count:', state.canvasObjects.length)
      
      // Set flag to prevent useEffect from overriding
      dispatch({ type: 'SET_CLEAR_OPERATION', payload: true })
      
      // Clear from database first - this will trigger real-time events
      console.log('🔄 Clearing database content...')
      await Promise.all([
        clearDrawingsHook(), 
        clearStickyNotesHook(),
        clearShapesHook(),
        clearTextsHook()
      ])
      
      console.log('🔄 Database clear operations completed, waiting for real-time events...')
      
      // Clear flag after a delay to allow real-time events to process
      setTimeout(() => {
        dispatch({ type: 'SET_CLEAR_OPERATION', payload: false })
        console.log('Clear operation completed, flag cleared')
      }, 2000) // Increased delay to allow real-time events to process
      
      console.log('Clear whiteboard completed')
    } catch (error) {
      console.error('Clear whiteboard error:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clear whiteboard' })
      // Clear flag on error
      dispatch({ type: 'SET_CLEAR_OPERATION', payload: false })
    }
  }

  const saveWhiteboard = async () => {
    try {
      // Implementation would save whiteboard state
      console.log('Saving whiteboard...')
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save whiteboard' })
    }
  }

  const exportWhiteboard = () => {
    try {
      const exportData = {
        whiteboard: state.currentWhiteboard,
        drawings: state.drawings,
        stickyNotes: state.stickyNotes,
        users: state.users,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whiteboard-${whiteboardId}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to export whiteboard' })
    }
  }

  // Enhanced Undo/Redo functions with atomic operations
  const undo = async () => {
    console.log('Undo called')
    
    try {
      // Set flag to prevent realtime sync during undo operation
      dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: true })
      
      const success = await whiteboardCommandManager.undo()
      if (success) {
        dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
        console.log('Undo operation completed successfully')
      } else {
        console.log('No more actions to undo')
      }
      
      // Clear flag after operation completes
      setTimeout(() => {
        dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: false })
      }, 1000) // Increased timeout to prevent immediate sync and flickering
      
    } catch (error) {
      console.error('Error during undo:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to undo action' })
      // Clear flag on error
      dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: false })
    }
  }

  const redo = async () => {
    console.log('Redo called')
    
    try {
      // Set flag to prevent realtime sync during redo operation
      dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: true })
      
      const success = await whiteboardCommandManager.redo()
      if (success) {
        dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
        console.log('Redo operation completed successfully')
      } else {
        console.log('No more actions to redo')
      }
      
      // Clear flag after operation completes
      setTimeout(() => {
        dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: false })
      }, 1000) // Increased timeout to prevent immediate sync and flickering
      
    } catch (error) {
      console.error('Error during redo:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to redo action' })
      // Clear flag on error
      dispatch({ type: 'SET_UNDO_REDO_OPERATION', payload: false })
    }
  }

  const clearHistory = () => {
    whiteboardCommandManager.clear()
    dispatch({ type: 'UPDATE_UNDO_REDO_STATE' })
    console.log('Command history cleared')
  }

  // Set drawing canvas ref
  const setDrawingCanvasRef = useCallback((ref: React.RefObject<any> | null) => {
    dispatch({ type: 'SET_DRAWING_CANVAS_REF', payload: ref })
  }, [])

  // Set remove drawing from canvas function
  const setRemoveDrawingFromCanvasFn = useCallback((fn: ((id: string) => void) | null) => {
    dispatch({ type: 'SET_REMOVE_DRAWING_FROM_CANVAS_FN', payload: fn })
  }, [])

  const contextValue: WhiteboardContextType = {
    state,
    dispatch,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    clearDrawings,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    clearStickyNotes,
    addTextObject,
    addShapeObject,
    updateCanvasObject,
    deleteCanvasObject,
    setSelectedTool,
    setSelectedColor,
    setSelectedSize,
    setSelectedStickyNoteColor,
    setStickyNoteColorMode,
    toggleStickyNoteColorMode,
    undo,
    redo,
    clearHistory,
    commandManager: whiteboardCommandManager,
    updateState: dispatch,
    removeDrawingFromCanvasFn: state.removeDrawingFromCanvasFn,
    setZoomLevel,
    zoomIn,
    zoomOut,
    fitToScreen,
    toggleFullscreen,
    clearWhiteboard,
    saveWhiteboard,
    exportWhiteboard,
    setDrawingCanvasRef,
    setRemoveDrawingFromCanvasFn
  }

  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  )
}

// Hook to use context
export const useWhiteboard = (): WhiteboardContextType => {
  const context = useContext(WhiteboardContext)
  if (context === undefined) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider')
  }
  return context
}

export default WhiteboardContext
