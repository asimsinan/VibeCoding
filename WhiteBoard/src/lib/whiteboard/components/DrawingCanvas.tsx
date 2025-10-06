'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { fabric } from 'fabric'
import { Drawing } from '../models/Drawing'
// Real-time sync is handled by WhiteboardContext
import { useWhiteboard } from '../context/WhiteboardContext'

interface DrawingCanvasProps {
  whiteboardId: string
  userId: string
  width?: number
  height?: number
  className?: string
}

/**
 * DrawingCanvas Component
 * 
 * A collaborative drawing canvas using Fabric.js with real-time synchronization.
 * Supports drawing tools (pen, brush, eraser) with real-time collaboration.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 * @param width - Canvas width (optional, defaults to container size or 1920)
 * @param height - Canvas height (optional, defaults to container size or 1080)
 * @param className - Additional CSS classes
 */
export const DrawingCanvas = React.forwardRef<any, DrawingCanvasProps>(({
  whiteboardId,
  userId,
  width,
  height,
  className = ''
}, ref) => {
  console.log('=== DRAWING CANVAS COMPONENT MOUNTED ===')
  console.log('Props:', { whiteboardId, userId, width, height, className })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const isInitializedRef = useRef(false)
  const lastSyncDrawingsRef = useRef<string>('') // Track last synced drawings to prevent unnecessary updates
  const localDrawingObjectsRef = useRef<Map<string, fabric.Path>>(new Map()) // Track local drawing objects
  const localDrawingIdsRef = useRef<Set<string>>(new Set()) // Track IDs of drawings being created locally
  const removeDrawingFromCanvasRef = useRef<((drawingId: string) => void) | null>(null)

  const { addDrawing, updateDrawing, deleteDrawing, state } = useWhiteboard()

  // Use drawings from context instead of useDrawing hook
  const drawings = state.drawings
  
  // Memoize drawings to prevent unnecessary re-renders
  const memoizedDrawings = useMemo(() => drawings, [drawings.length, drawings.map((d: Drawing) => d.id).join(',')])
  
  console.log('DrawingCanvas - drawings from context:', memoizedDrawings.length, 'IDs:', memoizedDrawings.map((d: Drawing) => d.id))

  // Helper function to ensure canvas context is valid
  const ensureCanvasContext = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return false

    try {
      const context = canvas.getContext()
      if (!context) {
        console.warn('Canvas context lost, attempting to restore...')
        // Try to reinitialize the canvas
        if (canvasRef.current) {
          canvas.setDimensions({ 
            width: width || canvas.width || 1920, 
            height: height || canvas.height || 1080 
          })
          // Force canvas to reinitialize
          canvas.renderAll()
          return true
        }
        return false
      }
      
      // Additional check: verify context is working
      try {
        context.save()
        context.restore()
      } catch (error) {
        console.warn('Canvas context is invalid, reinitializing...')
        canvas.dispose()
        isInitializedRef.current = false
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking canvas context:', error)
      return false
    }
  }, [width, height])

  // Get current tool, color, size, and zoom from context
  const currentTool = state.selectedTool
  const currentColor = state.selectedColor
  const currentSize = state.selectedSize
  const zoomLevel = state.zoomLevel
  
  console.log('DrawingCanvas - Current tool:', currentTool, 'Color:', currentColor, 'Size:', currentSize)
  
  // Debug eraser tool selection
  if (currentTool === 'eraser') {
    console.log('🧹 ERASER TOOL SELECTED - Ready for erasing!')
  }

  // Initialize Fabric.js canvas
  useEffect(() => {
    console.log('=== CANVAS INITIALIZATION DEBUG ===')
    console.log('Canvas ref:', canvasRef.current)
    console.log('Is initialized:', isInitializedRef.current)
    
    if (!canvasRef.current || isInitializedRef.current) {
      console.log('Skipping initialization - canvas ref null or already initialized')
      return
    }

    // Small delay to ensure canvas is fully mounted
    const timer = setTimeout(() => {
      console.log('Timer fired - checking canvas again')
      console.log('Canvas ref after timer:', canvasRef.current)
      console.log('Is initialized after timer:', isInitializedRef.current)
      
      if (!canvasRef.current || isInitializedRef.current) {
        console.log('Skipping initialization after timer')
        return
      }

      try {
        console.log('Starting canvas initialization...')
        
        // Dispose existing canvas if any
        if (fabricCanvasRef.current) {
          console.log('Disposing existing canvas')
          fabricCanvasRef.current.dispose()
        }

        // Get container dimensions for responsive sizing
        const containerWidth = canvasRef.current.offsetWidth || width || 1920
        const containerHeight = canvasRef.current.offsetHeight || height || 1080
        
        console.log('Canvas element dimensions:', canvasRef.current.offsetWidth, 'x', canvasRef.current.offsetHeight)
        console.log('Props dimensions:', width, 'x', height)
        console.log('Final dimensions:', containerWidth, 'x', containerHeight)
        
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: '#ffffff',
          selection: false,
          preserveObjectStacking: true,
          enableRetinaScaling: false, // Disable retina scaling to avoid context issues
          skipTargetFind: true // Skip target finding for better performance
        })
        
        console.log('Fabric canvas created:', canvas)
        console.log('Canvas initialized with dimensions:', containerWidth, 'x', containerHeight)

        // Verify canvas context is available and valid
        const context = canvas.getContext()
        if (!context) {
          console.error('Canvas context not available')
          canvas.dispose()
          return
        }

        fabricCanvasRef.current = canvas
        isInitializedRef.current = true

        // Disable Fabric.js built-in drawing - we handle drawing through mouse events
        canvas.isDrawingMode = false
        
        // Calculate canvas offset for proper positioning
        canvas.calcOffset()
        console.log('Canvas offset calculated:', canvas.calcOffset())
        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
        console.log('Canvas isDrawingMode:', canvas.isDrawingMode)
        console.log('Canvas selection:', canvas.selection)

        console.log('Canvas initialized successfully')
      } catch (error) {
        console.error('Failed to initialize canvas:', error)
        isInitializedRef.current = false
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
        } catch (error) {
          console.error('Error disposing canvas:', error)
        }
        fabricCanvasRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [width, height])

  // Update brush configuration when color, size, or tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !isInitializedRef.current) return

    // Add a small delay to ensure canvas is fully ready
    const timer = setTimeout(() => {
      // Double-check canvas is still valid
      if (!fabricCanvasRef.current || !isInitializedRef.current) return

      // Ensure canvas context is valid before proceeding
      if (!ensureCanvasContext()) {
        console.warn('Canvas context not available, skipping brush update')
        return
      }

      // console.log('Updating brush:', { currentTool, currentSize, currentColor })

      try {
        // Handle tool changes
        switch (currentTool) {
          case 'pen':
            // Disable Fabric.js drawing - we handle through mouse events
            canvas.isDrawingMode = false
            canvas.selection = false // Disable selection mode for drawing
            // Reset cursor for drawing tools
            canvas.defaultCursor = 'crosshair'
            canvas.hoverCursor = 'crosshair'
            canvas.moveCursor = 'crosshair'
            console.log('Pen tool configured - using mouse events')
            console.log('Selection mode disabled:', canvas.selection)
            break
          case 'brush':
            // Disable Fabric.js drawing - we handle through mouse events
            canvas.isDrawingMode = false
            canvas.selection = false // Disable selection mode for drawing
            // Reset cursor for drawing tools
            canvas.defaultCursor = 'crosshair'
            canvas.hoverCursor = 'crosshair'
            canvas.moveCursor = 'crosshair'
            console.log('Brush tool configured - using mouse events')
            console.log('Selection mode disabled:', canvas.selection)
            break
          case 'eraser':
            canvas.isDrawingMode = false // Disable drawing mode for eraser
            canvas.selection = false // Disable selection mode for eraser
            // Set cursor to indicate eraser mode
            canvas.defaultCursor = 'crosshair'
            canvas.hoverCursor = 'crosshair'
            canvas.moveCursor = 'crosshair'
            console.log('Eraser mode enabled with crosshair cursor')
            console.log('Selection mode disabled:', canvas.selection)
            break
        }
      } catch (error) {
        console.error('Error updating brush:', error)
      }
    }, 50) // Small delay to ensure canvas is ready

    return () => clearTimeout(timer)
  }, [currentTool, currentColor, currentSize, ensureCanvasContext])

  // Apply zoom level to canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !isInitializedRef.current) return

    try {
      canvas.setZoom(zoomLevel)
      canvas.renderAll()
    } catch (error) {
      console.error('Error applying zoom:', error)
    }
  }, [zoomLevel])

  // Helper function to erase objects at a specific point
  const eraseObjectsAtPoint = useCallback((canvas: fabric.Canvas, x: number, y: number) => {
    console.log('eraseObjectsAtPoint called at:', x, y)
    
    const objects = canvas.getObjects()
    console.log('Total objects on canvas:', objects.length)
    
    const eraserSize = Math.max(currentSize * 10, 20) // Make eraser area much larger, minimum 20px
    console.log('Eraser size:', eraserSize, 'Current size:', currentSize)
    
    // Find objects within eraser area
    const objectsToErase = objects.filter(obj => {
      const objBounds = obj.getBoundingRect()
      
      // Check if eraser point is within object bounds (most accurate)
      const isWithinBounds = x >= objBounds.left && 
                            x <= objBounds.left + objBounds.width &&
                            y >= objBounds.top && 
                            y <= objBounds.top + objBounds.height
      
      if (isWithinBounds) {
        console.log(`Object ${(obj as any).id || 'unknown'}: within bounds`)
        return true
      }
      
      // If not within bounds, check distance to object center
      const centerX = objBounds.left + objBounds.width / 2
      const centerY = objBounds.top + objBounds.height / 2
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + 
        Math.pow(y - centerY, 2)
      )
      
      console.log(`Object ${(obj as any).id || 'unknown'}: distance=${distance.toFixed(2)}, eraserSize=${eraserSize}`)
      
      return distance <= eraserSize
    })
    
    console.log('Objects to erase:', objectsToErase.length)
    
    // Remove objects that are within eraser range
    objectsToErase.forEach(obj => {
      const drawingId = (obj as any).id
        if (drawingId) {
        console.log('🧹 Erasing drawing:', drawingId)
        console.log('🧹 About to call deleteDrawing for:', drawingId)
        
        // Use the proper removal method instead of direct canvas.remove
        // This ensures proper cleanup and synchronization
        if (removeDrawingFromCanvasRef.current) {
          removeDrawingFromCanvasRef.current(drawingId)
        } else {
          console.warn('🧹 removeDrawingFromCanvas function not available, using direct canvas.remove')
          canvas.remove(obj)
        }
        
        // Delete from database
        try {
          deleteDrawing(drawingId)
          console.log('🧹 deleteDrawing called successfully for:', drawingId)
        } catch (error) {
          console.error('🧹 Error calling deleteDrawing:', error)
        }
      } else {
        console.log('🧹 Object has no ID, removing from canvas only')
        canvas.remove(obj)
      }
    })
    
    if (objectsToErase.length > 0) {
      canvas.renderAll()
      console.log(`Erased ${objectsToErase.length} objects`)
    } else {
      console.log('No objects found within eraser range')
    }
  }, [currentSize, deleteDrawing])

  // Track current stroke for command creation
  const currentStrokeRef = useRef<{
    startTime: number
    points: Array<{x: number, y: number}>
    tool: 'pen' | 'brush' | 'eraser'
    color: string
    size: number
    tempPath: fabric.Path | null // Track temporary visual path
  } | null>(null)


  // Handle mouse events for all tools
  const handleMouseDown = useCallback((event: fabric.IEvent) => {
    const canvas = fabricCanvasRef.current
    console.log('=== MOUSE DOWN EVENT DEBUG ===')
    console.log('Mouse down event triggered, currentTool:', currentTool)
    console.log('Canvas available:', !!canvas)
    console.log('Canvas initialized:', isInitializedRef.current)
    console.log('Event:', event)
    console.log('Event target:', event.target)
    console.log('Event e:', event.e)
    
    if (!canvas) {
      console.error('No canvas available for mouse down event')
      return
    }
    
    if (currentTool === 'eraser') {
      console.log('Eraser tool - handling eraser logic')
    const pointer = canvas.getPointer(event.e)
      console.log('Eraser mouse down at:', pointer.x, pointer.y)
      
      // Find and remove objects under the mouse cursor
      eraseObjectsAtPoint(canvas, pointer.x, pointer.y)
      return
    }
    
    // For pen and brush tools, start tracking a new stroke
    if (currentTool === 'pen' || currentTool === 'brush') {
      console.log('Starting new stroke for tool:', currentTool)
      console.log('Current color:', currentColor, 'Current size:', currentSize)
      currentStrokeRef.current = {
        startTime: Date.now(),
        points: [],
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        tempPath: null
      }
      console.log('Current stroke initialized:', currentStrokeRef.current)
    } else {
      console.log('Tool not supported for drawing:', currentTool)
      console.log('Available drawing tools:', ['pen', 'brush', 'eraser'])
    }
    console.log('=== END MOUSE DOWN DEBUG ===')
  }, [currentTool, currentColor, currentSize, eraseObjectsAtPoint])

  // Handle mouse up events to complete strokes
  const handleMouseUp = useCallback(() => {
    console.log('=== MOUSE UP EVENT DEBUG ===')
    console.log('Mouse up event triggered, currentTool:', currentTool)
    console.log('Current tool type:', typeof currentTool)
    console.log('Tool check for pen/brush:', currentTool === 'pen' || currentTool === 'brush')
    
    // Handle different tool types
    if (currentTool !== 'pen' && currentTool !== 'brush') {
      console.log('Tool not supported for mouse up:', currentTool)
      console.log('Available drawing tools:', ['pen', 'brush'])
      return
    }
    
    const currentStroke = currentStrokeRef.current
    if (!currentStroke) {
      console.log('No current stroke to complete')
      return
    }
    
    console.log('Completing stroke with', currentStroke.points.length, 'points')
    
    // Only create drawing if there are points (user actually drew something)
    if (currentStroke.points.length === 0) {
      console.log('No points in stroke, skipping drawing creation')
      currentStrokeRef.current = null
      return
    }
    
      // Create drawing data for this stroke
      const drawingData = {
        whiteboardId,
        tool: currentStroke.tool as 'pen' | 'brush',
        color: currentStroke.color,
        size: currentStroke.size,
        points: currentStroke.points,
        userId
      }
    
    // Add the drawing (this will create a command in the context) - only for pen/brush tools
    if (currentTool === 'pen' || currentTool === 'brush') {
      console.log('DEBUG: Calling addDrawing with points:', drawingData.points, 'Length:', drawingData.points.length)
      
      addDrawing(drawingData).then(() => {
        console.log('Stroke completed and added to database')
        
        // Clean up temporary visual path after the final path is created
        const canvas = fabricCanvasRef.current
        if (canvas && currentStroke.tempPath) {
          canvas.remove(currentStroke.tempPath)
          canvas.renderAll()
        }
      }).catch((error) => {
        console.error('Failed to add stroke:', error)
        
        // Clean up temporary path even if there was an error
        const canvas = fabricCanvasRef.current
        if (canvas && currentStroke.tempPath) {
          canvas.remove(currentStroke.tempPath)
          canvas.renderAll()
        }
      }).finally(() => {
        // Clear the current stroke
        currentStrokeRef.current = null
        
        // Clean up any local drawing IDs that might be lingering
        // This ensures we don't block real-time updates unnecessarily
        localDrawingIdsRef.current.clear()
      })
    }
  }, [currentTool, whiteboardId, userId, addDrawing])

  // Handle mouse movement for all tools
  const handleMouseMove = useCallback((event: fabric.IEvent) => {
    const canvas = fabricCanvasRef.current
    
    if (!canvas) {
      return
    }
    
    console.log('=== MOUSE MOVE EVENT DEBUG ===')
    console.log('Mouse move event triggered')
    console.log('Canvas available:', !!canvas)
    console.log('Current tool:', currentTool)
    console.log('Current stroke exists:', !!currentStrokeRef.current)
    console.log('Mouse buttons pressed:', (event.e as MouseEvent).buttons)
    
    const pointer = canvas.getPointer(event.e)
    console.log('Pointer position:', pointer.x, pointer.y)
    
    if (currentTool === 'eraser') {
      // Only erase if mouse is pressed (dragging)
      if ((event.e as MouseEvent).buttons === 1) { // Left mouse button is pressed
        console.log('Eraser mouse move (dragging) at:', pointer.x, pointer.y)
        eraseObjectsAtPoint(canvas, pointer.x, pointer.y)
      }
    } else if ((currentTool === 'pen' || currentTool === 'brush') && currentStrokeRef.current) {
      // Add point to current stroke if mouse is pressed (dragging)
      if ((event.e as MouseEvent).buttons === 1) { // Left mouse button is pressed
        currentStrokeRef.current.points.push({ x: pointer.x, y: pointer.y })
        console.log('Added point to stroke:', pointer.x, pointer.y, 'Total points:', currentStrokeRef.current.points.length)
        
        // Update visual path on canvas
        if (currentStrokeRef.current.points.length > 1) {
          console.log('Creating visual path with', currentStrokeRef.current.points.length, 'points')
          
          // Remove existing temporary path if it exists
          if (currentStrokeRef.current.tempPath) {
            console.log('Removing existing temp path')
            canvas.remove(currentStrokeRef.current.tempPath)
          }
          
          // Create new temporary path from all points
          let pathString = ''
          currentStrokeRef.current.points.forEach((point, index) => {
            if (index === 0) {
              pathString += `M ${point.x} ${point.y}`
            } else {
              pathString += ` L ${point.x} ${point.y}`
            }
          })
          
          console.log('Path string:', pathString)
          
          const tempPath = new fabric.Path(pathString, {
            stroke: currentStrokeRef.current.color,
            strokeWidth: currentStrokeRef.current.tool === 'brush' ? currentStrokeRef.current.size * 1.5 : currentStrokeRef.current.size,
            fill: '',
            selectable: false,
            evented: false
          })
          
          console.log('Created temp path:', tempPath)
          canvas.add(tempPath)
          currentStrokeRef.current.tempPath = tempPath
        canvas.renderAll()
          console.log('Temp path added to canvas and rendered')
        }
      } else {
        console.log('Mouse not pressed, not adding point')
      }
    } else {
      console.log('No current stroke or tool not supported')
      console.log('Available drawing tools:', ['pen', 'brush'])
    }
    console.log('=== END MOUSE MOVE DEBUG ===')
  }, [currentTool, eraseObjectsAtPoint])

  // Handle drawing events
  const handlePathCreated = useCallback((event: fabric.IEvent) => {
    const path = (event as any).path as fabric.Path
    if (!path || !fabricCanvasRef.current) return

    // console.log('Path created:', path, 'Tool:', currentTool)

    // Handle eraser paths differently
    if (currentTool === 'eraser') {
      // For eraser, we don't need to save the path as a drawing
      // The eraser modifies existing objects directly
      return
    }

    // Generate a temporary ID for this local drawing
    const tempId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    ;(path as any).id = tempId
    
    // Track this local drawing ID
    localDrawingIdsRef.current.add(tempId)
    
    // Store the path object for later ID assignment
    localDrawingObjectsRef.current.set(tempId, path)
    
    console.log('Created local drawing with temp ID:', tempId)

    // Note: Commands are now created in handleMouseUp, not here
    // This function only handles the visual rendering of the path
  }, [currentTool])

  // Handle drawing updates
  const handlePathModified = useCallback((event: fabric.IEvent) => {
    const path = event.target as fabric.Path
    if (!path || !fabricCanvasRef.current) return

    const drawingId = (path as any).id
    if (!drawingId) return

    const updatedDrawing: Partial<Drawing> = {
      points: path.path?.map(point => ({
        x: (point as any)[1],
        y: (point as any)[2]
      })) || []
    }

    updateDrawing(drawingId, updatedDrawing)
  }, [updateDrawing])

  // Handle object modifications (including eraser modifications)
  const handleObjectModified = useCallback((event: fabric.IEvent) => {
    const obj = event.target
    if (!obj || !fabricCanvasRef.current) return

    const drawingId = (obj as any).id
    if (!drawingId) return

    // If it's a path object, update its points
    if (obj.type === 'path') {
      const path = obj as fabric.Path
      const updatedDrawing: Partial<Drawing> = {
        points: path.path?.map(point => ({
          x: (point as any)[1],
          y: (point as any)[2]
        })) || []
      }
      updateDrawing(drawingId, updatedDrawing)
    }
  }, [updateDrawing])

  // Handle drawing deletion
  const handlePathRemoved = useCallback((event: fabric.IEvent) => {
    const path = event.target as fabric.Path
    if (!path) return

    const drawingId = (path as any).id
    console.log('Path removed:', drawingId, 'Path:', path)
    
    if (!drawingId) return

    console.log('Deleting drawing from database:', drawingId)
    deleteDrawing(drawingId)
  }, [deleteDrawing])

  // Set up event listeners
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      console.log('No canvas available for event listeners')
      return
    }

    // Always set up mouse events for all tools
    console.log('Setting up mouse event listeners')
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    
    
    console.log('Mouse event listeners attached')

    // Always set up drawing event listeners
    canvas.on('path:created', handlePathCreated)
    canvas.on('path:modified', handlePathModified)
    canvas.on('path:removed', handlePathRemoved)
    canvas.on('object:modified', handleObjectModified)

    return () => {
      canvas.off('path:created', handlePathCreated)
      canvas.off('path:modified', handlePathModified)
      canvas.off('path:removed', handlePathRemoved)
      canvas.off('object:modified', handleObjectModified)
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('mouse:dblclick')
    }
  }, [handlePathCreated, handlePathModified, handlePathRemoved, handleObjectModified, handleMouseDown, handleMouseMove, handleMouseUp])

  // Function to ensure all canvas objects have unique IDs
  const ensureCanvasObjectIds = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const objects = canvas.getObjects()
    const objectsWithoutIds = objects.filter(obj => !(obj as any).id)
    
    if (objectsWithoutIds.length > 0) {
      console.warn(`Found ${objectsWithoutIds.length} canvas objects without IDs:`, objectsWithoutIds)
      
      // Try to match objects without IDs to drawings in context first
      objectsWithoutIds.forEach((obj) => {
        console.log(`Processing object without ID:`, obj.type, obj)
        
        const objPoints = (obj as any).path?.map((point: any) => ({
          x: point[1],
          y: point[2]
        })) || []
        
        console.log(`Object points:`, objPoints.length, objPoints.slice(0, 3))
        
        // Try to find a matching drawing
        const matchingDrawing = memoizedDrawings.find((drawing: Drawing) => {
          if (!drawing.points || drawing.points.length !== objPoints.length) {
            console.log(`Drawing ${drawing.id} has different point count: ${drawing.points?.length} vs ${objPoints.length}`)
            return false
          }
          
          const alreadyOnCanvas = objects.some(canvasObj => 
            (canvasObj as any).id === drawing.id
          )
          
          if (alreadyOnCanvas) {
            console.log(`Drawing ${drawing.id} is already on canvas`)
            return false
          }
          
          const isMatch = drawing.points.every((point, pointIndex) => {
            const objPoint = objPoints[pointIndex]
            return Math.abs(point.x - objPoint.x) < 5 && Math.abs(point.y - objPoint.y) < 5
          })
          
          if (isMatch) {
            console.log(`Found matching drawing: ${drawing.id}`)
          }
          
          return isMatch
        })
        
        if (matchingDrawing) {
          ;(obj as any).id = matchingDrawing.id
          console.log(`Matched object to drawing ID: ${matchingDrawing.id}`)
        } else {
          // Remove objects that can't be matched (likely intermediate drawing states)
          console.log(`Removing unmatched object (likely intermediate drawing state)`)
          canvas.remove(obj)
        }
      })
    }
  }, [memoizedDrawings])

  // Sync drawings from other users
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !isInitializedRef.current) return

    // Skip sync if we're during undo/redo operations
    if (state.isUndoRedoOperation) {
      console.log('Skipping sync - undo/redo operation in progress')
      return
    }

    // Check if we're in the middle of a local drawing operation
    const hasLocalDrawings = localDrawingIdsRef.current.size > 0
    if (hasLocalDrawings) {
      console.log('Local drawings in progress - allowing real-time updates from other users')
      // Continue with sync to allow real-time updates from other users
    }

    // Create a signature of current drawings to detect changes
    const currentDrawingsSignature = memoizedDrawings.map((d: Drawing) => `${d.id}-${d.points.length}`).join(',')
    
    // Skip if drawings haven't actually changed
    if (currentDrawingsSignature === lastSyncDrawingsRef.current) {
      console.log('Drawings signature unchanged, skipping sync')
      return
    }
    
    lastSyncDrawingsRef.current = currentDrawingsSignature

    // If drawings array is empty, clear the canvas completely
    if (memoizedDrawings.length === 0) {
      console.log('Drawings array is empty, clearing canvas')
      canvas.clear()
      canvas.renderAll()

      return
    }

    // Get current canvas objects and their IDs
    const currentObjects = canvas.getObjects()
    const currentObjectIds = new Set(currentObjects.map(obj => (obj as any).id).filter(Boolean))
    
    // Get drawing IDs from the drawings array
    const drawingIds = new Set(memoizedDrawings.map((d: Drawing) => d.id))
    
    
    // Remove objects that are no longer in the drawings array (but preserve local objects being matched)
    currentObjects.forEach(obj => {
      const objId = (obj as any).id
      if (objId && !drawingIds.has(objId)) {
        // Don't remove local objects that are being matched
        if (objId.startsWith('local-')) {
          const localObjects = Array.from(localDrawingObjectsRef.current.values())
          const isLocalObjectBeingMatched = localObjects.some(localObj => (localObj as any).id === objId)
          if (isLocalObjectBeingMatched) {
            console.log('Preserving local object being matched:', objId)
            return
          }
        }
        
        console.log('Removing object:', objId)
        canvas.remove(obj)
      }
    })

    // Add new drawings that aren't already on the canvas (skip during local drawing)
    if (!hasLocalDrawings) {
      memoizedDrawings.forEach((drawing: Drawing) => {
      if (drawing.tool === 'eraser') return // Skip eraser drawings for now
      
      // Check if this drawing is already on the canvas
      if (currentObjectIds.has(drawing.id)) {
        console.log('Drawing already on canvas:', drawing.id)
        return
      }


        
        // Create path from drawing points
        if (drawing.points && drawing.points.length > 0) {
          // Create a proper Fabric.js path string
          let pathString = ''
          drawing.points.forEach((point: { x: number; y: number }, index: number) => {
            if (index === 0) {
              pathString += `M ${point.x} ${point.y}`
            } else {
              pathString += ` L ${point.x} ${point.y}`
            }
          })
          
          const path = new fabric.Path(pathString, {
        stroke: drawing.color,
        strokeWidth: drawing.size,
        fill: '',
        selectable: false,
        evented: false
      })
      
      // Set custom id property
      ;(path as any).id = drawing.id

      canvas.add(path)
          canvas.renderAll()

        }
      })
    } else {
      console.log('Skipping adding new drawings during local drawing')
    }

    // After adding new drawings, try to match any objects without IDs to drawings
    const allObjects = canvas.getObjects()
    const objectsWithoutIds = allObjects.filter(obj => !(obj as any).id)
    
    if (objectsWithoutIds.length > 0) {
      console.log(`Found ${objectsWithoutIds.length} objects without IDs, attempting to match with drawings`)
      
      objectsWithoutIds.forEach((obj) => {
        // Try to match by points similarity
        const objPoints = (obj as any).path?.map((point: any) => ({
          x: point[1],
          y: point[2]
        })) || []
        
        // Find a drawing with similar points
        const matchingDrawing = memoizedDrawings.find((drawing: Drawing) => {
          if (!drawing.points || drawing.points.length !== objPoints.length) return false
          
          // Check if points are similar (within a small tolerance)
          return drawing.points.every((point, index) => {
            const objPoint = objPoints[index]
            return Math.abs(point.x - objPoint.x) < 5 && Math.abs(point.y - objPoint.y) < 5
          })
        })
        
        if (matchingDrawing) {
          ;(obj as any).id = matchingDrawing.id
          console.log(`Matched object to drawing ID: ${matchingDrawing.id}`)
        } else {
          // Generate temporary ID
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          ;(obj as any).id = tempId
          console.log(`Assigned temporary ID to unmatched object: ${tempId}`)
        }
      })
    }

    // Additional step: Try to match local drawing objects with database IDs
    const localDrawingObjects = Array.from(localDrawingObjectsRef.current.values())
    if (localDrawingObjects.length > 0) {
      console.log(`Found ${localDrawingObjects.length} local drawing objects, attempting to match with database drawings`)
      
      localDrawingObjects.forEach((localObj) => {
        const localId = (localObj as any).id
        if (!localId || !localId.startsWith('local-')) return
        
        console.log(`Processing local object: ${localId}`)
        
        const objPoints = (localObj as any).path?.map((point: any) => ({
          x: point[1],
          y: point[2]
        })) || []
        
        console.log(`Local object points: ${objPoints.length}`)
        
        // Find a drawing with similar points that's not already on canvas
        const matchingDrawing = memoizedDrawings.find((drawing: Drawing) => {
          if (!drawing.points || drawing.points.length !== objPoints.length) {
            console.log(`Drawing ${drawing.id} has different point count: ${drawing.points?.length} vs ${objPoints.length}`)
            return false
          }
          
          // Check if this drawing is already represented on canvas
          const alreadyOnCanvas = allObjects.some(canvasObj => 
            (canvasObj as any).id === drawing.id
          )
          
          if (alreadyOnCanvas) {
            console.log(`Drawing ${drawing.id} is already on canvas, skipping`)
            return false
          }
          
          // Check if points are similar (within a small tolerance)
          const isMatch = drawing.points.every((point, index) => {
            const objPoint = objPoints[index]
            return Math.abs(point.x - objPoint.x) < 5 && Math.abs(point.y - objPoint.y) < 5
          })
          
          if (isMatch) {
            console.log(`Found matching drawing: ${drawing.id} for local object: ${localId}`)
          }
          
          return isMatch
        })
        
        if (matchingDrawing) {
          ;(localObj as any).id = matchingDrawing.id
          localDrawingObjectsRef.current.delete(localId)
          console.log(`Matched local object ${localId} to drawing ID: ${matchingDrawing.id}`)
          
          // Re-add the object to canvas with the correct ID (even during local drawing)
          console.log(`Re-adding matched object to canvas with database ID: ${matchingDrawing.id}`)
          canvas.remove(localObj)
          canvas.add(localObj)
          canvas.renderAll()
        } else {
          console.log(`No matching drawing found for local object: ${localId}`)
        }
      })
    }

    // Additional step: Try to match objects with temporary IDs to drawings
    const objectsWithTempIds = allObjects.filter(obj => {
      const id = (obj as any).id
      return id && (id.startsWith('temp-') || id.startsWith('local-'))
    })
    
    if (objectsWithTempIds.length > 0) {
      console.log(`Found ${objectsWithTempIds.length} objects with temporary/local IDs, attempting to match with drawings`)
      
      objectsWithTempIds.forEach((obj) => {
        const objPoints = (obj as any).path?.map((point: any) => ({
          x: point[1],
          y: point[2]
        })) || []
        
        // Find a drawing with similar points that's not already on canvas
        const matchingDrawing = memoizedDrawings.find((drawing: Drawing) => {
          if (!drawing.points || drawing.points.length !== objPoints.length) return false
          
          // Check if this drawing is already represented on canvas
          const alreadyOnCanvas = allObjects.some(canvasObj => 
            (canvasObj as any).id === drawing.id
          )
          
          if (alreadyOnCanvas) return false
          
          // Check if points are similar (within a small tolerance)
          return drawing.points.every((point, index) => {
            const objPoint = objPoints[index]
            return Math.abs(point.x - objPoint.x) < 5 && Math.abs(point.y - objPoint.y) < 5
          })
        })
        
        if (matchingDrawing) {
          ;(obj as any).id = matchingDrawing.id
          console.log(`Matched temporary object to drawing ID: ${matchingDrawing.id}`)
        }
      })
    }

    canvas.renderAll()
    console.log('Canvas objects after sync:', canvas.getObjects().length)
    console.log('=== SYNC COMPLETE ===')
  }, [memoizedDrawings, state.isUndoRedoOperation, ensureCanvasObjectIds])


  // Real-time updates are handled by WhiteboardContext
  // No need for duplicate subscription here

  // Global error handler for Fabric.js context errors
  useEffect(() => {
    const handleCanvasError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('clearContext')) {
        console.warn('Fabric.js context error detected, reinitializing canvas...')
        // Force canvas reinitialization
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
          isInitializedRef.current = false
        }
      }
    }

    window.addEventListener('error', handleCanvasError)
    return () => window.removeEventListener('error', handleCanvasError)
  }, [])


  // Clear canvas directly (for debugging) - removed unused function
  // const clearCanvas = useCallback(() => {
  //   const canvas = fabricCanvasRef.current
  //   if (canvas) {
  //     console.log('Clearing Fabric.js canvas directly')
  //     canvas.clear()
  //     canvas.renderAll()
  //   }
  // }, [])

  // Handle window resize to make canvas responsive
  useEffect(() => {
    const handleResize = () => {
      const canvas = fabricCanvasRef.current
      const container = canvasRef.current
      if (canvas && container && isInitializedRef.current) {
        const prevWidth = canvas.width || 800
        const prevHeight = canvas.height || 600
        const newWidth = container.offsetWidth
        const newHeight = container.offsetHeight
        
        console.log('Resizing canvas from', prevWidth, 'x', prevHeight, 'to', newWidth, 'x', newHeight)
        
        // Set new canvas dimensions
        canvas.setWidth(newWidth)
        canvas.setHeight(newHeight)
        
        // Scale all objects proportionally
        const scaleX = newWidth / prevWidth
        const scaleY = newHeight / prevHeight
        
        canvas.getObjects().forEach((obj) => {
          obj.scaleX = (obj.scaleX ?? 1) * scaleX
          obj.scaleY = (obj.scaleY ?? 1) * scaleY
          obj.left = (obj.left ?? 0) * scaleX
          obj.top = (obj.top ?? 0) * scaleY
          obj.setCoords() // Update object's coordinates
        })
        
        // Recalculate offset and render
        canvas.calcOffset()
        canvas.renderAll()
        
        console.log('Canvas resized successfully')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  // Function to remove specific drawing from canvas
  const removeDrawingFromCanvas = useCallback((drawingId: string) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    console.log('Removing drawing from canvas:', drawingId)
    
    // Don't ensure canvas object IDs during removal to avoid temporary ID assignment
    // ensureCanvasObjectIds()
    
    // Find and remove the object with the matching ID
    const objects = canvas.getObjects()
    console.log('Canvas objects:', objects.length)
    console.log('Object IDs:', objects.map(obj => (obj as any).id))
    
    // Try to match local objects first
    const localObjects = Array.from(localDrawingObjectsRef.current.values())
    console.log('Local drawing objects:', localObjects.length)
    console.log('Local object IDs:', localObjects.map(obj => (obj as any).id))
    
    // Check if the drawing ID matches any local object
    const localObjectToRemove = localObjects.find(obj => (obj as any).id === drawingId)
    if (localObjectToRemove) {
      console.log('Found local object to remove:', drawingId)
      canvas.remove(localObjectToRemove)
      localDrawingObjectsRef.current.delete(drawingId)
      canvas.renderAll()
      console.log('Successfully removed local drawing from canvas:', drawingId)
      return
    }
    
    const objectToRemove = objects.find(obj => (obj as any).id === drawingId)
    
    if (objectToRemove) {
      canvas.remove(objectToRemove)
      canvas.renderAll()
      console.log('Successfully removed drawing from canvas:', drawingId)
    } else {
      console.log('Drawing object not found on canvas:', drawingId)
      console.log('Available object IDs:', objects.map(obj => (obj as any).id))
      
      // Try to find objects with similar IDs (for debugging)
      const similarIds = objects.map(obj => (obj as any).id).filter(id => 
        id && id.includes(drawingId.substring(0, 8))
      )
      if (similarIds.length > 0) {
        console.log('Found similar IDs:', similarIds)
      }
    }
  }, [])

  // Store the function in the ref for use by eraseObjectsAtPoint
  removeDrawingFromCanvasRef.current = removeDrawingFromCanvas

  // Expose the removeDrawingFromCanvas function through a ref
  React.useImperativeHandle(ref, () => ({
    removeDrawingFromCanvas
  }), [removeDrawingFromCanvas])

  return (
    <div 
      className="canvas-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        border: '2px solid #d1d5db',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
      onClick={() => {
        console.log('=== CONTAINER CLICKED ===')
        console.log('Canvas ref:', canvasRef.current)
        console.log('Fabric canvas:', fabricCanvasRef.current)
        console.log('Is initialized:', isInitializedRef.current)
        console.log('Container dimensions:', canvasRef.current?.offsetWidth, 'x', canvasRef.current?.offsetHeight)
        console.log('=== END CONTAINER CLICK ===')
      }}
    >
      <canvas
        ref={canvasRef}
        width={width || 1920}
        height={height || 1080}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair'
        }}
        onClick={(e) => {
          console.log('=== CANVAS ELEMENT CLICKED ===')
          console.log('Native canvas click event:', e)
          console.log('Canvas ref:', canvasRef.current)
          console.log('Fabric canvas:', fabricCanvasRef.current)
          console.log('=== END CANVAS CLICK ===')
        }}
      />
    </div>
  )
})

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas