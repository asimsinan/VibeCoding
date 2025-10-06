/**
 * Domain Model Types
 * Core business entities for the Collaborative Whiteboard application
 * 
 * @fileoverview TypeScript types for domain models
 * @version 1.0.0
 */

// Import types first
import type {
  Point,
  Position,
  WhiteboardSettings,
  Whiteboard,
  Drawing,
  StickyNote,
  User,
  CreateWhiteboardRequest,
  UpdateWhiteboardRequest,
  CreateDrawingRequest,
  UpdateDrawingRequest,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  DrawingEvent,
  StickyNoteEvent,
  UserPresenceEvent,
  WhiteboardClearEvent,
  WhiteboardUpdateEvent,
  ServiceResponse,
  PaginationParams,
  PaginatedResponse
} from './api'

// Re-export API types for consistency
export type {
  Point,
  Position,
  WhiteboardSettings,
  Whiteboard,
  Drawing,
  StickyNote,
  User,
  CreateWhiteboardRequest as CreateWhiteboardParams,
  UpdateWhiteboardRequest as UpdateWhiteboardParams,
  CreateDrawingRequest as CreateDrawingParams,
  UpdateDrawingRequest as UpdateDrawingParams,
  CreateStickyNoteRequest as CreateStickyNoteParams,
  UpdateStickyNoteRequest as UpdateStickyNoteParams,
  DrawingEvent,
  StickyNoteEvent,
  UserPresenceEvent as UserEvent,
  WhiteboardClearEvent,
  WhiteboardUpdateEvent,
  ServiceResponse,
  PaginationParams,
  PaginatedResponse
} from './api'

/**
 * Drawing tool types
 */
export type DrawingTool = 'pen' | 'brush' | 'eraser';

/**
 * User presence update parameters
 */
export interface UpdateUserPresenceParams {
  readonly displayName?: string;
  readonly cursorPosition?: Position;
  readonly whiteboardId?: string;
}

/**
 * Validation error for domain models
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Domain validation result
 */
export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: ValidationError[];
}

/**
 * Drawing tool configuration
 */
export interface DrawingToolConfig {
  readonly tool: DrawingTool;
  readonly minSize: number;
  readonly maxSize: number;
  readonly defaultColor: string;
  readonly supportedColors: string[];
}

/**
 * Whiteboard dimensions
 */
export interface WhiteboardDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Bounding box for elements
 */
export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Real-time event types
 */
export type RealtimeEventType = 'drawing' | 'sticky_note' | 'user_presence' | 'whiteboard_clear' | 'whiteboard_update' | 'shape' | 'text';

/**
 * Real-time event payload
 */
export interface RealtimeEvent<T = any> {
  readonly type: RealtimeEventType;
  readonly payload: T;
  readonly action: 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR';
  readonly timestamp: string;
}

/**
 * Drawing real-time event data
 */
export interface DrawingEventData {
  readonly drawing: Drawing;
}

/**
 * Sticky note real-time event data
 */
export interface StickyNoteEventData {
  readonly stickyNote: StickyNote;
}

/**
 * User presence real-time event data
 */
export interface UserPresenceEventData {
  readonly user: User;
  readonly cursorPosition?: Position;
}

/**
 * Whiteboard clear real-time event data
 */
export interface WhiteboardClearEventData {
  readonly whiteboardId: string;
  readonly clearedAt: string;
  readonly clearedBy: string;
}
