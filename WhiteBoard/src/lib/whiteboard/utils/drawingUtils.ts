/**
 * Drawing Utilities
 * 
 * Utility functions for drawing calculations and operations.
 * Provides helper functions for drawing path optimization, collision detection,
 * and drawing state management.
 */

import { Drawing } from '../models/Drawing'
import { DrawingTool } from '@/contracts/types/domain'
import { calculateBounds, optimizePoints } from './canvasUtils'
import { Point, Bounds } from './canvasUtils'

/**
 * Drawing state interface
 */
export interface DrawingState {
  isDrawing: boolean
  currentTool: DrawingTool
  currentColor: string
  currentSize: number
  currentPath: Point[]
  lastPoint: Point | null
}

/**
 * Drawing operation interface
 */
export interface DrawingOperation {
  type: 'add' | 'update' | 'delete'
  drawing: Drawing
  timestamp: number
}

/**
 * Default drawing state
 */
export const DEFAULT_DRAWING_STATE: DrawingState = {
  isDrawing: false,
  currentTool: 'pen',
  currentColor: '#000000',
  currentSize: 2,
  currentPath: [],
  lastPoint: null
}

/**
 * Calculate drawing path length
 * 
 * @param points - Array of points
 * @returns Total path length
 */
export const calculatePathLength = (points: Point[]): number => {
  if (points.length < 2) return 0

  let totalLength = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (!prev || !curr) continue
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    totalLength += Math.sqrt(dx * dx + dy * dy)
  }

  return totalLength
}

/**
 * Calculate drawing complexity score
 * 
 * @param points - Array of points
 * @returns Complexity score (0-1)
 */
export const calculateComplexityScore = (points: Point[]): number => {
  if (points.length < 3) return 0

  let totalAngleChange = 0
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    if (!prev || !curr || !next) continue

    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x)
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x)
    
    let angleDiff = Math.abs(angle2 - angle1)
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff
    }
    
    totalAngleChange += angleDiff
  }

  const maxPossibleAngleChange = (points.length - 2) * Math.PI
  return Math.min(totalAngleChange / maxPossibleAngleChange, 1)
}

/**
 * Detect drawing gestures
 * 
 * @param points - Array of points
 * @returns Detected gesture type
 */
export const detectGesture = (points: Point[]): string | null => {
  if (points.length < 5) return null

  const bounds = calculateBounds(points)
  const aspectRatio = bounds.width / bounds.height
  const complexity = calculateComplexityScore(points)

  // Circle detection
  if (Math.abs(aspectRatio - 1) < 0.2 && complexity > 0.7) {
    return 'circle'
  }

  // Line detection
  if (aspectRatio > 3 || aspectRatio < 0.33) {
    return 'line'
  }

  // Rectangle detection
  if (Math.abs(aspectRatio - 1.5) < 0.3 && complexity < 0.3) {
    return 'rectangle'
  }

  // Freeform drawing
  if (complexity > 0.5) {
    return 'freeform'
  }

  return null
}

/**
 * Optimize drawing for performance
 * 
 * @param drawing - Drawing to optimize
 * @param quality - Quality level (0-1)
 * @returns Optimized drawing
 */
export const optimizeDrawing = (drawing: Drawing, quality: number = 0.8): Drawing => {
  if (drawing.points.length < 3) return drawing

  const threshold = Math.max(1, Math.floor((1 - quality) * 10))
  const optimizedPoints = optimizePoints(drawing.points, threshold)

  return new Drawing(
    drawing.id,
    drawing.whiteboardId,
    drawing.tool,
    drawing.color,
    drawing.size,
    optimizedPoints,
    drawing.userId,
    drawing.createdAt,
    new Date()
  )
}

/**
 * Calculate drawing bounds with padding
 * 
 * @param drawing - Drawing to calculate bounds for
 * @param padding - Padding amount
 * @returns Bounds with padding
 */
export const calculateDrawingBoundsWithPadding = (drawing: Drawing, padding: number = 10): Bounds => {
  const bounds = calculateBounds(drawing.points)
  return {
    x: Math.max(0, bounds.x - padding),
    y: Math.max(0, bounds.y - padding),
    width: bounds.width + (padding * 2),
    height: bounds.height + (padding * 2)
  }
}

/**
 * Check if two drawings intersect
 * 
 * @param drawing1 - First drawing
 * @param drawing2 - Second drawing
 * @returns True if drawings intersect
 */
export const checkDrawingsIntersect = (drawing1: Drawing, drawing2: Drawing): boolean => {
  const bounds1 = calculateBounds(drawing1.points)
  const bounds2 = calculateBounds(drawing2.points)

  return !(
    bounds1.x > bounds2.x + bounds2.width ||
    bounds1.x + bounds1.width < bounds2.x ||
    bounds1.y > bounds2.y + bounds2.height ||
    bounds1.y + bounds1.height < bounds2.y
  )
}

/**
 * Merge two drawings
 * 
 * @param drawing1 - First drawing
 * @param drawing2 - Second drawing
 * @returns Merged drawing
 */
