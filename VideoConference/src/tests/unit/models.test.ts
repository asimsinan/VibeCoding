/**
 * Model Unit Tests
 * Comprehensive unit tests for all data models with proper test coverage
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RoomModel, ParticipantModel, MessageModel } from '../../lib/video-conferencing/models';

describe('Model Unit Tests', () => {
  describe('RoomModel', () => {
    describe('validation', () => {
      it('should validate valid room data', () => {
        const validRoom = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Room',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          maxParticipants: 10,
          settings: { allowScreenShare: true },
        };

        const validation = RoomModel.validate(validRoom);
        expect(validation.isValid).toBe(true);
        expect(validation.data).toEqual(validRoom);
      });

      it('should reject room with invalid UUID', () => {
        const invalidRoom = {
          id: 'invalid-uuid',
          name: 'Test Room',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          maxParticipants: 10,
          settings: {},
        };

        const validation = RoomModel.validate(invalidRoom);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });

      it('should reject room with invalid name length', () => {
        const invalidRoom = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'a'.repeat(101), // Too long
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          maxParticipants: 10,
          settings: {},
        };

        const validation = RoomModel.validate(invalidRoom);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });

      it('should reject room with invalid max participants', () => {
        const invalidRoom = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Room',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          maxParticipants: 1001, // Too many
          settings: {},
        };

        const validation = RoomModel.validate(invalidRoom);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });
    });

    describe('create validation', () => {
      it('should validate valid create room data', () => {
        const validCreateRoom = {
          name: 'Test Room',
          maxParticipants: 10,
          settings: { allowScreenShare: true },
        };

        const validation = RoomModel.validateCreate(validCreateRoom);
        expect(validation.isValid).toBe(true);
        expect(validation.data).toEqual(validCreateRoom);
      });

      it('should use default values for optional fields', () => {
        const minimalCreateRoom = {
          name: 'Test Room',
        };

        const validation = RoomModel.validateCreate(minimalCreateRoom);
        expect(validation.isValid).toBe(true);
        expect(validation.data?.maxParticipants).toBe(50);
        expect(validation.data?.settings).toEqual({});
      });
    });

    describe('business logic', () => {
      let room: any;

      beforeEach(() => {
        room = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Room',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          maxParticipants: 2,
          settings: {},
        };
      });

      it('should check if room is full', () => {
        expect(RoomModel.isFull(room, 1)).toBe(false);
        expect(RoomModel.isFull(room, 2)).toBe(true);
        expect(RoomModel.isFull(room, 3)).toBe(true);
      });

      it('should check if room is active', () => {
        expect(RoomModel.isActive(room)).toBe(true);
        
        const inactiveRoom = { ...room, isActive: false };
        expect(RoomModel.isActive(inactiveRoom)).toBe(false);
      });

      it('should get room display name', () => {
        expect(RoomModel.getDisplayName(room)).toBe('Test Room');
        
        const unnamedRoom = { ...room, name: undefined };
        expect(RoomModel.getDisplayName(unnamedRoom)).toBe('Room 550e8400');
      });

      it('should check if room can be joined', () => {
        const canJoin = RoomModel.canJoin(room, 1);
        expect(canJoin.canJoin).toBe(true);
        expect(canJoin.reason).toBeUndefined();

        const cannotJoinFull = RoomModel.canJoin(room, 2);
        expect(cannotJoinFull.canJoin).toBe(false);
        expect(cannotJoinFull.reason).toBe('Room is full');

        const inactiveRoom = { ...room, isActive: false };
        const cannotJoinInactive = RoomModel.canJoin(inactiveRoom, 1);
        expect(cannotJoinInactive.canJoin).toBe(false);
        expect(cannotJoinInactive.reason).toBe('Room is not active');
      });

      it('should get room settings with defaults', () => {
        const settings = RoomModel.getSettings(room);
        expect(settings.allowScreenShare).toBe(true);
        expect(settings.allowChat).toBe(true);
        expect(settings.requireApproval).toBe(false);
        expect(settings.recordingEnabled).toBe(false);
        expect(settings.maxDuration).toBe(0);
      });

      it('should update room settings', () => {
        const newSettings = { allowScreenShare: false, allowChat: false };
        const updatedRoom = RoomModel.updateSettings(room, newSettings);
        
        expect(updatedRoom.settings.allowScreenShare).toBe(false);
        expect(updatedRoom.settings.allowChat).toBe(false);
        expect(updatedRoom.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('ParticipantModel', () => {
    describe('validation', () => {
      it('should validate valid participant data', () => {
        const validParticipant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test User',
          isConnected: true,
          connectionState: 'connected' as const,
          mediaPermissions: {
            camera: true,
            microphone: true,
            screenShare: false,
          },
          joinedAt: new Date(),
          lastSeen: new Date(),
          webrtcPeerId: 'peer-123',
          clientInfo: { browser: 'Chrome' },
        };

        const validation = ParticipantModel.validate(validParticipant);
        expect(validation.isValid).toBe(true);
        expect(validation.data).toEqual(validParticipant);
      });

      it('should reject participant with invalid name format', () => {
        const invalidParticipant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test@User!', // Invalid characters
          isConnected: true,
          connectionState: 'connected' as const,
          mediaPermissions: {
            camera: true,
            microphone: true,
            screenShare: false,
          },
          joinedAt: new Date(),
          lastSeen: new Date(),
        };

        const validation = ParticipantModel.validate(invalidParticipant);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });

      it('should reject participant with invalid media permissions', () => {
        const invalidParticipant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test User',
          isConnected: true,
          connectionState: 'connected' as const,
          mediaPermissions: {
            camera: 'invalid', // Should be boolean
            microphone: true,
            screenShare: false,
          },
          joinedAt: new Date(),
          lastSeen: new Date(),
        };

        const validation = ParticipantModel.validate(invalidParticipant);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });
    });

    describe('business logic', () => {
      let participant: any;

      beforeEach(() => {
        participant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test User',
          isConnected: true,
          connectionState: 'connected' as const,
          mediaPermissions: {
            camera: true,
            microphone: true,
            screenShare: false,
          },
          joinedAt: new Date(),
          lastSeen: new Date(),
        };
      });

      it('should check if participant is connected', () => {
        expect(ParticipantModel.isConnected(participant)).toBe(true);
        
        const disconnectedParticipant = { ...participant, isConnected: false };
        expect(ParticipantModel.isConnected(disconnectedParticipant)).toBe(false);
      });

      it('should check if participant is active', () => {
        expect(ParticipantModel.isActive(participant)).toBe(true);
        
        const oldParticipant = {
          ...participant,
          lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        };
        expect(ParticipantModel.isActive(oldParticipant, 5)).toBe(false);
      });

      it('should calculate session duration', () => {
        const now = new Date();
        const joinedAt = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
        const participantWithTime = { ...participant, joinedAt };
        
        const duration = ParticipantModel.getSessionDuration(participantWithTime);
        expect(duration).toBe(300); // 5 minutes in seconds
      });

      it('should update connection state', () => {
        const updatedParticipant = ParticipantModel.updateConnectionState(
          participant,
          false,
          'disconnected'
        );
        
        expect(updatedParticipant.isConnected).toBe(false);
        expect(updatedParticipant.connectionState).toBe('disconnected');
        expect(updatedParticipant.lastSeen).toBeInstanceOf(Date);
      });

      it('should update media permissions and track changes', () => {
        const newPermissions = {
          camera: false,
          microphone: true,
          screenShare: true,
        };
        
        const { participant: updatedParticipant, changes } = ParticipantModel.updateMediaPermissions(
          participant,
          newPermissions
        );
        
        expect(updatedParticipant.mediaPermissions.camera).toBe(false);
        expect(updatedParticipant.mediaPermissions.screenShare).toBe(true);
        expect(changes).toHaveLength(2); // camera and screen_share changed
        expect(changes[0].permissionType).toBe('camera');
        expect(changes[0].oldValue).toBe(true);
        expect(changes[0].newValue).toBe(false);
      });

      it('should get participant display name', () => {
        expect(ParticipantModel.getDisplayName(participant)).toBe('Test User');
        
        const unnamedParticipant = { ...participant, name: '' };
        expect(ParticipantModel.getDisplayName(unnamedParticipant)).toBe('Participant 550e8400');
      });

      it('should check media permissions', () => {
        expect(ParticipantModel.hasPermission(participant, 'camera')).toBe(true);
        expect(ParticipantModel.hasPermission(participant, 'screenShare')).toBe(false);
      });

      it('should get participant status', () => {
        const status = ParticipantModel.getStatus(participant);
        expect(status.status).toBe('online');
        expect(status.connectionState).toBe('connected');
        expect(status.isActive).toBe(true);
      });

      it('should sanitize participant name', () => {
        const dirtyName = '  Test@User!  ';
        const cleanName = ParticipantModel.sanitizeName(dirtyName);
        expect(cleanName).toBe('TestUser');
      });

      it('should generate WebRTC peer ID', () => {
        const peerId = ParticipantModel.generatePeerId();
        expect(peerId).toMatch(/^peer_[a-f0-9]{32}$/);
      });
    });
  });

  describe('MessageModel', () => {
    describe('validation', () => {
      it('should validate valid message data', () => {
        const validMessage = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Test User',
          message: 'Hello, world!',
          messageType: 'text' as const,
          createdAt: new Date(),
          isEdited: false,
        };

        const validation = MessageModel.validate(validMessage);
        expect(validation.isValid).toBe(true);
        expect(validation.data).toEqual(validMessage);
      });

      it('should reject message with invalid content length', () => {
        const invalidMessage = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Test User',
          message: 'a'.repeat(1001), // Too long
          messageType: 'text' as const,
          createdAt: new Date(),
          isEdited: false,
        };

        const validation = MessageModel.validate(invalidMessage);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });

      it('should reject message with empty content', () => {
        const invalidMessage = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Test User',
          message: '', // Empty
          messageType: 'text' as const,
          createdAt: new Date(),
          isEdited: false,
        };

        const validation = MessageModel.validate(invalidMessage);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toBeDefined();
      });
    });

    describe('business logic', () => {
      let message: any;

      beforeEach(() => {
        message = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          roomId: '550e8400-e29b-41d4-a716-446655440001',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Test User',
          message: 'Hello, world!',
          messageType: 'text' as const,
          createdAt: new Date(),
          isEdited: false,
        };
      });

      it('should sanitize message content', () => {
        const dirtyMessage = '  Hello,\n\tworld!  ';
        const cleanMessage = MessageModel.sanitizeMessage(dirtyMessage);
        expect(cleanMessage).toBe('Hello,\nworld!');
      });

      it('should check if message is recent', () => {
        expect(MessageModel.isRecent(message)).toBe(true);
        
        const oldMessage = {
          ...message,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        };
        expect(MessageModel.isRecent(oldMessage, 60)).toBe(false);
      });

      it('should check if message can be edited', () => {
        const canEdit = MessageModel.canEdit(message);
        expect(canEdit.canEdit).toBe(true);
        expect(canEdit.reason).toBeUndefined();
      });

      it('should reject editing non-text messages', () => {
        const systemMessage = { ...message, messageType: 'system' };
        const canEdit = MessageModel.canEdit(systemMessage);
        expect(canEdit.canEdit).toBe(false);
        expect(canEdit.reason).toBe('Only text messages can be edited');
      });

      it('should reject editing already edited messages', () => {
        const editedMessage = { ...message, isEdited: true };
        const canEdit = MessageModel.canEdit(editedMessage);
        expect(canEdit.canEdit).toBe(false);
        expect(canEdit.reason).toBe('Message has already been edited');
      });

      it('should edit message', () => {
        const editedMessage = MessageModel.editMessage(message, 'Edited content');
        expect(editedMessage.message).toBe('Edited content');
        expect(editedMessage.isEdited).toBe(true);
        expect(editedMessage.editedAt).toBeInstanceOf(Date);
      });

      it('should get message display text', () => {
        expect(MessageModel.getDisplayText(message)).toBe('Hello, world!');
        
        const editedMessage = { ...message, isEdited: true };
        expect(MessageModel.getDisplayText(editedMessage)).toBe('Hello, world! (edited)');
      });

      it('should calculate message age', () => {
        const now = new Date();
        const messageTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
        const messageWithTime = { ...message, createdAt: messageTime };
        
        const age = MessageModel.getAgeMinutes(messageWithTime);
        expect(age).toBe(5);
      });

      it('should check message types', () => {
        expect(MessageModel.isSystemMessage(message)).toBe(false);
        expect(MessageModel.isNotification(message)).toBe(false);
        
        const systemMessage = { ...message, messageType: 'system' };
        expect(MessageModel.isSystemMessage(systemMessage)).toBe(true);
        
        const notificationMessage = { ...message, messageType: 'notification' };
        expect(MessageModel.isNotification(notificationMessage)).toBe(true);
      });

      it('should create system messages', () => {
        const systemMessage = MessageModel.createSystemMessage(
          'room-id',
          'User joined',
          'participant-id',
          'User Name'
        );
        
        expect(systemMessage.roomId).toBe('room-id');
        expect(systemMessage.participantId).toBe('participant-id');
        expect(systemMessage.participantName).toBe('User Name');
        expect(systemMessage.message).toBe('User joined');
        expect(systemMessage.messageType).toBe('system');
      });

      it('should create notification messages', () => {
        const notificationMessage = MessageModel.createNotificationMessage(
          'room-id',
          'Recording started',
          'participant-id',
          'User Name'
        );
        
        expect(notificationMessage.roomId).toBe('room-id');
        expect(notificationMessage.participantId).toBe('participant-id');
        expect(notificationMessage.participantName).toBe('User Name');
        expect(notificationMessage.message).toBe('Recording started');
        expect(notificationMessage.messageType).toBe('notification');
      });

      it('should format message for display', () => {
        const formatted = MessageModel.formatForDisplay(message);
        expect(formatted.id).toBe(message.id);
        expect(formatted.author).toBe(message.participantName);
        expect(formatted.content).toBe(message.message);
        expect(formatted.timestamp).toBe(message.createdAt.toISOString());
        expect(formatted.isEdited).toBe(false);
        expect(formatted.type).toBe(message.messageType);
      });

      it('should calculate message statistics', () => {
        const messages = [
          { ...message, messageType: 'text' },
          { ...message, messageType: 'system' },
          { ...message, messageType: 'text' },
        ];
        
        const stats = MessageModel.getStatistics(messages);
        expect(stats.total).toBe(3);
        expect(stats.byType.text).toBe(2);
        expect(stats.byType.system).toBe(1);
        expect(stats.byType.notification).toBe(0);
        expect(stats.averageLength).toBeGreaterThan(0);
      });
    });
  });
});
