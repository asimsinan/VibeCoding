import { useCallback, useState } from 'react'

interface DragState {
  isDragging: boolean
  draggedObjectId: string | null
  startPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
}

interface UseDragManagerReturn {
  dragState: DragState
  startDrag: (objectId: string, startPos: { x: number; y: number }, event: React.MouseEvent) => void
  updateDrag: (event: React.MouseEvent) => void
  endDrag: () => void
  isObjectDragging: (objectId: string) => boolean
}

export const useDragManager = (): UseDragManagerReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedObjectId: null,
    startPosition: null,
    currentPosition: null
  })

  const startDrag = useCallback((objectId: string, startPos: { x: number; y: number }, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setDragState({
      isDragging: true,
      draggedObjectId: objectId,
      startPosition: startPos,
      currentPosition: startPos
    })
  }, [])

  const updateDrag = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return
    
    const rect = (event.target as Element).closest('.canvas-container')?.getBoundingClientRect()
    if (!rect) return

    const currentPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    setDragState(prev => ({
      ...prev,
      currentPosition: currentPos
    }))
  }, [dragState.isDragging])

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedObjectId: null,
      startPosition: null,
      currentPosition: null
    })
  }, [])

  const isObjectDragging = useCallback((objectId: string) => {
    return dragState.isDragging && dragState.draggedObjectId === objectId
  }, [dragState.isDragging, dragState.draggedObjectId])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    isObjectDragging
  }
}
