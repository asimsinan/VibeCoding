/**
 * Message Model
 * Represents chat messages in a video conference room
 */

import { z } from 'zod';

// Message type enum
export const MessageType = z.enum(['text', 'system', 'notification']);

// Base message schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  participantId: z.string().uuid(),
  participantName: z.string().min(1).max(50),
  message: z.string().min(1).max(1000),
  messageType: MessageType.default('text'),
  createdAt: z.date(),
  isEdited: z.boolean().default(false),
  editedAt: z.date().optional(),
});

// Message creation schema
export const CreateMessageSchema = z.object({
  roomId: z.string().uuid(),
  participantId: z.string().uuid(),
  participantName: z.string().min(1).max(50),
  message: z.string().min(1).max(1000),
  messageType: MessageType.default('text'),
});

// Message update schema
export const UpdateMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

// Message with participant info schema
export const MessageWithParticipantSchema = MessageSchema.extend({
  participantIsConnected: z.boolean(),
  participantConnectionState: z.enum(['connecting', 'connected', 'disconnected', 'reconnecting']),
});

// Message summary schema (for listing)
export const MessageSummarySchema = z.object({
  id: z.string().uuid(),
  participantName: z.string(),
  message: z.string(),
  messageType: MessageType,
  createdAt: z.date(),
  isEdited: z.boolean(),
  editedAt: z.date().optional(),
});

// Message analytics schema
export const MessageAnalyticsSchema = z.object({
  roomId: z.string().uuid(),
  totalMessages: z.number().int().min(0),
  messagesByType: z.record(z.number().int().min(0)),
  messagesByParticipant: z.record(z.number().int().min(0)),
  averageMessageLength: z.number().min(0),
  firstMessageAt: z.date().optional(),
  lastMessageAt: z.date().optional(),
});

// Type definitions
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;
export type MessageWithParticipant = z.infer<typeof MessageWithParticipantSchema>;
export type MessageSummary = z.infer<typeof MessageSummarySchema>;
export type MessageAnalytics = z.infer<typeof MessageAnalyticsSchema>;
export type MessageTypeType = z.infer<typeof MessageType>;

// Database entity type (matches database schema)
export interface MessageEntity {
  id: string;
  room_id: string;
  participant_id: string;
  participant_name: string;
  message: string;
  message_type: string;
  created_at: Date;
  is_edited: boolean;
  edited_at?: Date;
}

// Message service class
export class MessageModel {
  /**
   * Convert database entity to model
   */
  static fromEntity(entity: MessageEntity): Message {
    return {
      id: entity.id,
      roomId: entity.room_id,
      participantId: entity.participant_id,
      participantName: entity.participant_name,
      message: entity.message,
      messageType: entity.message_type as MessageTypeType,
      createdAt: entity.created_at,
      isEdited: entity.is_edited,
      editedAt: entity.edited_at,
    };
  }

  /**
   * Convert model to database entity
   */
  static toEntity(message: CreateMessage): Omit<MessageEntity, 'id' | 'created_at' | 'is_edited' | 'edited_at'> {
    return {
      room_id: message.roomId,
      participant_id: message.participantId,
      participant_name: message.participantName,
      message: message.message,
      message_type: message.messageType,
    };
  }

