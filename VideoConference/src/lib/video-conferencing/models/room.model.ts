/**
 * Room Model
 * Represents a video conference room with participants and messages
 */

import { z } from 'zod';

// Base room schema
export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
  maxParticipants: z.number().int().min(1).max(1000).default(2),
  settings: z.record(z.unknown()).default({}),
  createdBy: z.string().uuid().optional(),
});

// Room creation schema
export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxParticipants: z.number().int().min(1).max(1000).default(2),
  settings: z.record(z.unknown()).default({}),
});

// Room update schema
export const UpdateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// Room with participants schema
export const RoomWithParticipantsSchema = RoomSchema.extend({
  participants: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    isConnected: z.boolean(),
    connectionState: z.enum(['connecting', 'connected', 'disconnected', 'reconnecting']),
    mediaPermissions: z.object({
      camera: z.boolean(),
      microphone: z.boolean(),
      screenShare: z.boolean(),
    }),
    joinedAt: z.date(),
    lastSeen: z.date(),
  })),
  participantCount: z.number().int().min(0),
});

// Room summary schema (for listing)
export const RoomSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  participantCount: z.number().int().min(0),
  maxParticipants: z.number().int().min(1).max(1000),
  createdAt: z.date(),
  isActive: z.boolean(),
  lastActivity: z.date().optional(),
});

// Room analytics schema
export const RoomAnalyticsSchema = z.object({
  roomId: z.string().uuid(),
  roomName: z.string().optional(),
  roomCreatedAt: z.date(),
  totalParticipants: z.number().int().min(0),
  activeParticipants: z.number().int().min(0),
  totalMessages: z.number().int().min(0),
  lastMessageAt: z.date().optional(),
  avgSessionDurationSeconds: z.number().min(0).optional(),
});

// Type definitions
export type Room = z.infer<typeof RoomSchema>;
export type CreateRoom = z.infer<typeof CreateRoomSchema>;
export type UpdateRoom = z.infer<typeof UpdateRoomSchema>;
export type RoomWithParticipants = z.infer<typeof RoomWithParticipantsSchema>;
export type RoomSummary = z.infer<typeof RoomSummarySchema>;
export type RoomAnalytics = z.infer<typeof RoomAnalyticsSchema>;

// Database entity type (matches database schema)
export interface RoomEntity {
  id: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  max_participants: number;
  settings: Record<string, unknown>;
  created_by?: string;
}

// Room service class
export class RoomModel {
  /**
   * Create a new room model instance
   */
  static create(data: CreateRoom): Room {
    const validatedData = CreateRoomSchema.parse(data);
    return {
      id: crypto.randomUUID(),
      name: validatedData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      maxParticipants: validatedData.maxParticipants,
      settings: validatedData.settings,
    };
  }

  /**
   * Convert database entity to model
   */
  static fromEntity(entity: RoomEntity): Room {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      isActive: entity.is_active,
      maxParticipants: entity.max_participants,
      settings: entity.settings,
      createdBy: entity.created_by,
    };
  }

  /**
   * Convert model to database entity
   */
  static toEntity(room: CreateRoom): Omit<RoomEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      ...(room.name && { name: room.name }),
      is_active: true,
      max_participants: room.maxParticipants,
      settings: room.settings,
    };
  }

  /**
   * Validate room data
   */
  static validate(data: unknown): { isValid: boolean; data?: Room; errors?: string[] } {
    try {
      const room = RoomSchema.parse(data);
      return { isValid: true, data: room };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate room creation data
   */
  static validateCreate(data: unknown): { isValid: boolean; data?: CreateRoom; errors?: string[] } {
    try {
      const room = CreateRoomSchema.parse(data);
      return { isValid: true, data: room };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate room update data
   */
  static validateUpdate(data: unknown): { isValid: boolean; data?: UpdateRoom; errors?: string[] } {
    try {
      const room = UpdateRoomSchema.parse(data);
      return { isValid: true, data: room };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Check if room is full
   */
  static isFull(room: Room, currentParticipantCount: number): boolean {
    return currentParticipantCount >= room.maxParticipants;
  }

  /**
   * Check if room is active
   */
  static isActive(room: Room): boolean {
    return room.isActive;
  }

  /**
   * Get room display name
   */
  static getDisplayName(room: Room): string {
    return room.name || `Room ${room.id.slice(0, 8)}`;
  }

  /**
   * Check if room can be joined
   */
  static canJoin(room: Room, currentParticipantCount: number): { canJoin: boolean; reason?: string } {
    if (!this.isActive(room)) {
      return { canJoin: false, reason: 'Room is not active' };
    }
    
    if (this.isFull(room, currentParticipantCount)) {
      return { canJoin: false, reason: 'Room is full' };
    }
    
    return { canJoin: true };
  }

  /**
   * Get room settings with defaults
   */
  static getSettings(room: Room): Record<string, unknown> {
    const defaults = {
      allowScreenShare: true,
      allowChat: true,
      requireApproval: false,
      recordingEnabled: false,
      maxDuration: 0, // 0 = no limit
    };
    
    return { ...defaults, ...room.settings };
  }

  /**
   * Update room settings
   */
  static updateSettings(room: Room, newSettings: Record<string, unknown>): Room {
    return {
      ...room,
      settings: { ...room.settings, ...newSettings },
      updatedAt: new Date(),
    };
  }
}
