/**
 * Participant Model
 * Represents a participant in a video conference room
 */

import { z } from 'zod';
import { MediaPermissions } from '../../../contracts/types/api.types';

// Connection state enum
export const ConnectionState = z.enum(['connecting', 'connected', 'disconnected', 'reconnecting']);

// Base participant schema
export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_\u00C0-\u017F]+$/),
  isConnected: z.boolean().default(false),
  connectionState: ConnectionState.default('connecting'),
  mediaPermissions: z.object({
    camera: z.boolean().default(true),
    microphone: z.boolean().default(true),
    screenShare: z.boolean().default(false),
  }),
  joinedAt: z.date(),
  lastSeen: z.date(),
  webrtcPeerId: z.string().max(100).optional(),
  clientInfo: z.record(z.unknown()).default({}),
});

// Participant creation schema
export const CreateParticipantSchema = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_\u00C0-\u017F]+$/),
  isConnected: z.boolean().optional(),
  mediaPermissions: z.object({
    camera: z.boolean().default(true),
    microphone: z.boolean().default(true),
    screenShare: z.boolean().default(false),
  }).default({
    camera: true,
    microphone: true,
    screenShare: false,
  }),
  webrtcPeerId: z.string().max(100).optional(),
  clientInfo: z.record(z.unknown()).default({}),
});

// Participant update schema
export const UpdateParticipantSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/).optional(),
  isConnected: z.boolean().optional(),
  connectionState: ConnectionState.optional(),
  mediaPermissions: z.object({
    camera: z.boolean(),
    microphone: z.boolean(),
    screenShare: z.boolean(),
  }).optional(),
  webrtcPeerId: z.string().max(100).optional(),
  clientInfo: z.record(z.unknown()).optional(),
});

// Participant with room info schema
export const ParticipantWithRoomSchema = ParticipantSchema.extend({
  roomName: z.string().optional(),
  roomIsActive: z.boolean(),
});

// Participant summary schema (for listing)
export const ParticipantSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isConnected: z.boolean(),
  connectionState: ConnectionState,
  mediaPermissions: z.object({
    camera: z.boolean(),
    microphone: z.boolean(),
    screenShare: z.boolean(),
  }),
  joinedAt: z.date(),
  lastSeen: z.date(),
  sessionDuration: z.number().min(0).optional(),
});

// Media state change schema
export const MediaStateChangeSchema = z.object({
  id: z.string().uuid(),
  participantId: z.string().uuid(),
  permissionType: z.enum(['camera', 'microphone', 'screen_share']),
  oldValue: z.boolean(),
  newValue: z.boolean(),
  changedAt: z.date(),
  reason: z.string().max(100).optional(),
});

// Type definitions
export type Participant = z.infer<typeof ParticipantSchema>;
export type CreateParticipant = z.infer<typeof CreateParticipantSchema>;
export type UpdateParticipant = z.infer<typeof UpdateParticipantSchema>;
export type ParticipantWithRoom = z.infer<typeof ParticipantWithRoomSchema>;
export type ParticipantSummary = z.infer<typeof ParticipantSummarySchema>;
export type MediaStateChange = z.infer<typeof MediaStateChangeSchema>;
export type ConnectionStateType = z.infer<typeof ConnectionState>;

// Database entity type (matches database schema)
export interface ParticipantEntity {
  id: string;
  room_id: string;
  name: string;
  is_connected: boolean;
  connection_state: string;
  media_permissions: MediaPermissions;
  joined_at: Date;
  last_seen: Date;
  webrtc_peer_id?: string;
  client_info: Record<string, unknown>;
}

// Media state change entity
export interface MediaStateChangeEntity {
  id: string;
  participant_id: string;
  permission_type: string;
  old_value: boolean;
  new_value: boolean;
  changed_at: Date;
  reason?: string;
}

// Participant service class
export class ParticipantModel {
  /**
   * Create a new participant model instance
   */
  static create(data: CreateParticipant): Participant {
    const validatedData = CreateParticipantSchema.parse(data);
    return {
      id: crypto.randomUUID(),
      roomId: validatedData.roomId,
      name: validatedData.name,
      isConnected: false,
      connectionState: 'disconnected',
      mediaPermissions: validatedData.mediaPermissions,
      joinedAt: new Date(),
      lastSeen: new Date(),
      clientInfo: {},
    };
  }

  /**
   * Convert database entity to model
   */
  static fromEntity(entity: ParticipantEntity): Participant {
    return {
      id: entity.id,
      roomId: entity.room_id,
      name: entity.name,
      isConnected: entity.is_connected,
      connectionState: entity.connection_state as ConnectionStateType,
      mediaPermissions: entity.media_permissions,
      joinedAt: entity.joined_at,
      lastSeen: entity.last_seen,
      webrtcPeerId: entity.webrtc_peer_id,
      clientInfo: entity.client_info,
    };
  }