  /**
   * Validate message data
   */
  static validate(data: unknown): { isValid: boolean; data?: Message; errors?: string[] } {
    try {
      const message = MessageSchema.parse(data);
      return { isValid: true, data: message };
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
   * Validate message creation data
   */
  static validateCreate(data: unknown): { isValid: boolean; data?: CreateMessage; errors?: string[] } {
    try {
      const message = CreateMessageSchema.parse(data);
      return { isValid: true, data: message };
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
   * Validate message update data
   */
  static validateUpdate(data: unknown): { isValid: boolean; data?: UpdateMessage; errors?: string[] } {
    try {
      const message = UpdateMessageSchema.parse(data);
      return { isValid: true, data: message };
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
   * Sanitize message content
   */
  static sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \t and \n
      .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs to single space
      .replace(/\n\s+/g, '\n') // Remove leading spaces after newlines
      .substring(0, 1000); // Limit length
  }

  /**
   * Check if message is recent
   */
  static isRecent(message: Message, maxAgeMinutes: number = 60): boolean {
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    return diffMinutes <= maxAgeMinutes;
  }

  /**
   * Check if message can be edited
   */
  static canEdit(message: Message, maxEditAgeMinutes: number = 5): { canEdit: boolean; reason?: string } {
    if (message.messageType !== 'text') {
      return { canEdit: false, reason: 'Only text messages can be edited' };
    }

    if (message.isEdited) {
      return { canEdit: false, reason: 'Message has already been edited' };
    }

    if (!this.isRecent(message, maxEditAgeMinutes)) {
      return { canEdit: false, reason: 'Message is too old to edit' };
    }

    return { canEdit: true };
  }

  /**
   * Edit message
   */
  static editMessage(message: Message, newContent: string): Message {
    const sanitizedContent = this.sanitizeMessage(newContent);
    
    return {
      ...message,
      message: sanitizedContent,
      isEdited: true,
      editedAt: new Date(),
    };
  }

  /**
   * Get message display text
   */
  static getDisplayText(message: Message): string {
    if (message.isEdited) {
      return `${message.message} (edited)`;
    }
    return message.message;
  }

  /**
   * Get message age in minutes
   */
  static getAgeMinutes(message: Message): number {
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    return Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
  }

  /**
   * Check if message is from system
   */
  static isSystemMessage(message: Message): boolean {
    return message.messageType === 'system';
  }

  /**
   * Check if message is a notification
   */
  static isNotification(message: Message): boolean {
    return message.messageType === 'notification';
  }

  /**
   * Create system message
   */
  static createSystemMessage(
    roomId: string,
    content: string,
    participantId?: string,
    participantName?: string
  ): CreateMessage {
    return {
      roomId,
      participantId: participantId || 'system',
      participantName: participantName || 'System',
      message: content,
      messageType: 'system',
    };
  }

  /**
   * Create notification message
   */
  static createNotificationMessage(
    roomId: string,
    content: string,
    participantId?: string,
    participantName?: string
  ): CreateMessage {
    return {
      roomId,
      participantId: participantId || 'system',
      participantName: participantName || 'System',
      message: content,
      messageType: 'notification',
    };
  }

  /**
   * Format message for display
   */
  static formatForDisplay(message: Message): {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    isEdited: boolean;
    type: MessageTypeType;
  } {
    return {
      id: message.id,
      author: message.participantName,
      content: this.getDisplayText(message),
      timestamp: message.createdAt.toISOString(),
      isEdited: message.isEdited,
      type: message.messageType,
    };
  }

  /**
   * Get message statistics
   */
  static getStatistics(messages: Message[]): {
    total: number;
    byType: Record<MessageTypeType, number>;
    averageLength: number;
    oldestMessage?: Date;
    newestMessage?: Date;
  } {
    const byType: Record<MessageTypeType, number> = {
      text: 0,
      system: 0,
      notification: 0,
    };

    let totalLength = 0;
    let oldestDate: Date | undefined;
    let newestDate: Date | undefined;

    messages.forEach(message => {
      byType[message.messageType]++;
      totalLength += message.message.length;

      const messageDate = new Date(message.createdAt);
      if (!oldestDate || messageDate < oldestDate) {
        oldestDate = messageDate;
      }
      if (!newestDate || messageDate > newestDate) {
        newestDate = messageDate;
      }
    });

    return {
      total: messages.length,
      byType,
      averageLength: messages.length > 0 ? totalLength / messages.length : 0,
      ...(oldestDate && { oldestMessage: oldestDate }),
      ...(newestDate && { newestMessage: newestDate }),
    };
  }
}
