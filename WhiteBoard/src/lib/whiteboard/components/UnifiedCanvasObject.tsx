import React, { useRef, useState, useCallback } from 'react'
import { CanvasObjectModel } from '../models/CanvasObjectModel'
import { useDragManager } from '../hooks/useDragManager'

interface UnifiedCanvasObjectProps {
  object: CanvasObjectModel
  whiteboardId: string
  userId: string
  isEditable: boolean
  onUpdate: (id: string, updates: Partial<CanvasObjectModel>) => void
  onDelete: (id: string) => void
}

export const UnifiedCanvasObject: React.FC<UnifiedCanvasObjectProps> = ({
  object,
  whiteboardId: _whiteboardId,
  userId: _userId,
  isEditable,
  onUpdate,
  onDelete
}) => {
  const { dragState, startDrag, updateDrag, endDrag, isObjectDragging } = useDragManager()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(object.type === 'text' ? (object as any).content : '')
  const objectRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isEditable) return
    
    if (object.type === 'text') {
      // For text objects, check if clicking on the text itself
      const target = event.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return // Don't start drag if clicking on input
      }
    }

    const rect = objectRef.current?.getBoundingClientRect()
    if (!rect) return

    const startPos = {
      x: rect.left,
      y: rect.top
    }

    startDrag(object.id, startPos, event)
  }, [isEditable, object.id, object.type, startDrag])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    updateDrag(event)
  }, [updateDrag])

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.draggedObjectId === object.id) {
      // Calculate new position
      const rect = objectRef.current?.getBoundingClientRect()
      if (rect && dragState.startPosition && dragState.currentPosition) {
        const deltaX = dragState.currentPosition.x - dragState.startPosition.x
        const deltaY = dragState.currentPosition.y - dragState.startPosition.y
        
        if (object.type === 'text') {
          const textObj = object as any
          onUpdate(object.id, {
            position: {
              x: textObj.position.x + deltaX,
              y: textObj.position.y + deltaY
            }
          })
        } else {
          const shapeObj = object as any
          // Add null checks before accessing position properties
          if (!shapeObj.startPoint || !shapeObj.endPoint ||
              typeof shapeObj.startPoint.x !== 'number' || typeof shapeObj.startPoint.y !== 'number' ||
              typeof shapeObj.endPoint.x !== 'number' || typeof shapeObj.endPoint.y !== 'number') {
            console.warn('UnifiedCanvasObject: Invalid shape position data during drag:', shapeObj)
            return
          }
          
          onUpdate(object.id, {
            startPoint: {
              x: shapeObj.startPoint.x + deltaX,
              y: shapeObj.startPoint.y + deltaY
            },
            endPoint: {
              x: shapeObj.endPoint.x + deltaX,
              y: shapeObj.endPoint.y + deltaY
            }
          })
        }
      }
    }
    endDrag()
  }, [dragState, object, onUpdate, endDrag])

  const handleDoubleClick = useCallback(() => {
    if (object.type === 'text' && isEditable) {
      setIsEditing(true)
      setEditContent((object as any).content)
    }
  }, [object, isEditable])

  const handleContentSave = useCallback(() => {
    if (object.type === 'text') {
      onUpdate(object.id, { content: editContent })
      setIsEditing(false)
    }
  }, [object, editContent, onUpdate])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleContentSave()
    } else if (event.key === 'Escape') {
      setIsEditing(false)
      setEditContent((object as any).content)
    }
  }, [handleContentSave, object])

  const renderContent = () => {
    if (object.type === 'text') {
      const textObj = object as any
      if (isEditing) {
        return (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent text-inherit font-inherit"
            autoFocus
            style={{
              fontSize: textObj.fontSize,
              color: textObj.color,
              fontFamily: textObj.fontFamily,
              fontWeight: textObj.fontWeight
            }}
          />
        )
      }
      return (
        <div
          className="w-full h-full cursor-move select-text"
          style={{
            fontSize: textObj.fontSize,
            color: textObj.color,
            fontFamily: textObj.fontFamily,
            fontWeight: textObj.fontWeight
          }}
        >
          {textObj.content}
        </div>
      )
    } else {
      // Render shape
      const shapeObj = object as any
      
      // Add null checks before calculating dimensions
      if (!shapeObj.startPoint || !shapeObj.endPoint ||
          typeof shapeObj.startPoint.x !== 'number' || typeof shapeObj.startPoint.y !== 'number' ||
          typeof shapeObj.endPoint.x !== 'number' || typeof shapeObj.endPoint.y !== 'number') {
        console.warn('UnifiedCanvasObject: Invalid shape dimensions, using defaults:', shapeObj)
        return (
          <div style={{ width: 100, height: 100, border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}>
            Invalid Shape
          </div>
        )
      }
      
      const width = Math.abs(shapeObj.endPoint.x - shapeObj.startPoint.x)
      const height = Math.abs(shapeObj.endPoint.y - shapeObj.startPoint.y)
      
      return (
        <svg
          width={width}
          height={height}
          className="cursor-move"
          style={{ display: 'block' }}
        >
          {object.type === 'rectangle' && (
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={shapeObj.fillColor}
              stroke={shapeObj.strokeColor}
              strokeWidth={shapeObj.strokeWidth}
            />
          )}
          {object.type === 'circle' && (
            <circle
              cx={width / 2}
              cy={height / 2}
              r={Math.min(width, height) / 2}
              fill={shapeObj.fillColor}
              stroke={shapeObj.strokeColor}
              strokeWidth={shapeObj.strokeWidth}
            />
          )}
          {object.type === 'line' && (
            <line
              x1={0}
              y1={0}
              x2={width}
              y2={height}
              stroke={shapeObj.strokeColor}
              strokeWidth={shapeObj.strokeWidth}
            />
          )}
          {object.type === 'arrow' && (
            <g>
              <line
                x1={0}
                y1={height / 2}
                x2={width - 10}
                y2={height / 2}
                stroke={shapeObj.strokeColor}
                strokeWidth={shapeObj.strokeWidth}
              />
              <polygon
                points={`${width - 10},${height / 2 - 5} ${width},${height / 2} ${width - 10},${height / 2 + 5}`}
                fill={shapeObj.strokeColor}
              />
            </g>
          )}
        </svg>
      )
    }
  }

  const getObjectPosition = () => {
    if (object.type === 'text') {
      const textObj = object as any
      if (!textObj.position || typeof textObj.position.x !== 'number' || typeof textObj.position.y !== 'number') {
        console.warn('Text object missing valid position:', textObj)
        return { x: 0, y: 0 }
      }
      return textObj.position
    } else {
      const shapeObj = object as any
      if (!shapeObj.startPoint || typeof shapeObj.startPoint.x !== 'number' || typeof shapeObj.startPoint.y !== 'number') {
        console.warn('Shape object missing valid startPoint:', shapeObj)
        return { x: 0, y: 0 }
      }
      return shapeObj.startPoint
    }
  }

  const getObjectSize = () => {
    if (object.type === 'text') {
      return { width: 'auto', height: 'auto' }
    } else {
      const shapeObj = object as any
      
      // Add comprehensive null checks for shape properties
      if (!shapeObj || typeof shapeObj !== 'object') {
        console.warn('Invalid shape object:', shapeObj)
        return { width: 20, height: 20 }
      }
      
      if (!shapeObj.startPoint || !shapeObj.endPoint) {
        console.warn('Shape object missing startPoint or endPoint:', shapeObj)
        return { width: 20, height: 20 }
      }
      
      if (typeof shapeObj.startPoint.x !== 'number' || typeof shapeObj.startPoint.y !== 'number' ||
          typeof shapeObj.endPoint.x !== 'number' || typeof shapeObj.endPoint.y !== 'number') {
        console.warn('Shape object has invalid coordinate types:', shapeObj)
        return { width: 20, height: 20 }
      }
      
      const width = Math.abs(shapeObj.endPoint.x - shapeObj.startPoint.x)
      const height = Math.abs(shapeObj.endPoint.y - shapeObj.startPoint.y)
      return { width: Math.max(width, 20), height: Math.max(height, 20) }
    }
  }

  const position = getObjectPosition()
  const size = getObjectSize()
  const isDragging = isObjectDragging(object.id)

  return (
    <div
      ref={objectRef}
      className={`absolute select-none ${isDragging ? 'z-50' : 'z-10'} ${isEditable ? 'cursor-move' : 'cursor-default'}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
    </div>
  )
}
