/**
 * Canvas Utilities
 * 
 * Utility functions for canvas manipulation and drawing operations.
 * Provides helper functions for coordinate transformations, drawing calculations,
 * and canvas state management.
 */

import { Drawing } from '../models/Drawing'
import { DrawingTool } from '@/contracts/types/domain'
import { StickyNote } from '../models/StickyNote'

/**
 * Canvas configuration interface
 */
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  gridSize?: number
  showGrid?: boolean
}

/**
 * Point interface for coordinates
 */
export interface Point {
  x: number
  y: number
}

/**
 * Bounds interface for rectangular areas
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Default canvas configuration
 */
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  gridSize: 20,
  showGrid: false
}

/**
 * Normalize coordinates to canvas bounds
 * 
 * @param point - Point to normalize
 * @param bounds - Canvas bounds
 * @returns Normalized point
 */
export const normalizeCoordinates = (point: Point, bounds: Bounds): Point => {
  return {
    x: Math.max(0, Math.min(point.x, bounds.width)),
    y: Math.max(0, Math.min(point.y, bounds.height))
  }
}

/**
 * Check if point is within bounds
 * 
 * @param point - Point to check
 * @param bounds - Bounds to check against
 * @returns True if point is within bounds
 */
export const isPointInBounds = (point: Point, bounds: Bounds): boolean => {
  return point.x >= bounds.x && 
         point.x <= bounds.x + bounds.width &&
         point.y >= bounds.y && 
         point.y <= bounds.y + bounds.height
}

/**
 * Calculate distance between two points
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance between points
 */
export const calculateDistance = (point1: Point, point2: Point): number => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate angle between two points
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Angle in radians
 */
export const calculateAngle = (point1: Point, point2: Point): number => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x)
}

/**
 * Interpolate between two points
 * 
 * @param point1 - Start point
 * @param point2 - End point
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated point
 */
export const interpolatePoints = (point1: Point, point2: Point, t: number): Point => {
  return {
    x: point1.x + (point2.x - point1.x) * t,
    y: point1.y + (point2.y - point1.y) * t
  }
}

/**
 * Smooth drawing path using Bezier curves
 * 
 * @param points - Array of points to smooth
 * @param tension - Smoothing tension (0-1)
 * @returns Smoothed points
 */
export const smoothPath = (points: Point[], tension: number = 0.5): Point[] => {
  if (!points || points.length < 3) return points

  const firstPoint = points[0]
  if (!firstPoint) return points

  const smoothed: Point[] = [firstPoint]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    if (!prev || !curr || !next) continue

    const cp1 = {
      x: curr.x - (next.x - prev.x) * tension,
      y: curr.y - (next.y - prev.y) * tension
    }

    const cp2 = {
      x: curr.x + (next.x - prev.x) * tension,
      y: curr.y + (next.y - prev.y) * tension
    }

    // Add control points for Bezier curve
    smoothed.push(cp1, curr, cp2)
  }

  const lastPoint = points[points.length - 1]
  if (lastPoint) {
    smoothed.push(lastPoint)
  }
  return smoothed
}

/**
 * Optimize drawing points by removing redundant points
 * 
 * @param points - Array of points to optimize
 * @param threshold - Distance threshold for point removal
 * @returns Optimized points
 */
export const optimizePoints = (points: Point[], threshold: number = 2): Point[] => {
  if (!points || points.length < 3) return points

  const firstPoint = points[0]
  if (!firstPoint) return points

  const optimized: Point[] = [firstPoint]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = optimized[optimized.length - 1]
    const curr = points[i]

    if (!prev || !curr) continue

    if (calculateDistance(prev, curr) > threshold) {
      optimized.push(curr)
    }
  }

  // Always include the last point
  const lastPoint = points[points.length - 1]
  if (lastPoint) {
    optimized.push(lastPoint)
  }
  return optimized
}

/**
 * Calculate bounding box for drawing
 * 
 * @param points - Array of points
 * @returns Bounding box
 */
