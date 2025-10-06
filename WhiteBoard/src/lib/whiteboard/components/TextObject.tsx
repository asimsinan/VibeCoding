'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Draggable from 'react-draggable'
import { CanvasObjectModel } from '../models/CanvasObjectModel'
import { useWhiteboard } from '../context/WhiteboardContext'

interface TextObjectProps {
  textObject: CanvasObjectModel
  whiteboardId: string
  userId: string
  isEditable?: boolean
  onUpdate?: (id: string, updates: Partial<CanvasObjectModel>) => void
  onDelete?: (id: string) => void
}

/**
 * TextObject Component
 * 
 * A draggable text component with real-time collaboration support.
 * Supports editing and position updates.
 * 
 * @param textObject - The text object data model
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 * @param isEditable - Whether the text can be edited by current user
 * @param onUpdate - Callback for updating the text object
 * @param onDelete - Callback for deleting the text object
 */
export const TextObject: React.FC<TextObjectProps> = ({
  textObject,
  whiteboardId,
  userId,
  isEditable = true,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(textObject.content)
  const [position, setPosition] = useState(textObject.position)
  const [color] = useState(textObject.color)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draggableRef = useRef<HTMLDivElement>(null)

  const { updateCanvasObject, deleteCanvasObject } = useWhiteboard()

  // Handle content editing
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  // Handle content save
  const handleContentSave = useCallback(() => {
    if (content.trim() === '') {
      setContent(textObject.content)
      setIsEditing(false)
      return
    }

    const updates: Partial<CanvasObjectModel> = {
      content: content.trim()
    }

    if (onUpdate) {
      onUpdate(textObject.id, updates)
    } else {
      updateCanvasObject(textObject.id, updates)
    }

    setIsEditing(false)
  }, [content, textObject.id, textObject.content, onUpdate, updateCanvasObject])

  // Handle content cancel
  // const handleContentCancel = useCallback(() => {
  //   setContent(textObject.content)
  //   setIsEditing(false)
  // }, [textObject.content])

  // Handle position change
  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition)
    
    const updates: Partial<CanvasObjectModel> = {
      position: newPosition
    }

    if (onUpdate) {
      onUpdate(textObject.id, updates)
    } else {
      updateCanvasObject(textObject.id, updates)
    }
  }, [textObject.id, onUpdate, updateCanvasObject])

  // Handle delete
  const handleDelete = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    try {
      if (onDelete) {
        onDelete(textObject.id)
      } else {
        await deleteCanvasObject(textObject.id)
      }
    } catch (error) {
      console.error('Error deleting text object:', error)
    }
  }, [textObject.id, onDelete, deleteCanvasObject])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Handle drag stop
  const handleDragStop = useCallback((e: any, data: any) => {
    setIsDragging(false)
    
    setPosition({ x: data.x, y: data.y })
    handlePositionChange({ x: data.x, y: data.y })
  }, [handlePositionChange])

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Type guard to ensure we have a text object
  if (textObject.type !== 'text') {
    console.error('TextObject received a non-text object:', textObject)
    return null
  }

  return (
    <Draggable
      nodeRef={draggableRef}
      position={position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      disabled={false}
      defaultPosition={{ x: 0, y: 0 }}
      // Performance optimizations
      enableUserSelectHack={true}
      cancel="textarea, input, .delete-btn, .edit-btn"
      scale={1}
      axis="both"
    >
      <div
        ref={draggableRef}
        className={`text-object group relative max-w-xs min-w-48 p-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm ${
          isDragging 
            ? 'scale-105 shadow-2xl rotate-1 transform-gpu' 
            : 'hover:shadow-2xl hover:scale-102 hover:-rotate-1 transition-all duration-300 ease-out'
        } ${isEditing ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-2xl' : ''}`}
        style={{ 
          backgroundColor: 'transparent',
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
            className="w-full h-24 border-none outline-none bg-transparent text-sm font-medium resize-none p-2"
            placeholder="Enter text..."
            maxLength={500}
            style={{ 
              color: color,
              fontSize: textObject.fontSize || 16,
              fontFamily: textObject.fontFamily || 'Arial',
              fontWeight: textObject.fontWeight || 'normal'
            }}
          />
        ) : (
          <div
            className="text-sm font-medium cursor-text min-h-[24px] w-full p-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isEditable && !isEditing) {
                setIsEditing(true)
              }
            }}
            style={{
              color: color,
              fontSize: textObject.fontSize || 16,
              fontFamily: textObject.fontFamily || 'Arial',
              fontWeight: textObject.fontWeight || 'normal'
            }}
          >
            {content || (
              <span className="text-gray-500 italic">Click to add text...</span>
            )}
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
                onClick={() => {
                  setIsEditing(true)
                }}
                title="Edit text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              {/* Delete button */}
              <button
                className="delete-btn w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-[9999] shadow-lg border border-white/20 backdrop-blur-sm"
                onClick={handleDelete}
                title="Delete text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* User indicator */}
        {textObject.userId !== userId && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl border-2 border-white text-xs text-white flex items-center justify-center shadow-lg backdrop-blur-sm font-semibold">
            {textObject.userId.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Subtle corner fold effect */}
        <div 
          className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white/20"
          style={{ 
            borderTopColor: 'transparent',
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

export default TextObject