export const mergeDrawings = (drawing1: Drawing, drawing2: Drawing): Drawing => {
  const mergedPoints = [...drawing1.points, ...drawing2.points]
  
  return new Drawing(
    drawing1.id,
    drawing1.whiteboardId,
    drawing1.tool,
    drawing1.color,
    drawing1.size,
    mergedPoints,
    drawing1.userId,
    drawing1.createdAt,
    new Date()
  )
}

/**
 * Split drawing at point
 * 
 * @param drawing - Drawing to split
 * @param splitIndex - Index to split at
 * @returns Array of split drawings
 */
export const splitDrawing = (drawing: Drawing, splitIndex: number): Drawing[] => {
  if (splitIndex <= 0 || splitIndex >= drawing.points.length - 1) {
    return [drawing]
  }

  const firstPart = drawing.points.slice(0, splitIndex + 1)
  const secondPart = drawing.points.slice(splitIndex)

  return [
    new Drawing(
      `${drawing.id}_1`,
      drawing.whiteboardId,
      drawing.tool,
      drawing.color,
      drawing.size,
      firstPart,
      drawing.userId,
      drawing.createdAt,
      new Date()
    ),
    new Drawing(
      `${drawing.id}_2`,
      drawing.whiteboardId,
      drawing.tool,
      drawing.color,
      drawing.size,
      secondPart,
      drawing.userId,
      drawing.createdAt,
      new Date()
    )
  ]
}

/**
 * Calculate drawing center point
 * 
 * @param drawing - Drawing to calculate center for
 * @returns Center point
 */
export const calculateDrawingCenter = (drawing: Drawing): Point => {
  if (drawing.points.length === 0) {
    return { x: 0, y: 0 }
  }

  const bounds = calculateBounds(drawing.points)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  }
}

/**
 * Rotate drawing around center
 * 
 * @param drawing - Drawing to rotate
 * @param angle - Rotation angle in radians
 * @returns Rotated drawing
 */
export const rotateDrawing = (drawing: Drawing, angle: number): Drawing => {
  const center = calculateDrawingCenter(drawing)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const rotatedPoints = drawing.points.map(point => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    }
  })

  return new Drawing(
    drawing.id,
    drawing.whiteboardId,
    drawing.tool,
    drawing.color,
    drawing.size,
    rotatedPoints,
    drawing.userId,
    drawing.createdAt,
    new Date()
  )
}

/**
 * Scale drawing around center
 * 
 * @param drawing - Drawing to scale
 * @param scaleX - X scale factor
 * @param scaleY - Y scale factor
 * @returns Scaled drawing
 */
export const scaleDrawing = (drawing: Drawing, scaleX: number, scaleY: number = scaleX): Drawing => {
  const center = calculateDrawingCenter(drawing)

  const scaledPoints = drawing.points.map(point => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    
    return {
      x: center.x + dx * scaleX,
      y: center.y + dy * scaleY
    }
  })

  return new Drawing(
    drawing.id,
    drawing.whiteboardId,
    drawing.tool,
    drawing.color,
    drawing.size,
    scaledPoints,
    drawing.userId,
    drawing.createdAt,
    new Date()
  )
}

/**
 * Translate drawing
 * 
 * @param drawing - Drawing to translate
 * @param deltaX - X translation amount
 * @param deltaY - Y translation amount
 * @returns Translated drawing
 */
export const translateDrawing = (drawing: Drawing, deltaX: number, deltaY: number): Drawing => {
  const translatedPoints = drawing.points.map(point => ({
    x: point.x + deltaX,
    y: point.y + deltaY
  }))

  return new Drawing(
    drawing.id,
    drawing.whiteboardId,
    drawing.tool,
    drawing.color,
    drawing.size,
    translatedPoints,
    drawing.userId,
    drawing.createdAt,
    new Date()
  )
}

/**
 * Get drawing statistics
 * 
 * @param drawing - Drawing to analyze
 * @returns Drawing statistics
 */
export const getDrawingStatistics = (drawing: Drawing) => {
  const pathLength = calculatePathLength(drawing.points)
  const complexity = calculateComplexityScore(drawing.points)
  const bounds = calculateBounds(drawing.points)
  const gesture = detectGesture(drawing.points)

  return {
    pathLength,
    complexity,
    bounds,
    gesture,
    pointCount: drawing.points.length,
    area: bounds.width * bounds.height,
    aspectRatio: bounds.width / bounds.height
  }
}

/**
 * Create drawing operation
 * 
 * @param type - Operation type
 * @param drawing - Drawing data
 * @returns Drawing operation
 */
export const createDrawingOperation = (type: 'add' | 'update' | 'delete', drawing: Drawing): DrawingOperation => {
  return {
    type,
    drawing,
    timestamp: Date.now()
  }
}

export default {
  calculatePathLength,
  calculateComplexityScore,
  detectGesture,
  optimizeDrawing,
  calculateDrawingBoundsWithPadding,
  checkDrawingsIntersect,
  mergeDrawings,
  splitDrawing,
  calculateDrawingCenter,
  rotateDrawing,
  scaleDrawing,
  translateDrawing,
  getDrawingStatistics,
  createDrawingOperation
}
