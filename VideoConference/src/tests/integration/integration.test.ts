/**
 * Integration Tests
 * Comprehensive integration test scenarios for application functionality with real dependencies
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { db } from '../../lib/video-conferencing/services/database.service';
import { RoomModel, ParticipantModel, MessageModel } from '../../lib/video-conferencing/models';

describe('Integration Tests', () => {
  beforeAll(async () => {
    // Initialize database
    await db.initialize();
  });

  afterAll(async () => {
    // Close database connections
    await db.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.query('DELETE FROM webrtc_connections');
    await db.query('DELETE FROM media_state_changes');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM participants');
    await db.query('DELETE FROM room_sessions');
    await db.query('DELETE FROM rooms');
  });

  describe('Room Management Integration', () => {
    it('should create a room and retrieve it', async () => {
      // Create room
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: { allowScreenShare: true },
      };

      const createResult = await db.query(
        'INSERT INTO rooms (name, max_participants, settings) VALUES ($1, $2, $3) RETURNING *',
        [roomData.name, roomData.maxParticipants, JSON.stringify(roomData.settings)]
      );

      const room = RoomModel.fromEntity(createResult.rows[0] as any);
      expect(room.name).toBe(roomData.name);
      expect(room.maxParticipants).toBe(roomData.maxParticipants);

      // Retrieve room
      const getResult = await db.query('SELECT * FROM rooms WHERE id = $1', [room.id]);
      const retrievedRoom = RoomModel.fromEntity(getResult.rows[0] as any);
      expect(retrievedRoom.id).toBe(room.id);
      expect(retrievedRoom.name).toBe(room.name);
    });

    it('should update room settings', async () => {
      // Create room
      const createResult = await db.query(
        'INSERT INTO rooms (name, max_participants, settings) VALUES ($1, $2, $3) RETURNING *',
        ['Test Room', 10, '{}']
      );

      const room = RoomModel.fromEntity(createResult.rows[0] as any);
      const updatedSettings = { allowScreenShare: true, allowChat: false };
      const updatedRoom = RoomModel.updateSettings(room, updatedSettings);

      // Update in database
      await db.query(
        'UPDATE rooms SET settings = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedRoom.settings), room.id]
      );

      // Verify update
      const getResult = await db.query('SELECT * FROM rooms WHERE id = $1', [room.id]);
      const retrievedRoom = RoomModel.fromEntity(getResult.rows[0] as any);
      expect(retrievedRoom.settings.allowScreenShare).toBe(true);
      expect(retrievedRoom.settings.allowChat).toBe(false);
    });

    it('should check room capacity', async () => {
      // Create room with max 2 participants
      const createResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Small Room', 2]
      );

      const room = RoomModel.fromEntity(createResult.rows[0] as any);

      // Add 2 participants
      await db.query(
        'INSERT INTO participants (room_id, name, media_permissions) VALUES ($1, $2, $3)',
        [room.id, 'User 1', JSON.stringify({ camera: true, microphone: true, screen_share: false })]
      );
      await db.query(
        'INSERT INTO participants (room_id, name, media_permissions) VALUES ($1, $2, $3)',
        [room.id, 'User 2', JSON.stringify({ camera: true, microphone: true, screen_share: false })]
      );

      // Check capacity
      const participantCount = await db.query(
        'SELECT COUNT(*) as count FROM participants WHERE room_id = $1',
        [room.id]
      );

      const isFull = RoomModel.isFull(room, parseInt(participantCount.rows[0].count));
      expect(isFull).toBe(true);
    });
  });

  describe('Participant Management Integration', () => {
    let roomId: string;

    beforeEach(async () => {
      // Create a test room
      const createResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room', 10]
      );
      roomId = createResult.rows[0].id;
    });

    it('should add participant to room', async () => {
      const participantData = {
        roomId,
        name: 'Test User',
        mediaPermissions: {
          camera: true,
          microphone: true,
          screen_share: false,
        },
      };

      const createResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          participantData.roomId,
          participantData.name,
          JSON.stringify(participantData.mediaPermissions),
          false,
          'connecting'
        ]
      );

      const participant = ParticipantModel.fromEntity(createResult.rows[0]);
      expect(participant.name).toBe(participantData.name);
      expect(participant.roomId).toBe(roomId);
      expect(participant.mediaPermissions.camera).toBe(true);
    });

    it('should update participant connection state', async () => {
      // Create participant
      const createResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [roomId, 'Test User', JSON.stringify({ camera: true, microphone: true, screen_share: false }), false, 'connecting']
      );

      const participant = ParticipantModel.fromEntity(createResult.rows[0]);
      const updatedParticipant = ParticipantModel.updateConnectionState(
        participant,
        true,
        'connected'
      );

      // Update in database
      await db.query(
        'UPDATE participants SET is_connected = $1, connection_state = $2, last_seen = NOW() WHERE id = $3',
        [updatedParticipant.isConnected, updatedParticipant.connectionState, participant.id]
      );

      // Verify update
      const getResult = await db.query('SELECT * FROM participants WHERE id = $1', [participant.id]);
      const retrievedParticipant = ParticipantModel.fromEntity(getResult.rows[0]);
      expect(retrievedParticipant.isConnected).toBe(true);
      expect(retrievedParticipant.connectionState).toBe('connected');
    });

    it('should update participant media permissions', async () => {
      // Create participant
      const createResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [roomId, 'Test User', '{"camera": true, "microphone": true, "screen_share": false}', false, 'connecting']
      );

      const participant = ParticipantModel.fromEntity(createResult.rows[0]);
      const newPermissions = {
        camera: false,
        microphone: true,
        screen_share: true,
      };

      const { participant: updatedParticipant, changes } = ParticipantModel.updateMediaPermissions(
        participant,
        newPermissions
      );

      // Update in database
      await db.query(
        'UPDATE participants SET media_permissions = $1, last_seen = NOW() WHERE id = $2',
        [JSON.stringify(updatedParticipant.mediaPermissions), participant.id]
      );

      // Log media state changes
      for (const change of changes) {
        await db.query(
          'INSERT INTO media_state_changes (participant_id, permission_type, old_value, new_value) VALUES ($1, $2, $3, $4)',
          [change.participantId, change.permissionType, change.oldValue, change.newValue]
        );
      }

      // Verify update
      const getResult = await db.query('SELECT * FROM participants WHERE id = $1', [participant.id]);
      const retrievedParticipant = ParticipantModel.fromEntity(getResult.rows[0]);
      expect(retrievedParticipant.mediaPermissions.camera).toBe(false);
      expect(retrievedParticipant.mediaPermissions.screen_share).toBe(true);

      // Verify changes were logged
      const changesResult = await db.query(
        'SELECT * FROM media_state_changes WHERE participant_id = $1',
        [participant.id]
      );
      expect(changesResult.rows.length).toBe(2); // camera and screen_share changed
    });
  });

  describe('Message Management Integration', () => {
    let roomId: string;
    let participantId: string;

    beforeEach(async () => {
      // Create test room
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room', 10]
      );
      roomId = roomResult.rows[0].id;

      // Create test participant
      const participantResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [roomId, 'Test User', JSON.stringify({ camera: true, microphone: true, screen_share: false }), true, 'connected']
      );
      participantId = participantResult.rows[0].id;
    });

    it('should create and retrieve messages', async () => {
      const messageData = {
        roomId,
        participantId,
        participantName: 'Test User',
        message: 'Hello, world!',
        messageType: 'text',
      };

      const createResult = await db.query(
        'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [messageData.roomId, messageData.participantId, messageData.participantName, messageData.message, messageData.messageType]
      );

      const message = MessageModel.fromEntity(createResult.rows[0]);
      expect(message.message).toBe(messageData.message);
      expect(message.messageType).toBe('text');

      // Retrieve messages for room
      const getResult = await db.query(
        'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at DESC',
        [roomId]
      );

      const messages = getResult.rows.map(row => MessageModel.fromEntity(row));
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Hello, world!');
    });

    it('should edit message within time limit', async () => {
      // Create message
      const createResult = await db.query(
        'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [roomId, participantId, 'Test User', 'Original message', 'text']
      );

      const message = MessageModel.fromEntity(createResult.rows[0]);
      const canEdit = MessageModel.canEdit(message, 5); // 5 minute limit
      expect(canEdit.canEdit).toBe(true);

      // Edit message
      const editedMessage = MessageModel.editMessage(message, 'Edited message');

      // Update in database
      await db.query(
        'UPDATE messages SET message = $1, is_edited = $2, edited_at = NOW() WHERE id = $3',
        [editedMessage.message, editedMessage.isEdited, message.id]
      );

      // Verify edit
      const getResult = await db.query('SELECT * FROM messages WHERE id = $1', [message.id]);
      const retrievedMessage = MessageModel.fromEntity(getResult.rows[0]);
      expect(retrievedMessage.message).toBe('Edited message');
      expect(retrievedMessage.isEdited).toBe(true);
    });

    it('should create system messages', async () => {
      const systemMessage = MessageModel.createSystemMessage(
        roomId,
        'User joined the room',
        participantId,
        'Test User'
      );

      const createResult = await db.query(
        'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [systemMessage.roomId, systemMessage.participantId, systemMessage.participantName, systemMessage.message, systemMessage.messageType]
      );

      const message = MessageModel.fromEntity(createResult.rows[0]);
      expect(message.messageType).toBe('system');
      expect(message.message).toBe('User joined the room');
    });
  });

  describe('Database Transactions Integration', () => {
    it('should handle room creation with participant in transaction', async () => {
      await db.transaction(async (client) => {
        // Create room
        const roomResult = await client.query(
          'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
          ['Transaction Room', 10]
        );
        const roomId = roomResult.rows[0].id;

        // Create participant
        const participantResult = await client.query(
          'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [roomId, 'Transaction User', JSON.stringify({ camera: true, microphone: true, screen_share: false }), true, 'connected']
        );

        expect(roomId).toBeDefined();
        expect(participantResult.rows[0].room_id).toBe(roomId);
      });
    });

    it('should rollback transaction on error', async () => {
      let errorThrown = false;

      try {
        await db.transaction(async (client) => {
          // Create room
          await client.query(
            'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
            ['Rollback Room', 10]
          );

          // Intentionally cause error
          throw new Error('Test rollback');
        });
      } catch (error) {
        errorThrown = true;
        expect(error instanceof Error ? error.message : String(error)).toBe('Test rollback');
      }

      expect(errorThrown).toBe(true);

      // Verify room was not created
      const result = await db.query("SELECT * FROM rooms WHERE name = 'Rollback Room'");
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Cache Integration', () => {
    it('should cache and retrieve data', async () => {
      const testData = { message: 'Hello, cache!', timestamp: new Date().toISOString() };
      const cacheKey = 'test:cache:key';

      // Set cache
      await db.cacheSet(cacheKey, testData, 60); // 60 seconds TTL

      // Get cache
      const cachedData = await db.cacheGet(cacheKey);
      expect(cachedData).toEqual(testData);

      // Delete cache
      await db.cacheDelete(cacheKey);

      // Verify deletion
      const deletedData = await db.cacheGet(cacheKey);
      expect(deletedData).toBeNull();
    });
  });

  describe('Database Health Check Integration', () => {
    it('should perform health check', async () => {
      const health = await db.healthCheck();
      expect(health).toHaveProperty('database');
      expect(health).toHaveProperty('redis');
      expect(typeof health.database).toBe('boolean');
      expect(typeof health.redis).toBe('boolean');
    });

    it('should get connection pool statistics', async () => {
      const stats = db.getPoolStats();
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('idleCount');
      expect(stats).toHaveProperty('waitingCount');
      expect(stats).toHaveProperty('isConnected');
      expect(typeof stats.totalCount).toBe('number');
      expect(typeof stats.isConnected).toBe('boolean');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate room data with invalid input', async () => {
      const invalidRoomData = {
        name: '', // Invalid: empty name
        maxParticipants: -1, // Invalid: negative number
      };

      const validation = RoomModel.validateCreate(invalidRoomData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors?.length).toBeGreaterThan(0);
    });

    it('should validate participant data with invalid input', async () => {
      const invalidParticipantData = {
        roomId: 'invalid-uuid',
        name: '', // Invalid: empty name
        mediaPermissions: {
          camera: 'invalid', // Invalid: not boolean
          microphone: true,
          screen_share: false,
        },
      };

      const validation = ParticipantModel.validateCreate(invalidParticipantData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors?.length).toBeGreaterThan(0);
    });

    it('should validate message data with invalid input', async () => {
      const invalidMessageData = {
        roomId: 'invalid-uuid',
        participantId: 'invalid-uuid',
        participantName: '',
        message: 'a'.repeat(1001), // Invalid: too long
      };

      const validation = MessageModel.validateCreate(invalidMessageData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors?.length).toBeGreaterThan(0);
    });
  });
});