  /**
   * Convert model to database entity
   */
  static toEntity(participant: CreateParticipant): Omit<ParticipantEntity, 'id' | 'joined_at' | 'last_seen'> {
    return {
      room_id: participant.roomId,
      name: participant.name,
      is_connected: false,
      connection_state: 'connecting',
      media_permissions: participant.mediaPermissions,
      ...(participant.webrtcPeerId && { webrtc_peer_id: participant.webrtcPeerId }),
      client_info: participant.clientInfo,
    };
  }

  /**
   * Validate participant data
   */
  static validate(data: unknown): { isValid: boolean; data?: Participant; errors?: string[] } {
    try {
      const participant = ParticipantSchema.parse(data);
      return { isValid: true, data: participant };
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
   * Validate participant creation data
   */
  static validateCreate(data: unknown): { isValid: boolean; data?: CreateParticipant; errors?: string[] } {
    try {
      const participant = CreateParticipantSchema.parse(data);
      return { isValid: true, data: participant };
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
   * Validate participant update data
   */
  static validateUpdate(data: unknown): { isValid: boolean; data?: UpdateParticipant; errors?: string[] } {
    try {
      const participant = UpdateParticipantSchema.parse(data);
      return { isValid: true, data: participant };
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
   * Check if participant is connected
   */
  static isConnected(participant: Participant): boolean {
    return participant.isConnected && participant.connectionState === 'connected';
  }

  /**
   * Check if participant is active (recently seen)
   */
  static isActive(participant: Participant, maxInactiveMinutes: number = 5): boolean {
    const now = new Date();
    const lastSeen = new Date(participant.lastSeen);
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes <= maxInactiveMinutes;
  }

  /**
   * Get session duration in seconds
   */
  static getSessionDuration(participant: Participant): number {
    const now = new Date();
    const joinedAt = new Date(participant.joinedAt);
    return Math.floor((now.getTime() - joinedAt.getTime()) / 1000);
  }

  /**
   * Update connection state
   */
  static updateConnectionState(
    participant: Participant, 
    isConnected: boolean, 
    connectionState: ConnectionStateType
  ): Participant {
    return {
      ...participant,
      isConnected,
      connectionState,
      lastSeen: new Date(),
    };
  }

  /**
   * Update media permissions
   */
  static updateMediaPermissions(
    participant: Participant, 
    mediaPermissions: MediaPermissions
  ): { participant: Participant; changes: MediaStateChange[] } {
    const changes: MediaStateChange[] = [];
    const oldPermissions = participant.mediaPermissions;
    
    // Check for changes in each permission
    (Object.keys(mediaPermissions) as Array<keyof MediaPermissions>).forEach(key => {
      if (oldPermissions[key] !== mediaPermissions[key]) {
        changes.push({
          id: crypto.randomUUID(),
          participantId: participant.id,
          permissionType: key as 'camera' | 'microphone' | 'screen_share',
          oldValue: oldPermissions[key] as boolean,
          newValue: mediaPermissions[key] as boolean,
          changedAt: new Date(),
        });
      }
    });

    return {
      participant: {
        ...participant,
        mediaPermissions,
        lastSeen: new Date(),
      },
      changes,
    };
  }

  /**
   * Update last seen timestamp
   */
  static updateLastSeen(participant: Participant): Participant {
    return {
      ...participant,
      lastSeen: new Date(),
    };
  }

  /**
   * Get participant display name
   */
  static getDisplayName(participant: Participant): string {
    return participant.name || `Participant ${participant.id.slice(0, 8)}`;
  }

  /**
   * Check if participant has specific media permission
   */
  static hasPermission(participant: Participant, permission: keyof MediaPermissions): boolean {
    return participant.mediaPermissions[permission] as boolean;
  }

  /**
   * Get participant status
   */
  static getStatus(participant: Participant): {
    status: 'online' | 'away' | 'offline';
    connectionState: ConnectionStateType;
    isActive: boolean;
  } {
    const isActive = this.isActive(participant);
    const isConnected = this.isConnected(participant);
    
    let status: 'online' | 'away' | 'offline';
    if (isConnected && isActive) {
      status = 'online';
    } else if (isConnected && !isActive) {
      status = 'away';
    } else {
      status = 'offline';
    }

    return {
      status,
      connectionState: participant.connectionState,
      isActive,
    };
  }

  /**
   * Sanitize participant name
   */
  static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove invalid characters
      .substring(0, 50); // Limit length
  }

  /**
   * Generate WebRTC peer ID
   */
  static generatePeerId(): string {
    return `peer_${crypto.randomUUID().replace(/-/g, '')}`;
  }
}
