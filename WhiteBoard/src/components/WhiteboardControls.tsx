'use client'

import React from 'react'
import { useWhiteboard } from '@/lib/whiteboard/context/WhiteboardContext'
import { WhiteboardControls as WhiteboardControlsComponent } from '@/lib/whiteboard/components/WhiteboardControls'

/**
 * WhiteboardControls Component
 * 
 * Controls component that integrates with the whiteboard context.
 * Provides access to whiteboard operations.
 */
export default function WhiteboardControls() {
  const {
    state,
    clearWhiteboard,
    saveWhiteboard,
    exportWhiteboard,
    zoomIn,
    zoomOut,
    fitToScreen,
    toggleFullscreen
  } = useWhiteboard()

  // Handle clear whiteboard
  const handleClearWhiteboard = async () => {
    if (window.confirm('Are you sure you want to clear the whiteboard? This action cannot be undone.')) {
      try {
        await clearWhiteboard()
      } catch (error) {
        console.error('Failed to clear whiteboard:', error)
      }
    }
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

  // Handle import whiteboard (placeholder)
  const handleImportWhiteboard = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            console.log('Imported whiteboard data:', data)
            // TODO: Implement import functionality
          } catch (error) {
            console.error('Failed to import whiteboard:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <WhiteboardControlsComponent
      onClear={() => handleClearWhiteboard()}
      onSave={() => handleSaveWhiteboard()}
      onExport={handleExportWhiteboard}
      onImport={handleImportWhiteboard}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onFitToScreen={fitToScreen}
      onToggleFullscreen={toggleFullscreen}
      isSaving={state.isLoading}
      zoomLevel={state.zoomLevel}
      isFullscreen={state.isFullscreen}
      className="w-full"
    />
  )
}
