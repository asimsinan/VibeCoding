'use client'

import React, { useState } from 'react'

interface WhiteboardControlsProps {
  onClear: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onToggleFullscreen: () => void
  isSaving?: boolean
  zoomLevel?: number
  isFullscreen?: boolean
  className?: string
}

/**
 * WhiteboardControls Component
 * 
 * Provides control buttons for whiteboard operations including clear,
 * save, export, and import functionality.
 * 
 * @param onClear - Callback for clearing whiteboard
 * @param onSave - Callback for saving whiteboard
 * @param onExport - Callback for exporting whiteboard
 * @param onImport - Callback for importing whiteboard
 * @param isSaving - Whether save operation is in progress
 * @param className - Additional CSS classes
 */
export const WhiteboardControls: React.FC<WhiteboardControlsProps> = ({
  onClear,
  onSave,
  onExport,
  onImport,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleFullscreen,
  isSaving = false,
  zoomLevel = 1,
  isFullscreen = false,
  className = ''
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Handle clear with confirmation
  const handleClear = () => {
    if (showClearConfirm) {
      onClear()
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }


  return (
    <div className={`whiteboard-controls ${className}`}>
      <div className="flex flex-wrap gap-2">

        {/* Divider */}
        <div className="w-px h-10 bg-gray-300" />

        {/* Clear */}
        <button
          onClick={handleClear}
          className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
            showClearConfirm
              ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-gray-300 bg-white text-gray-700 hover:border-red-400 hover:bg-red-50'
          }`}
          title="Clear whiteboard"
        >
          {showClearConfirm ? '⚠️ Confirm Clear' : '🗑️ Clear'}
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-300" />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
            isSaving
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          }`}
          title="Save whiteboard (Ctrl+S)"
        >
          {isSaving ? '⏳ Saving...' : '💾 Save'}
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          title="Export whiteboard (Ctrl+E)"
        >
          📤 Export
        </button>

        {/* Import */}
        <button
          onClick={onImport}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          title="Import whiteboard"
        >
          📥 Import
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-300" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onZoomOut}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            title="Zoom out"
          >
            🔍-
          </button>
          <span className="text-sm text-gray-600 px-2">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={onZoomIn}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            title="Zoom in"
          >
            🔍+
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-gray-300" />

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFitToScreen}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            title="Fit to screen"
          >
            📐 Fit
          </button>
          <button
            onClick={onToggleFullscreen}
            className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
              isFullscreen 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

    </div>
  )
}

export default WhiteboardControls