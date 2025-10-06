/**
 * Drawing Service
 * Business logic for drawing operations
 * 
 * @fileoverview Drawing service with CRUD operations and canvas manipulation
 * @version 1.0.0
 */

import { Drawing } from '../models/Drawing'
import { CreateDrawingParams, UpdateDrawingParams, Point } from '@/contracts/types/domain'
// import { whiteboardApi, CreateDrawingRequest, UpdateDrawingRequest } from '@/lib/api/whiteboardApi' // Unused imports

export class DrawingService {
  /**
   * Create a new drawing
   * FR-002: Create drawing functionality
   */
  static async createDrawing(whiteboardId: string, params: CreateDrawingParams): Promise<Drawing> {
    try {
      // Call the model directly instead of going through the API to avoid circular dependency
      return await Drawing.create(whiteboardId, params)
    } catch (error) {
      console.error('Error creating drawing:', error)
      throw error
    }
  }

  /**
   * Get drawing by ID
   * FR-002: Retrieve drawing functionality
   */
  static async getDrawing(id: string): Promise<Drawing | null> {
    try {
      // For now, fallback to direct database access
      // In a full implementation, we'd have a GET /drawings/{id} endpoint
      return await Drawing.getById(id)
    } catch (error) {
      console.error('Error getting drawing:', error)
      throw error
    }
  }

  /**
   * Update drawing
   * FR-002: Update drawing functionality
   */
  static async updateDrawing(id: string, params: UpdateDrawingParams): Promise<Drawing> {
    try {
      // First get the drawing to find its whiteboard ID
      const drawing = await Drawing.getById(id)
      if (!drawing) {
        throw new Error('Drawing not found')
      }

      // const apiRequest: UpdateDrawingRequest = { // Unused variable
      //   tool: params.tool,
      //   color: params.color,
      //   size: params.size,
      //   points: params.points
      // }

      // Call the model's update method directly
      return await drawing.update(params)
    } catch (error) {
      console.error('Error updating drawing:', error)
      throw error
    }
  }

  /**
   * Delete drawing
   * FR-002: Delete drawing functionality
   */
  static async deleteDrawing(id: string): Promise<void> {
    try {
      console.log('🧹 DrawingService.deleteDrawing called for:', id)
      // First get the drawing to find its whiteboard ID
      const drawing = await Drawing.getById(id)
      if (!drawing) {
        console.warn('🧹 Drawing not found during delete (may have been deleted by another user):', id)
        // Don't throw error - just log warning and return
        // This handles race conditions where the drawing was already deleted
        return
      }

      console.log('🧹 Found drawing, calling drawing.delete()')
      // Call the model's delete method directly
      await drawing.delete()
      console.log('🧹 Drawing.delete() completed successfully')
    } catch (error) {
      console.error('🧹 Error deleting drawing:', error)
      
      // If it's a "not found" error, handle it gracefully
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Drawing not found during delete (may have been deleted by another user):', id)
        // Don't throw error - just log warning and return
        return
      }
      
      throw error
    }
  }

  /**
   * Get all drawings for whiteboard
   * FR-002: List drawings functionality
   */
  static async getDrawingsForWhiteboard(whiteboardId: string): Promise<Drawing[]> {
    try {
      // Call the model directly instead of going through the API to avoid circular dependency
      return await Drawing.getByWhiteboardId(whiteboardId)
    } catch (error) {
      console.error('Error getting drawings:', error)
      throw error
    }
  }

  /**
   * Clear all drawings for whiteboard
   * FR-007: Clear whiteboard functionality
   */
  static async clearDrawingsForWhiteboard(whiteboardId: string): Promise<void> {
    try {
      // Get all drawings for the whiteboard and delete them
      const drawings = await Drawing.getByWhiteboardId(whiteboardId)
      await Promise.all(drawings.map(drawing => drawing.delete()))
    } catch (error) {
      console.error('Error clearing drawings:', error)
      throw error
    }
  }

  /**
   * Validate drawing points
   * Ensures points are within whiteboard bounds
   */
  static validatePoints(points: Point[], whiteboardWidth: number, whiteboardHeight: number): boolean {
    return points.every(point => 
      point.x >= 0 && point.x <= whiteboardWidth &&
      point.y >= 0 && point.y <= whiteboardHeight
    )
  }

  /**
   * Optimize drawing points
   * Reduces number of points for better performance
   */
  static optimizePoints(points: Point[], threshold: number = 2): Point[] {
    if (!points || points.length <= 2) return points

    const firstPoint = points[0]
    if (!firstPoint) return points
    const optimized: Point[] = [firstPoint]
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const current = points[i]
      
      if (!prev || !current) continue
      
      const distance = Math.sqrt(
        Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
      )
      
      if (distance > threshold) {
        optimized.push(current)
      }
    }
    
    const lastPoint = points[points.length - 1]
    if (lastPoint) {
      optimized.push(lastPoint)
    }
    return optimized
  }

  /**
   * Calculate drawing bounds
   * Returns bounding box for a set of points
   */
  static calculateBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (!points || points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    }

    const firstPoint = points[0]
    if (!firstPoint) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
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

    return { minX, minY, maxX, maxY }
  }

  /**
   * Check if drawing intersects with another drawing
   * Used for collision detection
   */
  static checkIntersection(points1: Point[], points2: Point[], tolerance: number = 5): boolean {
    const bounds1 = this.calculateBounds(points1)
    const bounds2 = this.calculateBounds(points2)

    // Check if bounding boxes intersect
    if (bounds1.maxX < bounds2.minX - tolerance || bounds1.minX > bounds2.maxX + tolerance ||
        bounds1.maxY < bounds2.minY - tolerance || bounds1.minY > bounds2.maxY + tolerance) {
      return false
    }

    // Check for point-to-point intersections
    for (const point1 of points1) {
      for (const point2 of points2) {
        const distance = Math.sqrt(
          Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
        )
        if (distance <= tolerance) {
          return true
        }
      }
    }

    return false
  }
}

// Export a singleton instance
export const drawingService = new DrawingService()
export default drawingService
