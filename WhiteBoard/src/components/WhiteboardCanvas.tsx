'use client'

import React, { useEffect, useState } from 'react'
import { useWhiteboard } from '@/lib/whiteboard/context/WhiteboardContext'
import { DrawingCanvas } from '@/lib/whiteboard/components/DrawingCanvas'
import { StickyNote } from '@/lib/whiteboard/components/StickyNote'
import { UnifiedCanvasObject } from '@/lib/whiteboard/components/UnifiedCanvasObject'
import { StickyNote as StickyNoteModel } from '@/lib/whiteboard/models/StickyNote'
// import { CanvasObjectModel } from '@/lib/whiteboard/models/CanvasObjectModel'

interface WhiteboardCanvasProps {
  whiteboardId: string
  userId: string
}

/**
 * WhiteboardCanvas Component
 * 
 * Main canvas component that integrates drawing and sticky note functionality.
 * Provides the collaborative whiteboard experience with real-time synchronization.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param userId - Current user identifier
 */
export default function WhiteboardCanvas({ whiteboardId, userId }: WhiteboardCanvasProps) {
  const {
    state,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    updateCanvasObject,
    deleteCanvasObject,
    setDrawingCanvasRef,
    setRemoveDrawingFromCanvasFn
  } = useWhiteboard()

  // const [isAddingStickyNote, setIsAddingStickyNote] = useState(false)
  const [pendingStickyNote, setPendingStickyNote] = useState<{ x: number; y: number } | null>(null)
  const drawingCanvasRef = React.useRef<any>(null)

  // Set the drawing canvas ref in the context
  useEffect(() => {
    setDrawingCanvasRef(drawingCanvasRef)
    return () => setDrawingCanvasRef(null)
  }, [setDrawingCanvasRef])

  // Set the remove drawing from canvas function in the context
  useEffect(() => {
    if (drawingCanvasRef.current?.removeDrawingFromCanvas) {
      setRemoveDrawingFromCanvasFn(drawingCanvasRef.current.removeDrawingFromCanvas)
    }
    return () => setRemoveDrawingFromCanvasFn(null)
  }, [setRemoveDrawingFromCanvasFn])


  // Handle adding sticky note
  const handleAddStickyNote = async (content: string) => {
    if (!pendingStickyNote) return

    try {
      const stickyNote: Omit<StickyNoteModel, 'id' | 'createdAt' | 'updatedAt' | 'delete' | 'update'> = {
        whiteboardId,
        content,
        position: pendingStickyNote,
        color: '#FFE066',
        userId
      }

      await addStickyNote(stickyNote as Omit<StickyNoteModel, 'id' | 'createdAt' | 'updatedAt'>)
      setPendingStickyNote(null)
    } catch (error) {
      console.error('Failed to add sticky note:', error)
    }
  }


  // Handle canvas click (currently unused - shapes created directly from toolbar)
  const handleCanvasClick = () => {
    // Canvas click handling removed - shapes are created directly from toolbar buttons
    // This matches the sticky note behavior exactly
  }



  // Handle escape key to cancel sticky note addition
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAddingStickyNote(false)
        setPendingStickyNote(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="w-full h-full bg-white flex flex-col">

      {/* Canvas Area */}
      <div 
        className="relative flex-1 bg-white" 
        onClick={handleCanvasClick}
      >
      {/* Drawing Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 h-full drawing-canvas-container">
        <div className="w-full h-full">
          <DrawingCanvas
            ref={drawingCanvasRef}
            whiteboardId={whiteboardId}
            userId={userId}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Sticky Notes Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {(state.stickyNotes || [])
          .filter((stickyNote, index, array) => 
            // Deduplicate by ID - keep only the first occurrence
            array.findIndex(item => item.id === stickyNote.id) === index
          )
          .map((stickyNote) => {
            console.log('🎨 Rendering sticky note:', stickyNote.id, 'at position:', stickyNote.position)
            console.log('🎨 Total sticky notes in state:', state.stickyNotes.length)
            console.log('🎨 Sticky note IDs in state:', state.stickyNotes.map(n => n.id))
            return (
              <div
                key={stickyNote.id}
                className="pointer-events-auto"
                style={{
                  zIndex: 10
                }}
              >
                <StickyNote
                  stickyNote={stickyNote}
                  whiteboardId={whiteboardId}
                  userId={userId}
                  isEditable={stickyNote.userId === userId}
                  onUpdate={(id, updates) => updateStickyNote(id, updates)}
                  onDelete={(id) => deleteStickyNote(id)}
                />
              </div>
            )
          })}
      </div>

      {/* Unified Canvas Objects Layer - All text and shapes in one layer */}
      <div className="absolute inset-0 pointer-events-none">
        {(state.canvasObjects || [])
          .filter((canvasObject, index, array) => 
            // Deduplicate by ID - keep only the first occurrence
            array.findIndex(item => item.id === canvasObject.id) === index
          )
          .map((canvasObject, index) => (
          <div
            key={canvasObject.id}
            className="pointer-events-auto"
            style={{
              zIndex: 20 + index // All objects get sequential z-index
            }}
          >
            <UnifiedCanvasObject
              object={canvasObject}
              whiteboardId={whiteboardId}
              userId={userId}
              isEditable={canvasObject.userId === userId}
              onUpdate={(id, updates) => updateCanvasObject(id, updates)}
              onDelete={(id) => deleteCanvasObject(id)}
            />
          </div>
        ))}
      </div>

      {/* Pending Sticky Note */}
      {pendingStickyNote && (
        <div
          className="absolute pointer-events-auto z-20"
          style={{
            left: pendingStickyNote.x,
            top: pendingStickyNote.y
          }}
        >
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 shadow-lg min-w-48">
            <input
              type="text"
              placeholder="Enter your note..."
              className="w-full bg-transparent border-none outline-none text-sm font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddStickyNote(e.currentTarget.value)
                } else if (e.key === 'Escape') {
                  setPendingStickyNote(null)
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  handleAddStickyNote(e.target.value)
                } else {
                  setPendingStickyNote(null)
                }
              }}
            />
          </div>
        </div>
      )}


      {/* Enhanced Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/90 to-purple-50/90 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Whiteboard</h3>
            <p className="text-sm text-gray-600 mb-6">Preparing your collaborative workspace...</p>
            <div className="flex items-center justify-center space-x-1 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Error Overlay */}
      {state.error && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-xl z-30 backdrop-blur-sm max-w-sm">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Connection Error</h4>
              <p className="text-sm text-red-700 mb-3">{state.error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Connection Status */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm flex items-center space-x-2 ${
          state.isConnected 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            state.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span>{state.isConnected ? 'Live Sync Active' : 'Connection Lost'}</span>
        </div>
      </div>

      </div>
    </div>
  )
}
