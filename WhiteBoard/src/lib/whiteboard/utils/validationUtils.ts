/**
 * Validation Utilities
 * 
 * Utility functions for input validation and data sanitization.
 * Provides helper functions for validating user inputs, drawing data,
 * and whiteboard operations.
 */

import { Drawing } from '../models/Drawing'
import { DrawingTool } from '@/contracts/types/domain'
import { StickyNote } from '../models/StickyNote'
import { Whiteboard } from '../models/Whiteboard'
import { User } from '../models/User'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Input validation rules
 */
export const VALIDATION_RULES = {
  DRAWING: {
    TOOL: ['pen', 'brush', 'eraser'] as DrawingTool[],
    COLOR_PATTERN: /^#[0-9A-Fa-f]{6}$/,
    SIZE_MIN: 1,
    SIZE_MAX: 50,
    POINTS_MIN: 1,
    POINTS_MAX: 10000
  },
  STICKY_NOTE: {
    CONTENT_MIN: 1,
    CONTENT_MAX: 500,
    COLOR_PATTERN: /^#[0-9A-Fa-f]{6}$/,
    POSITION_MIN: 0,
    POSITION_MAX: 10000
  },
  WHITEBOARD: {
    NAME_MIN: 1,
    NAME_MAX: 100,
    WIDTH_MIN: 100,
    WIDTH_MAX: 4000,
    HEIGHT_MIN: 100,
    HEIGHT_MAX: 4000
  },
  USER: {
    DISPLAY_NAME_MIN: 1,
    DISPLAY_NAME_MAX: 50,
    CURSOR_POSITION_MIN: 0,
    CURSOR_POSITION_MAX: 10000
  }
}

/**
 * Validate drawing data
 * 
 * @param drawing - Drawing to validate
 * @returns Validation result
 */
