'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useWhiteboard } from '@/lib/whiteboard/context/WhiteboardContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { StickyNote } from '@/lib/whiteboard/models/StickyNote'
// import { TextObjectModel, ShapeObjectModel } from '@/lib/whiteboard/models/CanvasObjectModel'
import { Toolbar } from '@/lib/whiteboard/components/Toolbar'

/**
 * WhiteboardToolbar Component
 * 
 * Toolbar component that integrates with the whiteboard context.
 * Provides access to all drawing tools and whiteboard operations.
 */
export default function WhiteboardToolbar() {
  const { user } = useAuth()
  const {
    state,
    setSelectedTool,
    setSelectedColor,
    setSelectedSize,
    addStickyNote,
    addTextObject,
    addShapeObject,
    addDrawing,
    clearWhiteboard,
    saveWhiteboard,
    exportWhiteboard,
    zoomIn,
    zoomOut,
    fitToScreen,
    toggleFullscreen,
    setSelectedStickyNoteColor,
    undo,
    redo,
  } = useWhiteboard()
  
  // Get whiteboardId and userId from context or props
  const whiteboardId = state.currentWhiteboard?.id || ''
  const userId = user?.id || ''

  // State for clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // State for import success modal
  const [showImportSuccess, setShowImportSuccess] = useState(false)
  const [importStats, setImportStats] = useState({ drawings: 0, stickyNotes: 0 })

  // Handle adding text directly
  const handleAddText = async () => {
    try {
      // Use a more robust positioning method that doesn't rely on immediate state
      const timestamp = Date.now()
      const randomOffset = Math.floor(Math.random() * 100)
      
      const textObject = {
        type: 'text' as const,
        content: 'Click to edit',
        position: { 
          x: 150 + (timestamp % 200) + randomOffset, 
          y: 150 + (timestamp % 200) + randomOffset 
        },
        fontSize: 16,
        color: state.selectedColor,
        fontFamily: 'Arial',
        fontWeight: 'normal' as const,
        userId
      }
      await addTextObject(textObject)
    } catch (error) {
      console.error('Failed to add text object:', error)
    }
  }

  // Handle adding shape directly
  const handleAddShape = async (type: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    console.log('=== ADD SHAPE DEBUG ===')
    console.log('Adding shape:', type)
    console.log('User ID:', userId)
    console.log('Whiteboard ID:', whiteboardId)
    
    try {
      // Use a more robust positioning method that doesn't rely on immediate state
      const timestamp = Date.now()
      const randomOffset = Math.floor(Math.random() * 150)
      
      const shapeObject = {
        type: type,
        startPoint: { 
          x: 200 + (timestamp % 300) + randomOffset, 
          y: 200 + (timestamp % 300) + randomOffset 
        },
        endPoint: { 
          x: 200 + (timestamp % 300) + randomOffset + 150, 
          y: 200 + (timestamp % 300) + randomOffset + 100 
        },
        strokeColor: '#000000',
        strokeWidth: 3,
        fillColor: 'transparent',
        userId
      }
      
      console.log('Shape object data:', shapeObject)
      console.log('Calling addShapeObject...')
      
      await addShapeObject(shapeObject)
      console.log('SUCCESS: Shape created successfully')
    } catch (error) {
      console.error('ERROR: Failed to add shape object:', error)
      // Log the full error to see what's causing the validation issue
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack)
      }
    }
    console.log('=== END ADD SHAPE DEBUG ===')
  }

  // Handle adding sticky note
  const handleAddStickyNote = async () => {
    console.log('=== ADD STICKY NOTE DEBUG ===')
    console.log('Adding sticky note...')
    console.log('User:', user)
    console.log('User ID:', user?.id)
    console.log('Whiteboard ID:', state.currentWhiteboard?.id)
    console.log('Whiteboard state:', state.currentWhiteboard)
    console.log('Selected sticky note color:', state.selectedStickyNoteColor)
    
    if (!user) {
      console.error('ERROR: User not authenticated')
      alert('Please log in to add sticky notes')
      return
    }

    if (!state.currentWhiteboard?.id) {
      console.error('ERROR: No whiteboard ID available')
      console.error('Current whiteboard:', state.currentWhiteboard)
      alert('No whiteboard selected. Please refresh the page.')
      return
    }

    try {
      console.log('SUCCESS: Creating sticky note data...')
      const stickyNoteData = {
        whiteboardId: state.currentWhiteboard.id,
        content: 'New sticky note',
        position: { x: 100, y: 100 },
        color: state.selectedStickyNoteColor || '#FFE066', // Use selected color or default
        userId: user.id
      } as Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>

      console.log('Sticky note data:', stickyNoteData)
      console.log('Calling addStickyNote...')

      await addStickyNote(stickyNoteData)
      console.log('SUCCESS: Sticky note created successfully')
    } catch (error) {
      console.error('ERROR: Failed to add sticky note:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Failed to add sticky note: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    console.log('=== END ADD STICKY NOTE DEBUG ===')
  }

  // Handle clear whiteboard
  const handleClearWhiteboard = async () => {
    setShowClearConfirm(true)
  }

  // Confirm clear whiteboard
  const confirmClearWhiteboard = async () => {
    try {
      setIsClearing(true)
      console.log('User confirmed clear operation')
      await clearWhiteboard()
      console.log('Clear whiteboard completed successfully')
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear whiteboard:', error)
      alert(`Failed to clear whiteboard: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsClearing(false)
    }
  }

  // Cancel clear whiteboard
  const cancelClearWhiteboard = () => {
    setShowClearConfirm(false)
    console.log('User cancelled clear operation')
  }

  // Handle save whiteboard
  const handleSaveWhiteboard = async () => {
    try {
      await saveWhiteboard()
    } catch (error) {
      console.error('Failed to save whiteboard:', error)
    }
  }

  // Handle export whiteboard
  const handleExportWhiteboard = () => {
    try {
      exportWhiteboard()
    } catch (error) {
      console.error('Failed to export whiteboard:', error)
    }
  }

  // Handle import whiteboard
  const handleImportWhiteboard = () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              console.log('Starting whiteboard import...')
              const data = JSON.parse(e.target?.result as string)
              console.log('Imported whiteboard data:', data)
              
              // Import drawings
              let drawingsCount = 0
              if (data.drawings && Array.isArray(data.drawings)) {
                console.log(`Importing ${data.drawings.length} drawings...`)
                
                // Use Promise.all to wait for all drawings to be imported
                const drawingPromises = data.drawings.map(async (drawing: any) => {
                  // Validate and transform the imported data
                  const tool = typeof drawing.tool === 'string' ? drawing.tool : 'pen'
                  const color = typeof drawing.color === 'string' ? drawing.color : '#000000'
                  const size = typeof drawing.size === 'number' ? drawing.size : 2
                  const points = Array.isArray(drawing.points) ? drawing.points : []

                  console.log('Importing drawing:', { tool, color, size, points: points.length })

                  const drawingData = {
                    whiteboardId,
                    tool,
                    color,
                    size,
                    points,
                    userId
                  }

                  try {
                    await addDrawing(drawingData)
                    console.log('Successfully imported drawing:', tool)
                    drawingsCount++
                  } catch (error) {
                    console.error('Failed to import drawing:', error)
                    throw error
                  }
                })
                
                // Wait for all drawings to be imported
                await Promise.all(drawingPromises)
                console.log('All drawings imported successfully')
              }
              
              // Import sticky notes
              let stickyNotesCount = 0
              if (data.stickyNotes && Array.isArray(data.stickyNotes)) {
                console.log(`Importing ${data.stickyNotes.length} sticky notes...`)
                
                // Use Promise.all to wait for all sticky notes to be imported
                const stickyNotePromises = data.stickyNotes.map(async (stickyNote: any) => {
                  // Validate and transform the imported data
                  const content = typeof stickyNote.content === 'string' ? stickyNote.content : 'Imported note'
                  const position = {
                    x: typeof stickyNote.position?.x === 'number' ? stickyNote.position.x : 100,
                    y: typeof stickyNote.position?.y === 'number' ? stickyNote.position.y : 100
                  }
                  const color = typeof stickyNote.color === 'string' && stickyNote.color.match(/^#[0-9A-Fa-f]{6}$/) 
                    ? stickyNote.color 
                    : '#FFE066'

                  console.log('Importing sticky note:', { content, position, color })

                  const stickyNoteData = {
                    whiteboardId,
                    content,
                    position,
                    color,
                    userId
                  }

                  try {
                    await addStickyNote(stickyNoteData)
                    console.log('Successfully imported sticky note:', content)
                    stickyNotesCount++
                  } catch (error) {
                    console.error('Failed to import sticky note:', error)
                    throw error
                  }
                })
                
                // Wait for all sticky notes to be imported
                await Promise.all(stickyNotePromises)
                console.log('All sticky notes imported successfully')
              }
              
              console.log('Whiteboard imported successfully')
              setImportStats({ drawings: drawingsCount, stickyNotes: stickyNotesCount })
              setShowImportSuccess(true)
            } catch (error) {
              console.error('Failed to import whiteboard:', error)
              alert('Failed to import whiteboard. Please check the file format.')
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    } catch (error) {
      console.error('Failed to import whiteboard:', error)
    }
  }


  return (
    <>
      <Toolbar
        currentTool={state.selectedTool}
        currentColor={state.selectedColor}
        currentSize={state.selectedSize}
        onToolChange={setSelectedTool}
        onColorChange={setSelectedColor}
        onSizeChange={setSelectedSize}
        onAddStickyNote={handleAddStickyNote}
        onAddText={handleAddText}
        onAddShape={handleAddShape}
        onClearWhiteboard={handleClearWhiteboard}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitToScreen={fitToScreen}
        onToggleFullscreen={toggleFullscreen}
        onSave={handleSaveWhiteboard}
        onExport={handleExportWhiteboard}
        onImport={handleImportWhiteboard}
        zoomLevel={state.zoomLevel}
        isFullscreen={state.isFullscreen}
        isSaving={state.isLoading}
        className="w-full"
        // Undo/Redo props
        onUndo={undo}
        onRedo={redo}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        // Sticky note color props
        selectedStickyNoteColor={state.selectedStickyNoteColor}
        onStickyNoteColorChange={setSelectedStickyNoteColor}
      />

      {/* Clear Whiteboard Confirmation Modal */}
      {showClearConfirm && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-4 animate-fade-in-up">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Clear Whiteboard?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to clear the entire whiteboard? This will remove all drawings and sticky notes.
                </p>
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-700 font-semibold text-sm">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={cancelClearWhiteboard}
                  disabled={isClearing}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearWhiteboard}
                  disabled={isClearing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {isClearing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Clearing...</span>
                    </div>
                  ) : (
                    'Clear Whiteboard'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Success Modal */}
      {showImportSuccess && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-4 animate-fade-in-up">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Import Successful!
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Your whiteboard has been imported successfully.
                </p>
                
                {/* Import Statistics */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{importStats.drawings}</div>
                      <div className="text-sm text-green-600">Drawings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{importStats.stickyNotes}</div>
                      <div className="text-sm text-green-600">Sticky Notes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowImportSuccess(false)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
