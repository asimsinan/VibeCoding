'use client'

import React, { useState, useRef, useCallback } from 'react'
import Draggable from 'react-draggable'
import { CanvasObjectModel } from '../models/CanvasObjectModel'
import { useWhiteboard } from '../context/WhiteboardContext'

interface ShapeObjectProps {
  shapeObject: CanvasObjectModel
  whiteboardId: string
  userId: string
  isEditable?: boolean
  onUpdate?: (id: string, updates: Partial<CanvasObjectModel>) => void
  onDelete?: (id: string) => void
}

/**
 * ShapeObject Component
 * 
 * A draggable shape component with real-time collaboration support.
 * Supports editing and position updates.
 * 
 * @param shapeObject - The shape object data model
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 * @param isEditable - Whether the shape can be edited by current user
 * @param onUpdate - Callback for updating the shape object
 * @param onDelete - Callback for deleting the shape object
 */
export const ShapeObject: React.FC<ShapeObjectProps> = ({
  shapeObject,
  whiteboardId,
  userId,
  isEditable = true,
  onUpdate,
  onDelete
}) => {
  // Safe position initialization with null checks
  const [position, setPosition] = useState(() => {
    if (!shapeObject.startPoint || typeof shapeObject.startPoint.x !== 'number' || typeof shapeObject.startPoint.y !== 'number') {
      console.warn('ShapeObject: Invalid startPoint, using default position:', shapeObject.startPoint)
      return { x: 0, y: 0 }
    }
    return {
      x: shapeObject.startPoint.x,
      y: shapeObject.startPoint.y
    }
  })
  
  // Safe size initialization with null checks
  const [size] = useState(() => {
    if (!shapeObject.startPoint || !shapeObject.endPoint ||
        typeof shapeObject.startPoint.x !== 'number' || typeof shapeObject.startPoint.y !== 'number' ||
        typeof shapeObject.endPoint.x !== 'number' || typeof shapeObject.endPoint.y !== 'number') {
      console.warn('ShapeObject: Invalid startPoint or endPoint, using default size:', { startPoint: shapeObject.startPoint, endPoint: shapeObject.endPoint })
      return { width: 100, height: 100 }
    }
    return {
      width: Math.abs(shapeObject.endPoint.x - shapeObject.startPoint.x),
      height: Math.abs(shapeObject.endPoint.y - shapeObject.startPoint.y)
    }
  })
  const [strokeColor] = useState(shapeObject.strokeColor || '#000000')
  const [fillColor] = useState(shapeObject.fillColor || 'transparent')
  const [strokeWidth] = useState(shapeObject.strokeWidth || 2)
  const [isDragging, setIsDragging] = useState(false)
  const draggableRef = useRef<HTMLDivElement>(null)

  const { updateCanvasObject, deleteCanvasObject } = useWhiteboard()

  // Handle position change
  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition)
    
    const updates: Partial<CanvasObjectModel> = {
      startPoint: { x: newPosition.x, y: newPosition.y },
      endPoint: { 
        x: newPosition.x + size.width, 
        y: newPosition.y + size.height 
      }
    }

    if (onUpdate) {
      onUpdate(shapeObject.id, updates)
    } else {
      updateCanvasObject(shapeObject.id, updates)
    }
  }, [shapeObject.id, size.width, size.height, onUpdate, updateCanvasObject])

  // Handle delete
  const handleDelete = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    try {
      if (onDelete) {
        onDelete(shapeObject.id)
      } else {
        await deleteCanvasObject(shapeObject.id)
      }
    } catch (error) {
      console.error('Error deleting shape object:', error)
    }
  }, [shapeObject.id, onDelete, deleteCanvasObject])

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

  // Render shape based on type
  const renderShape = () => {
    // Ensure minimum size for visibility
    const minSize = 20
    const actualWidth = Math.max(size.width, minSize)
    const actualHeight = Math.max(size.height, minSize)
    
    const style = {
      width: `${actualWidth}px`,
      height: `${actualHeight}px`,
      stroke: strokeColor,
      fill: fillColor,
      strokeWidth: strokeWidth,
      border: 'none'
    }

    switch (shapeObject.type) {
      case 'rectangle':
        return (
          <div
            style={{
              ...style,
              backgroundColor: fillColor !== 'transparent' ? fillColor : 'transparent',
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: '4px'
            }}
          />
        )
      
      case 'circle':
        return (
          <div
            style={{
              ...style,
              backgroundColor: fillColor !== 'transparent' ? fillColor : 'transparent',
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: '50%'
            }}
          />
        )
      
      case 'line':
        return (
          <svg width={actualWidth} height={actualHeight} style={{ position: 'absolute' }}>
            <line
              x1={0}
              y1={0}
              x2={actualWidth}
              y2={actualHeight}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        )
      
      case 'arrow':
        return (
          <svg width={actualWidth} height={actualHeight} style={{ position: 'absolute' }}>
            <defs>
              <marker
                id={`arrowhead-${shapeObject.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={strokeColor}
                />
              </marker>
            </defs>
            <line
              x1={0}
              y1={actualHeight / 2}
              x2={actualWidth - 10}
              y2={actualHeight / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd={`url(#arrowhead-${shapeObject.id})`}
            />
          </svg>
        )
      
      default:
        return null
    }
  }

  // Type guard to ensure we have a shape object
  if (shapeObject.type === 'text') {
    console.error('ShapeObject received a text object:', shapeObject)
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
      cancel=".delete-btn, .edit-btn"
      scale={1}
      axis="both"
    >
      <div
        ref={draggableRef}
        className={`shape-object group relative max-w-xs min-w-48 p-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm ${
          isDragging 
            ? 'scale-105 shadow-2xl rotate-1 transform-gpu' 
            : 'hover:shadow-2xl hover:scale-102 hover:-rotate-1 transition-all duration-300 ease-out'
        }`}
        style={{ 
          backgroundColor: 'transparent',
          boxShadow: isDragging 
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)` 
            : `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1)`
        }}
      >
        {/* Shape */}
        <div className="flex items-center justify-center min-h-[48px]">
          {renderShape()}
        </div>

        {/* Controls */}
        {isEditable && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            <div className="flex gap-2">
              
              {/* Delete button */}
              <button
                className="delete-btn w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-[9999] shadow-lg border border-white/20 backdrop-blur-sm"
                onClick={handleDelete}
                title="Delete shape"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* User indicator */}
        {shapeObject.userId !== userId && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl border-2 border-white text-xs text-white flex items-center justify-center shadow-lg backdrop-blur-sm font-semibold">
            {shapeObject.userId.charAt(0).toUpperCase()}
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

export default ShapeObject