export const calculateBounds = (points: Point[]): Bounds => {
  if (!points || points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const firstPoint = points[0]
  if (!firstPoint) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = firstPoint.x
  let minY = firstPoint.y
  let maxX = firstPoint.x
  let maxY = firstPoint.y

  for (const point of points) {
    if (!point) continue
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Check if drawing intersects with sticky note
 * 
 * @param drawing - Drawing to check
 * @param stickyNote - Sticky note to check against
 * @returns True if they intersect
 */
export const checkDrawingStickyNoteIntersection = (
  drawing: Drawing,
  stickyNote: StickyNote
): boolean => {
  const drawingBounds = calculateBounds(drawing.points)
  const stickyNoteBounds = {
    x: stickyNote.position.x,
    y: stickyNote.position.y,
    width: 200, // Default sticky note width
    height: 150 // Default sticky note height
  }

  return !(
    drawingBounds.x > stickyNoteBounds.x + stickyNoteBounds.width ||
    drawingBounds.x + drawingBounds.width < stickyNoteBounds.x ||
    drawingBounds.y > stickyNoteBounds.y + stickyNoteBounds.height ||
    drawingBounds.y + drawingBounds.height < stickyNoteBounds.y
  )
}

/**
 * Generate grid points for canvas
 * 
 * @param config - Canvas configuration
 * @returns Array of grid points
 */
export const generateGridPoints = (config: CanvasConfig): Point[] => {
  if (!config.showGrid || !config.gridSize) return []

  const points: Point[] = []
  const { width, height, gridSize } = config

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    points.push({ x, y: 0 })
    points.push({ x, y: height })
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    points.push({ x: 0, y })
    points.push({ x: width, y })
  }

  return points
}

/**
 * Convert canvas coordinates to screen coordinates
 * 
 * @param point - Canvas point
 * @param scale - Scale factor
 * @param offset - Offset point
 * @returns Screen coordinates
 */
export const canvasToScreen = (point: Point, scale: number = 1, offset: Point = { x: 0, y: 0 }): Point => {
  return {
    x: point.x * scale + offset.x,
    y: point.y * scale + offset.y
  }
}

/**
 * Convert screen coordinates to canvas coordinates
 * 
 * @param point - Screen point
 * @param scale - Scale factor
 * @param offset - Offset point
 * @returns Canvas coordinates
 */
export const screenToCanvas = (point: Point, scale: number = 1, offset: Point = { x: 0, y: 0 }): Point => {
  return {
    x: (point.x - offset.x) / scale,
    y: (point.y - offset.y) / scale
  }
}

/**
 * Get drawing tool properties
 * 
 * @param tool - Drawing tool
 * @returns Tool properties
 */
export const getDrawingToolProperties = (tool: DrawingTool) => {
  switch (tool) {
    case 'pen':
      return {
        name: 'Pen',
        icon: '✏️',
        defaultSize: 2,
        minSize: 1,
        maxSize: 10
      }
    case 'brush':
      return {
        name: 'Brush',
        icon: '🖌️',
        defaultSize: 5,
        minSize: 1,
        maxSize: 50
      }
    case 'eraser':
      return {
        name: 'Eraser',
        icon: '🧹',
        defaultSize: 10,
        minSize: 5,
        maxSize: 50
      }
    default:
      return {
        name: 'Unknown',
        icon: '❓',
        defaultSize: 2,
        minSize: 1,
        maxSize: 10
      }
  }
}

/**
 * Validate drawing data
 * 
 * @param drawing - Drawing to validate
 * @param bounds - Canvas bounds
 * @returns Validation result
 */
export const validateDrawing = (drawing: Drawing, bounds: Bounds): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!drawing.points || drawing.points.length === 0) {
    errors.push('Drawing must have at least one point')
  }

  if (drawing.points) {
    for (const point of drawing.points) {
      if (!isPointInBounds(point, bounds)) {
        errors.push('All drawing points must be within canvas bounds')
        break
      }
    }
  }

  if (drawing.size < 1 || drawing.size > 50) {
    errors.push('Drawing size must be between 1 and 50')
  }

  if (!drawing.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    errors.push('Drawing color must be a valid hex color')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  normalizeCoordinates,
  isPointInBounds,
  calculateDistance,
  calculateAngle,
  interpolatePoints,
  smoothPath,
  optimizePoints,
  calculateBounds,
  checkDrawingStickyNoteIntersection,
  generateGridPoints,
  canvasToScreen,
  screenToCanvas,
  getDrawingToolProperties,
  validateDrawing
}
