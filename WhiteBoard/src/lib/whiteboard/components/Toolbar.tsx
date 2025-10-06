'use client'

import React from 'react'
// import { DrawingToolModel as DrawingTool } from '@/lib/whiteboard/models/DrawingModel'

// All available tools (including non-drawing tools)
type AllTools = 'pen' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow'

interface ToolbarProps {
  currentTool: AllTools
  currentColor: string
  currentSize: number
  onToolChange: (tool: AllTools) => void
  onColorChange: (color: string) => void
  onSizeChange: (size: number) => void
  onAddStickyNote: () => void
  onAddText: () => void
  onAddShape: (type: 'rectangle' | 'circle' | 'line' | 'arrow') => void
  onClearWhiteboard: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onToggleFullscreen: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  // Undo/Redo props
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  zoomLevel?: number
  isFullscreen?: boolean
  isSaving?: boolean
  className?: string
  // Sticky note color props
  selectedStickyNoteColor?: string
  onStickyNoteColorChange?: (color: string) => void
}

/**
 * Toolbar Component
 * 
 * A comprehensive toolbar for drawing tools, colors, and whiteboard controls.
 * Provides access to all drawing and collaboration features.
 * 
 * @param currentTool - Currently selected drawing tool
 * @param currentColor - Currently selected drawing color
 * @param currentSize - Currently selected drawing size
 * @param onToolChange - Callback for tool changes
 * @param onColorChange - Callback for color changes
 * @param onSizeChange - Callback for size changes
 * @param onAddStickyNote - Callback for adding sticky notes
 * @param onClearWhiteboard - Callback for clearing whiteboard
 * @param className - Additional CSS classes
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  currentColor,
  currentSize,
  onToolChange,
  onColorChange,
  onSizeChange,
  onAddStickyNote,
  onAddText,
  onAddShape,
  onClearWhiteboard,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleFullscreen,
  onSave,
  onExport,
  onImport,
  // Undo/Redo props
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoomLevel = 1,
  isFullscreen = false,
  isSaving = false,
  className = '',
  // Sticky note color props
  selectedStickyNoteColor = '#FFE066',
  onStickyNoteColorChange
}) => {

  // Drawing tools configuration
  const drawingTools: { tool: AllTools; icon: string; label: string }[] = [
    { tool: 'pen', icon: '✏️', label: 'Pen' },
    { tool: 'brush', icon: '🖌️', label: 'Brush' },
    { tool: 'eraser', icon: '🧹', label: 'Eraser' }
  ]

  // Text tool configuration
  const textTool: { tool: AllTools; icon: string; label: string }[] = [
    { tool: 'text', icon: '📝', label: 'Text' }
  ]

  // Shape tools configuration for popup
  const shapeTools: { tool: AllTools; icon: string; label: string }[] = [
    { tool: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { tool: 'circle', icon: '⭕', label: 'Circle' },
    { tool: 'line', icon: '📏', label: 'Line' },
    { tool: 'arrow', icon: '➡️', label: 'Arrow' }
  ]

  // Color options
  const colorOptions: { color: string; name: string }[] = [
    { color: '#000000', name: 'Black' },
    { color: '#FF0000', name: 'Red' },
    { color: '#00FF00', name: 'Green' },
    { color: '#0000FF', name: 'Blue' },
    { color: '#FFFF00', name: 'Yellow' },
    { color: '#FF00FF', name: 'Magenta' },
    { color: '#00FFFF', name: 'Cyan' },
    { color: '#FFA500', name: 'Orange' },
    { color: '#800080', name: 'Purple' },
    { color: '#FFC0CB', name: 'Pink' }
  ]

  // Sticky note colors
  const stickyNoteColors: { color: string; name: string }[] = [
    { color: '#FFE066', name: 'Yellow' },
    { color: '#FF6B6B', name: 'Red' },
    { color: '#4ECDC4', name: 'Teal' },
    { color: '#45B7D1', name: 'Blue' },
    { color: '#96CEB4', name: 'Green' },
    { color: '#FFEAA7', name: 'Orange' },
    { color: '#DDA0DD', name: 'Purple' },
    { color: '#F8BBD9', name: 'Pink' }
  ]

  return (
    <div className={`toolbar bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 ${className}`}>
      <style jsx>{`
        .tool-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .tool-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .tool-button:active {
          transform: translateY(0);
        }
        
        .tool-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .color-button {
          transition: all 0.3s ease;
          position: relative;
        }
        
        .color-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .action-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        .action-button:active {
          transform: translateY(0);
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
      
      <div className="flex flex-wrap gap-6 items-center">
        {/* Drawing Tools */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {drawingTools.map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => onToolChange(tool)}
                className={`tool-button px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  currentTool === tool
                    ? 'active border-transparent text-white shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={label}
              >
                <span className="text-lg">{icon}</span>
                <span className="ml-2 text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Tool */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {textTool.map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => {
                  onAddText()
                }}
                className={`tool-button px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  currentTool === tool
                    ? 'active border-transparent text-white shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={label}
              >
                <span className="text-lg">{icon}</span>
                <span className="ml-2 text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shape Tools */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {shapeTools.map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => onAddShape(tool as 'rectangle' | 'circle' | 'line' | 'arrow')}
                className={`tool-button px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  currentTool === tool
                    ? 'active border-transparent text-white shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={label}
              >
                <span className="text-lg">{icon}</span>
                <span className="ml-2 text-sm font-medium">{label}</span>
              </button>
            ))}

          </div>
        </div>

        {/* Drawing Colors */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {colorOptions.map(({ color, name }) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`color-button w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentColor === color
                    ? 'border-gray-800 scale-110 shadow-lg'
                    : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        {/* Drawing Size */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="50"
              value={currentSize}
              onChange={(e) => onSizeChange(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-8">{currentSize}px</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* Sticky Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Sticky Notes</label>
          <div className="flex gap-1">
            <button
              onClick={() => {
                console.log('Add Note button clicked!')
                onAddStickyNote()
              }}
              className="action-button px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl border border-yellow-300 hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              title="Add sticky note"
            >
              <span className="text-lg mr-2">📝</span>
              Add Note
            </button>
            <div className="flex gap-1">
              {stickyNoteColors.slice(0, 4).map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => onStickyNoteColorChange?.(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    selectedStickyNoteColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`${name} sticky note`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* Undo/Redo Controls */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">History</label>
          <div className="flex gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                canUndo
                  ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Undo last action"
            >
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                canRedo
                  ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Redo last undone action"
            >
              Redo
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* Whiteboard Controls */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Controls</label>
          <div className="flex gap-2">
            <button
              onClick={onClearWhiteboard}
              className="action-button px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl border border-red-300 hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              title="Clear whiteboard"
            >
              <span className="text-lg mr-2">🗑️</span>
              Clear
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Zoom</label>
          <div className="flex gap-2">
            <button
              onClick={onZoomOut}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              🔍-
            </button>
            <span className="text-sm text-gray-600 px-2 py-2 flex items-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              🔍+
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* View Controls */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">View</label>
          <div className="flex gap-2">
            <button
              onClick={onFitToScreen}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              title="Fit to Screen"
            >
              📐 Fit
            </button>
            <button
              onClick={onToggleFullscreen}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-300" />

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Quick Actions</label>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`action-button px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                isSaving
                  ? 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-green-200 bg-gradient-to-r from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg hover:shadow-xl'
              }`}
              title="Save whiteboard"
            >
              <span className="text-lg mr-2">{isSaving ? '⏳' : '💾'}</span>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onExport}
              className="action-button px-4 py-3 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-xl border border-blue-300 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              title="Export whiteboard"
            >
              <span className="text-lg mr-2">📤</span>
              Export
            </button>
            <button
              onClick={onImport}
              className="action-button px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl border border-purple-300 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              title="Import whiteboard"
            >
              <span className="text-lg mr-2">📥</span>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toolbar