export const validateDrawing = (drawing: Drawing): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate tool
  if (!VALIDATION_RULES.DRAWING.TOOL.includes(drawing.tool)) {
    errors.push(`Invalid drawing tool: ${drawing.tool}`)
  }

  // Validate color
  if (!VALIDATION_RULES.DRAWING.COLOR_PATTERN.test(drawing.color)) {
    errors.push(`Invalid drawing color format: ${drawing.color}`)
  }

  // Validate size
  if (drawing.size < VALIDATION_RULES.DRAWING.SIZE_MIN || drawing.size > VALIDATION_RULES.DRAWING.SIZE_MAX) {
    errors.push(`Drawing size must be between ${VALIDATION_RULES.DRAWING.SIZE_MIN} and ${VALIDATION_RULES.DRAWING.SIZE_MAX}`)
  }

  // Validate points
  if (!drawing.points || drawing.points.length < VALIDATION_RULES.DRAWING.POINTS_MIN) {
    errors.push(`Drawing must have at least ${VALIDATION_RULES.DRAWING.POINTS_MIN} point`)
  } else if (drawing.points.length > VALIDATION_RULES.DRAWING.POINTS_MAX) {
    errors.push(`Drawing has too many points (${drawing.points.length}), maximum is ${VALIDATION_RULES.DRAWING.POINTS_MAX}`)
  } else {
    // Validate individual points
    for (let i = 0; i < drawing.points.length; i++) {
      const point = drawing.points[i]
      if (!point) {
        errors.push(`Invalid point at index ${i}: point cannot be null or undefined`)
        continue
      }
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        errors.push(`Invalid point at index ${i}: coordinates must be numbers`)
      } else if (isNaN(point.x) || isNaN(point.y)) {
        errors.push(`Invalid point at index ${i}: coordinates cannot be NaN`)
      } else if (!isFinite(point.x) || !isFinite(point.y)) {
        errors.push(`Invalid point at index ${i}: coordinates must be finite`)
      }
    }
  }

  // Validate required fields
  if (!drawing.whiteboardId) {
    errors.push('Whiteboard ID is required')
  }

  if (!drawing.userId) {
    errors.push('User ID is required')
  }

  // Validate timestamps
  if (drawing.createdAt && isNaN(new Date(drawing.createdAt).getTime())) {
    errors.push('Invalid created date format')
  }

  if (drawing.updatedAt && isNaN(new Date(drawing.updatedAt).getTime())) {
    errors.push('Invalid updated date format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate sticky note data
 * 
 * @param stickyNote - Sticky note to validate
 * @returns Validation result
 */
export const validateStickyNote = (stickyNote: StickyNote): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate content
  if (!stickyNote.content || stickyNote.content.trim().length < VALIDATION_RULES.STICKY_NOTE.CONTENT_MIN) {
    errors.push(`Sticky note content must be at least ${VALIDATION_RULES.STICKY_NOTE.CONTENT_MIN} character`)
  } else if (stickyNote.content.length > VALIDATION_RULES.STICKY_NOTE.CONTENT_MAX) {
    errors.push(`Sticky note content cannot exceed ${VALIDATION_RULES.STICKY_NOTE.CONTENT_MAX} characters`)
  }

  // Validate color
  if (!VALIDATION_RULES.STICKY_NOTE.COLOR_PATTERN.test(stickyNote.color)) {
    errors.push(`Invalid sticky note color format: ${stickyNote.color}`)
  }

  // Validate position
  if (!stickyNote.position || typeof stickyNote.position.x !== 'number' || typeof stickyNote.position.y !== 'number') {
    errors.push('Sticky note position must have valid x and y coordinates')
  } else {
    if (stickyNote.position.x < VALIDATION_RULES.STICKY_NOTE.POSITION_MIN || stickyNote.position.x > VALIDATION_RULES.STICKY_NOTE.POSITION_MAX) {
      errors.push(`Sticky note x position must be between ${VALIDATION_RULES.STICKY_NOTE.POSITION_MIN} and ${VALIDATION_RULES.STICKY_NOTE.POSITION_MAX}`)
    }
    if (stickyNote.position.y < VALIDATION_RULES.STICKY_NOTE.POSITION_MIN || stickyNote.position.y > VALIDATION_RULES.STICKY_NOTE.POSITION_MAX) {
      errors.push(`Sticky note y position must be between ${VALIDATION_RULES.STICKY_NOTE.POSITION_MIN} and ${VALIDATION_RULES.STICKY_NOTE.POSITION_MAX}`)
    }
  }

  // Validate required fields
  if (!stickyNote.whiteboardId) {
    errors.push('Whiteboard ID is required')
  }

  if (!stickyNote.userId) {
    errors.push('User ID is required')
  }

  // Validate timestamps
  if (stickyNote.createdAt && isNaN(new Date(stickyNote.createdAt).getTime())) {
    errors.push('Invalid created date format')
  }

  if (stickyNote.updatedAt && isNaN(new Date(stickyNote.updatedAt).getTime())) {
    errors.push('Invalid updated date format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate whiteboard data
 * 
 * @param whiteboard - Whiteboard to validate
 * @returns Validation result
 */
export const validateWhiteboard = (whiteboard: Whiteboard): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate name
  if (!whiteboard.name || whiteboard.name.trim().length < VALIDATION_RULES.WHITEBOARD.NAME_MIN) {
    errors.push(`Whiteboard name must be at least ${VALIDATION_RULES.WHITEBOARD.NAME_MIN} character`)
  } else if (whiteboard.name.length > VALIDATION_RULES.WHITEBOARD.NAME_MAX) {
    errors.push(`Whiteboard name cannot exceed ${VALIDATION_RULES.WHITEBOARD.NAME_MAX} characters`)
  }

  // Validate settings
  if (whiteboard.settings) {
    const { width, height, backgroundColor } = whiteboard.settings

    if (width !== undefined) {
      if (width < VALIDATION_RULES.WHITEBOARD.WIDTH_MIN || width > VALIDATION_RULES.WHITEBOARD.WIDTH_MAX) {
        errors.push(`Whiteboard width must be between ${VALIDATION_RULES.WHITEBOARD.WIDTH_MIN} and ${VALIDATION_RULES.WHITEBOARD.WIDTH_MAX}`)
      }
    }

    if (height !== undefined) {
      if (height < VALIDATION_RULES.WHITEBOARD.HEIGHT_MIN || height > VALIDATION_RULES.WHITEBOARD.HEIGHT_MAX) {
        errors.push(`Whiteboard height must be between ${VALIDATION_RULES.WHITEBOARD.HEIGHT_MIN} and ${VALIDATION_RULES.WHITEBOARD.HEIGHT_MAX}`)
      }
    }

    if (backgroundColor && !VALIDATION_RULES.DRAWING.COLOR_PATTERN.test(backgroundColor)) {
      errors.push(`Invalid background color format: ${backgroundColor}`)
    }
  }

  // Validate timestamps
  if (whiteboard.createdAt && isNaN(new Date(whiteboard.createdAt).getTime())) {
    errors.push('Invalid created date format')
  }

  if (whiteboard.updatedAt && isNaN(new Date(whiteboard.updatedAt).getTime())) {
    errors.push('Invalid updated date format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate user data
 * 
 * @param user - User to validate
 * @returns Validation result
 */
export const validateUser = (user: User): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate display name
  if (!user.displayName || user.displayName.trim().length < VALIDATION_RULES.USER.DISPLAY_NAME_MIN) {
    errors.push(`User display name must be at least ${VALIDATION_RULES.USER.DISPLAY_NAME_MIN} character`)
  } else if (user.displayName.length > VALIDATION_RULES.USER.DISPLAY_NAME_MAX) {
    errors.push(`User display name cannot exceed ${VALIDATION_RULES.USER.DISPLAY_NAME_MAX} characters`)
  }

  // Validate cursor position
  if (user.cursorPosition) {
    const { x, y } = user.cursorPosition
    if (typeof x !== 'number' || typeof y !== 'number') {
      errors.push('User cursor position must have valid x and y coordinates')
    } else {
      if (x < VALIDATION_RULES.USER.CURSOR_POSITION_MIN || x > VALIDATION_RULES.USER.CURSOR_POSITION_MAX) {
        errors.push(`User cursor x position must be between ${VALIDATION_RULES.USER.CURSOR_POSITION_MIN} and ${VALIDATION_RULES.USER.CURSOR_POSITION_MAX}`)
      }
      if (y < VALIDATION_RULES.USER.CURSOR_POSITION_MIN || y > VALIDATION_RULES.USER.CURSOR_POSITION_MAX) {
        errors.push(`User cursor y position must be between ${VALIDATION_RULES.USER.CURSOR_POSITION_MIN} and ${VALIDATION_RULES.USER.CURSOR_POSITION_MAX}`)
      }
    }
  }

  // Validate required fields
  if (!user.id) {
    errors.push('User ID is required')
  }

  // Validate timestamps
  if (user.lastSeen && isNaN(new Date(user.lastSeen).getTime())) {
    errors.push('Invalid last seen date format')
  }

  if (user.createdAt && isNaN(new Date(user.createdAt).getTime())) {
    errors.push('Invalid created date format')
  }

  if (user.updatedAt && isNaN(new Date(user.updatedAt).getTime())) {
    errors.push('Invalid updated date format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Sanitize drawing data
 * 
 * @param drawing - Drawing to sanitize
 * @returns Sanitized drawing
 */
export const sanitizeDrawing = (drawing: Drawing): Drawing => {
  return new Drawing(
    drawing.id,
    drawing.whiteboardId || '',
    VALIDATION_RULES.DRAWING.TOOL.includes(drawing.tool) ? drawing.tool : 'pen',
    VALIDATION_RULES.DRAWING.COLOR_PATTERN.test(drawing.color) ? drawing.color : '#000000',
    Math.max(VALIDATION_RULES.DRAWING.SIZE_MIN, Math.min(drawing.size, VALIDATION_RULES.DRAWING.SIZE_MAX)),
    drawing.points?.filter(point => 
      typeof point.x === 'number' && 
      typeof point.y === 'number' && 
      isFinite(point.x) && 
      isFinite(point.y)
    ) || [],
    drawing.userId || '',
    drawing.createdAt || new Date(),
    drawing.updatedAt || new Date()
  )
}

/**
 * Sanitize sticky note data
 * 
 * @param stickyNote - Sticky note to sanitize
 * @returns Sanitized sticky note
 */
export const sanitizeStickyNote = (stickyNote: StickyNote): StickyNote => {
  return new StickyNote(
    stickyNote.id,
    (stickyNote.content || '').trim().slice(0, VALIDATION_RULES.STICKY_NOTE.CONTENT_MAX),
    {
      x: Math.max(VALIDATION_RULES.STICKY_NOTE.POSITION_MIN, Math.min(stickyNote.position?.x || 0, VALIDATION_RULES.STICKY_NOTE.POSITION_MAX)),
      y: Math.max(VALIDATION_RULES.STICKY_NOTE.POSITION_MIN, Math.min(stickyNote.position?.y || 0, VALIDATION_RULES.STICKY_NOTE.POSITION_MAX))
    },
    VALIDATION_RULES.STICKY_NOTE.COLOR_PATTERN.test(stickyNote.color) ? stickyNote.color : '#FFE066',
    stickyNote.userId || '',
    stickyNote.whiteboardId || '',
    stickyNote.createdAt || new Date(),
    stickyNote.updatedAt || new Date()
  )
}

/**
 * Sanitize whiteboard data
 * 
 * @param whiteboard - Whiteboard to sanitize
 * @returns Sanitized whiteboard
 */
export const sanitizeWhiteboard = (whiteboard: Whiteboard): Whiteboard => {
  return new Whiteboard(
    whiteboard.id,
    (whiteboard.name || '').trim().slice(0, VALIDATION_RULES.WHITEBOARD.NAME_MAX),
    whiteboard.createdAt || new Date(),
    {
      width: Math.max(VALIDATION_RULES.WHITEBOARD.WIDTH_MIN, Math.min(whiteboard.settings?.width || 1920, VALIDATION_RULES.WHITEBOARD.WIDTH_MAX)),
      height: Math.max(VALIDATION_RULES.WHITEBOARD.HEIGHT_MIN, Math.min(whiteboard.settings?.height || 1080, VALIDATION_RULES.WHITEBOARD.HEIGHT_MAX)),
      backgroundColor: VALIDATION_RULES.DRAWING.COLOR_PATTERN.test(whiteboard.settings?.backgroundColor || '') ? whiteboard.settings.backgroundColor : '#ffffff'
    },
    whiteboard.updatedAt || new Date()
  )
}

/**
 * Sanitize user data
 * 
 * @param user - User to sanitize
 * @returns Sanitized user
 */
export const sanitizeUser = (user: User): User => {
  return new User(
    user.id,
    (user.displayName || '').trim().slice(0, VALIDATION_RULES.USER.DISPLAY_NAME_MAX),
    user.lastSeen || new Date(),
    user.cursorPosition ? {
      x: Math.max(VALIDATION_RULES.USER.CURSOR_POSITION_MIN, Math.min(user.cursorPosition.x, VALIDATION_RULES.USER.CURSOR_POSITION_MAX)),
      y: Math.max(VALIDATION_RULES.USER.CURSOR_POSITION_MIN, Math.min(user.cursorPosition.y, VALIDATION_RULES.USER.CURSOR_POSITION_MAX))
    } : undefined,
    user.whiteboardId || '',
    user.createdAt || new Date(),
    user.updatedAt || new Date()
  )
}

export default {
  validateDrawing,
  validateStickyNote,
  validateWhiteboard,
  validateUser,
  sanitizeDrawing,
  sanitizeStickyNote,
  sanitizeWhiteboard,
  sanitizeUser,
  VALIDATION_RULES
}
