'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Draggable from 'react-draggable'
import { StickyNote as StickyNoteModel } from '../models/StickyNote'
import { useStickyNotes } from '../hooks/useStickyNotes'
// import { useWhiteboard } from '../context/WhiteboardContext'

interface StickyNoteProps {
  stickyNote: StickyNoteModel
  whiteboardId: string
  userId: string
  isEditable?: boolean
  onUpdate?: (id: string, updates: Partial<StickyNoteModel>) => void
  onDelete?: (id: string) => void
}

/**
 * StickyNote Component
 * 
 * A draggable sticky note component with real-time collaboration support.
 * Supports editing, color changes, and position updates.
 * 
 * @param stickyNote - The sticky note data model
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 * @param isEditable - Whether the note can be edited by current user
 * @param onUpdate - Callback for updating the sticky note
 * @param onDelete - Callback for deleting the sticky note
 */
export const StickyNote: React.FC<StickyNoteProps> = ({
  stickyNote,
  whiteboardId,
  userId,
  isEditable = true,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(stickyNote.content)
  const [position, setPosition] = useState(stickyNote.position)
  const [color, setColor] = useState(stickyNote.color)
  const [isDragging, setIsDragging] = useState(false)
  // Removed isResizing state to prevent infinite loops
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draggableRef = useRef<HTMLDivElement>(null)

  const { updateStickyNote, deleteStickyNote } = useStickyNotes(whiteboardId)
  // const { state } = useWhiteboard()

  // Debug effect to check if button is rendered
  useEffect(() => {
    console.log('Sticky note rendered - isEditable:', isEditable, 'stickyNote.id:', stickyNote.id)
  }, [isEditable, stickyNote.id])

  // Sync local state with prop changes (for real-time updates)
  useEffect(() => {
    console.log('🔄 StickyNote: Prop change detected for user:', userId, 'stickyNote:', {
      id: stickyNote.id,
      content: stickyNote.content,
      position: stickyNote.position,
      color: stickyNote.color
    })
    
    setContent(stickyNote.content)
    setPosition(stickyNote.position)
    setColor(stickyNote.color)
  }, [stickyNote.content, stickyNote.position, stickyNote.color, stickyNote.id, userId])

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    console.log('🎨 StickyNote component mounted:', stickyNote.id)
    return () => {
      console.log('🎨 StickyNote component unmounting:', stickyNote.id)
    }
  }, [stickyNote.id])



  // Handle content editing
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  // Handle content save
  const handleContentSave = useCallback(() => {
    if (content.trim() === '') {
      setContent(stickyNote.content)
      setIsEditing(false)
      return
    }

    const updates: Partial<StickyNoteModel> = {
      content: content.trim(),
      updatedAt: new Date()
    }

    if (onUpdate) {
      onUpdate(stickyNote.id, updates)
    } else {
      updateStickyNote(stickyNote.id, updates)
    }

    setIsEditing(false)
  }, [content, stickyNote.id, stickyNote.content, onUpdate, updateStickyNote])

  // Handle content cancel
  // const handleContentCancel = useCallback(() => {
  //   setContent(stickyNote.content)
  //   setIsEditing(false)
  // }, [stickyNote.content])


  // Debounce timer ref for position updates
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle position change with debouncing for better real-time sync
  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    console.log('Position change for sticky note:', stickyNote.id, 'New position:', newPosition)
    setPosition(newPosition)
    
    // Clear existing timeout
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current)
    }
    
    // Debounce the database update to prevent too many rapid updates
    positionUpdateTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Updating sticky note position in database:', stickyNote.id, newPosition)
      
      const updates: Partial<StickyNoteModel> = {
        position: newPosition,
        updatedAt: new Date()
      }

      if (onUpdate) {
        onUpdate(stickyNote.id, updates)
      } else {
        updateStickyNote(stickyNote.id, updates)
      }
    }, 150) // 150ms debounce for smoother real-time sync
  }, [stickyNote.id, onUpdate, updateStickyNote])

  // Removed color mode functionality to simplify sticky note creation

  // Handle resize events
  // Removed handleResizeStart and handleResizeEnd to prevent infinite loops
  // These functions were causing ResizeObserver infinite loops

  // Handle resize events - DISABLED to prevent infinite loops
  // The ResizeObserver was causing infinite loops because handleResizeEnd updates position
  // which triggers another resize event. We'll handle resize differently.
  /*
  useEffect(() => {
    const element = draggableRef.current
    if (!element) return

    let resizeTimeout: NodeJS.Timeout | null = null

    const handleResize = () => {
      console.log('Sticky note resized')
      
      // Debounce resize events to prevent infinite loops
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      resizeTimeout = setTimeout(() => {
        handleResizeEnd()
      }, 100) // 100ms debounce
    }

    // Listen for resize events
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  }, [handleResizeEnd])
  */

  // Handle delete
  const handleDelete = useCallback(async (e?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('🗑️ Delete button clicked for sticky note:', stickyNote.id)
    console.log('🗑️ Current sticky note state:', {
      id: stickyNote.id,
      content: stickyNote.content,
      position: stickyNote.position,
      color: stickyNote.color
    })
    
    try {
      if (onDelete) {
        console.log('🗑️ Using onDelete callback')
        onDelete(stickyNote.id)
      } else {
        console.log('🗑️ Using deleteStickyNote hook')
        await deleteStickyNote(stickyNote.id)
        console.log('🗑️ Delete completed successfully')
      }
    } catch (error) {
      console.error('🗑️ Error deleting sticky note:', error)
      // Don't throw the error to prevent UI crashes
    }
  }, [stickyNote.id, onDelete, deleteStickyNote])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    console.log('Drag started for sticky note:', stickyNote.id)
    setIsDragging(true)
  }, [stickyNote.id])

  // Handle drag stop
  const handleDragStop = useCallback((e: any, data: any) => {
    console.log('Drag stopped for sticky note:', stickyNote.id, 'New position:', data.x, data.y)
    setIsDragging(false)
    
    // Update React state with final position
    setPosition({ x: data.x, y: data.y })
    handlePositionChange({ x: data.x, y: data.y })
  }, [handlePositionChange, stickyNote.id])


  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current)
      }
    }
  }, [])


  return (
    <Draggable
      nodeRef={draggableRef}
      position={position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={false}
      defaultPosition={{ x: 0, y: 0 }}
      // Performance optimizations
      enableUserSelectHack={false}
      cancel="textarea, input, .delete-btn, .edit-btn"
      scale={1}
      axis="both"
    >
      <div
        ref={draggableRef}
        className={`sticky-note group relative max-w-xs min-w-48 p-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm ${
          isDragging 
            ? 'scale-105 shadow-2xl rotate-1 transform-gpu' 
            : 'hover:shadow-2xl hover:scale-102 hover:-rotate-1 transition-all duration-300 ease-out'
        } ${isEditing ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-2xl' : ''}`}
        style={{ 
          backgroundColor: color,
          backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: isDragging 
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)` 
            : `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1)`
        }}
      >
        {/* Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleContentSave}
            className="w-full h-24 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl outline-none resize-none text-sm font-medium text-gray-800 placeholder-gray-600 px-3 py-2 focus:bg-white/30 focus:border-white/50 transition-all duration-200"
            placeholder="Enter your note..."
            maxLength={500}
            style={{ 
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />
        ) : (
          <div
            className="sticky-content text-sm font-medium cursor-text min-h-[24px] w-full p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group-hover:bg-white/10"
            onMouseDown={(e) => {
              // Prevent dragging when clicking on content
              e.stopPropagation()
            }}
            onMouseUp={(e) => {
              // Handle click on mouse up to avoid conflicts with drag
              e.preventDefault()
              e.stopPropagation()
              console.log('Sticky note mouse up, isEditable:', isEditable, 'isEditing:', isEditing, 'userId:', userId, 'stickyNote.userId:', stickyNote.userId)
              if (isEditable && !isEditing && !isDragging) {
                console.log('Setting editing mode to true')
                setIsEditing(true)
              }
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Sticky note clicked, isEditable:', isEditable, 'isEditing:', isEditing, 'userId:', userId, 'stickyNote.userId:', stickyNote.userId)
              if (isEditable && !isEditing) {
                console.log('Setting editing mode to true')
                setIsEditing(true)
              }
            }}
            onDoubleClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Sticky note double-clicked, isEditable:', isEditable, 'isEditing:', isEditing)
              if (isEditable && !isEditing) {
                console.log('Setting editing mode to true (double-click)')
                setIsEditing(true)
              }
            }}
          >
            <div className="text-gray-800 leading-relaxed">
              {content || (
                <span className="text-gray-500 italic">Click to add a note...</span>
              )}
            </div>
          </div>
        )}

        {/* Character count */}
        {isEditing && (
          <div className="text-xs text-gray-600 mt-2 px-1 bg-white/20 rounded-lg backdrop-blur-sm inline-block">
            {content.length}/500
          </div>
        )}

        {/* Controls */}
        {isEditable && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            <div className="flex gap-2">
              
              {/* Edit button */}
              <button
                className="edit-btn w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm hover:from-blue-600 hover:to-blue-700 hover:scale-110 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-[9999] shadow-lg border border-white/20 backdrop-blur-sm"
                onClick={(e) => {
                  console.log('Edit button clicked for sticky note:', stickyNote.id)
                  console.log('Event target:', e.target)
                  console.log('Event currentTarget:', e.currentTarget)
                  setIsEditing(true)
                }}
                title="Edit note"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              {/* Delete button */}
              <button
                className="delete-btn w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-[9999] shadow-lg border border-white/20 backdrop-blur-sm"
                onClick={handleDelete}
                title="Delete note"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* User indicator */}
        {stickyNote.userId && stickyNote.userId !== userId && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl border-2 border-white text-xs text-white flex items-center justify-center shadow-lg backdrop-blur-sm font-semibold">
            {stickyNote.userId.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Subtle corner fold effect */}
        <div 
          className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white/20"
          style={{ 
            borderTopColor: `${color}dd`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />

        {/* Subtle texture overlay */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 1px, transparent 1px),
                             radial-gradient(circle at 40% 60%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px, 15px 15px, 25px 25px'
          }}
        />

        {/* Hover group */}
        <div className="absolute inset-0 group" />
      </div>
    </Draggable>
  )
}

export default StickyNote