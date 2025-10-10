/**
 * Data Persistence End-to-End Tests
 * Tests data consistency and persistence across operations
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';

describe('Data Persistence E2E Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let roomService: RoomService;
  let chatService: ChatService;
  let testUserIds: string[] = [];
  let testRoomIds: string[] = [];
  let testParticipantIds: string[] = [];

  beforeAll(async () => {
    // Initialize services
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    
    authService = new AuthService(dbService);
    await authService.initialize();
    roomService = new RoomService(dbService);
    chatService = new ChatService(dbService);
  });

  afterAll(async () => {
    // Clean up all test data
    for (const participantId of testParticipantIds) {
      try {
        await dbService.query('DELETE FROM participants WHERE id = $1', [participantId]);
      } catch (error) {
        console.log('Error cleaning up participant:', error);
      }
    }
    
    for (const roomId of testRoomIds) {
      try {
        await dbService.query('DELETE FROM rooms WHERE id = $1', [roomId]);
      } catch (error) {
        console.log('Error cleaning up room:', error);
      }
    }
    
    for (const userId of testUserIds) {
      try {
        await dbService.query('DELETE FROM "user" WHERE id = $1', [userId]);
      } catch (error) {
        console.log('Error cleaning up user:', error);
      }
    }
    
    await dbService.close();
  });

  describe('User Data Persistence', () => {
    it('should persist user data correctly', async () => {
      const userData = {
        email: 'persistence-test@example.com',
        password: 'TestPassword123!',
        name: 'Persistence Test User'
      };

      const registerResult = await authService.register(userData);
      testUserIds.push(registerResult.user.id);

      // Verify user data in database
      const dbUser = await dbService.query(
        'SELECT * FROM "user" WHERE id = $1',
        [registerResult.user.id]
      );

      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe('persistence-test@example.com');
      expect(dbUser.rows[0].name).toBe('Persistence Test User');
      expect(dbUser.rows[0].is_active).toBe(true);
      expect(dbUser.rows[0].created_at).toBeDefined();
      expect(dbUser.rows[0].updated_at).toBeDefined();
    });

    it('should persist user login timestamps', async () => {
      const loginData = {
        email: 'persistence-test@example.com',
        password: 'TestPassword123!'
      };

      const loginResult = await authService.login(loginData);
      
      // Verify last_login is updated
      const dbUser = await dbService.query(
        'SELECT last_login FROM "user" WHERE id = $1',
        [loginResult.user.id]
      );

      expect(dbUser.rows[0].last_login).toBeDefined();
      expect(new Date(dbUser.rows[0].last_login)).toBeInstanceOf(Date);
    });

    it('should persist user profile updates', async () => {
      const updateData = {
        name: 'Updated Persistence User'
      };

      const updateResult = await authService.updateUser(testUserIds[0], updateData);
      
      // Verify updates in database
      const dbUser = await dbService.query(
        'SELECT name, updated_at FROM "user" WHERE id = $1',
        [testUserIds[0]]
      );

      expect(dbUser.rows[0].name).toBe('Updated Persistence User');
      expect(dbUser.rows[0].updated_at).toBeDefined();
    });
  });

  describe('Room Data Persistence', () => {
    it('should persist room data correctly', async () => {
      const roomData = {
        name: 'Persistence Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      const roomResult = await roomService.createRoom(roomData, testUserIds[0]);
      testRoomIds.push(roomResult.id);

      // Verify room data in database
      const dbRoom = await dbService.query(
        'SELECT * FROM rooms WHERE id = $1',
        [roomResult.id]
      );

      expect(dbRoom.rows).toHaveLength(1);
      expect(dbRoom.rows[0].name).toBe('Persistence Test Room');
      expect(dbRoom.rows[0].max_participants).toBe(10);
      expect(dbRoom.rows[0].settings).toEqual(roomData.settings);
      expect(dbRoom.rows[0].is_active).toBe(true);
      expect(dbRoom.rows[0].created_at).toBeDefined();
      expect(dbRoom.rows[0].updated_at).toBeDefined();
    });

    it('should persist room updates correctly', async () => {
      const updateData = {
        name: 'Updated Persistence Room',
        maxParticipants: 15,
        settings: {
          recordingEnabled: true,
          allowScreenShare: false
        }
      };

      const updateResult = await roomService.updateRoom(testRoomIds[0], updateData);
      
      // Verify updates in database
      const dbRoom = await dbService.query(
        'SELECT name, max_participants, settings, updated_at FROM rooms WHERE id = $1',
        [testRoomIds[0]]
      );

      expect(dbRoom.rows[0].name).toBe('Updated Persistence Room');
      expect(dbRoom.rows[0].max_participants).toBe(15);
      expect(dbRoom.rows[0].settings.recordingEnabled).toBe(true);
      expect(dbRoom.rows[0].settings.allowScreenShare).toBe(false);
      expect(dbRoom.rows[0].updated_at).toBeDefined();
    });

    it('should persist room deletion correctly', async () => {
      // Create a room to delete
      const roomData = {
        name: 'Room To Delete',
        maxParticipants: 5,
        settings: {}
      };

      const roomResult = await roomService.createRoom(roomData, testUserIds[0]);
      const roomToDeleteId = roomResult.id;

      // Delete the room
      await roomService.deleteRoom(roomToDeleteId);

      // Verify room is deleted
      const dbRoom = await dbService.query(
        'SELECT * FROM rooms WHERE id = $1',
        [roomToDeleteId]
      );

      expect(dbRoom.rows).toHaveLength(0);
    });
  });

  describe('Participant Data Persistence', () => {
    it('should persist participant data correctly', async () => {
      // Create participant record manually for testing
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        testRoomIds[0],
        'Persistence Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: true }),
        JSON.stringify({ userAgent: 'Persistence Test Browser', platform: 'test' })
      ]);
      
      const participantId = participantResult.rows[0].id;
      testParticipantIds.push(participantId);

      // Verify participant data in database
      const dbParticipant = await dbService.query(
        'SELECT * FROM participants WHERE id = $1',
        [participantId]
      );

      expect(dbParticipant.rows).toHaveLength(1);
      expect(dbParticipant.rows[0].room_id).toBe(testRoomIds[0]);
      expect(dbParticipant.rows[0].name).toBe('Persistence Test Participant');
      expect(dbParticipant.rows[0].is_connected).toBe(true);
      expect(dbParticipant.rows[0].joined_at).toBeDefined();
      expect(dbParticipant.rows[0].last_seen).toBeDefined();
    });

    it('should persist participant updates correctly', async () => {
      // Update participant record directly in database
      const updateQuery = `
        UPDATE participants 
        SET media_permissions = $1, last_seen = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const updateResult = await dbService.query(updateQuery, [
        JSON.stringify({ camera: false, microphone: true, screen_share: false }),
        testParticipantIds[0]
      ]);
      
      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].media_permissions).toEqual({ camera: false, microphone: true, screen_share: false });
    });

    it('should persist participant leave correctly', async () => {
      // Create another participant to leave
      const userData = {
        email: 'participant-leave@example.com',
        password: 'TestPassword123!',
        name: 'Participant Leave User'
      };

      const userResult = await authService.register(userData);
      testUserIds.push(userResult.user.id);

      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        testRoomIds[0],
        'Participant To Leave',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({})
      ]);
      
      const participantToLeaveId = participantResult.rows[0].id;

      // Leave the room (delete participant record)
      await dbService.query('DELETE FROM participants WHERE id = $1', [participantToLeaveId]);

      // Verify participant is removed
      const dbParticipant = await dbService.query(
        'SELECT * FROM participants WHERE id = $1',
        [participantToLeaveId]
      );

      expect(dbParticipant.rows).toHaveLength(0);
    });
  });

  describe('Message Data Persistence', () => {
    it('should persist message data correctly', async () => {
      const messageResult = await chatService.sendMessage(testRoomIds[0], testParticipantIds[0], 'Persistence test message');
      
      // Verify message data in database
      const dbMessage = await dbService.query(
        'SELECT * FROM messages WHERE id = $1',
        [messageResult.id]
      );

      expect(dbMessage.rows).toHaveLength(1);
      expect(dbMessage.rows[0].room_id).toBe(testRoomIds[0]);
      expect(dbMessage.rows[0].participant_id).toBe(testParticipantIds[0]);
      expect(dbMessage.rows[0].message).toBe('Persistence test message');
      expect(dbMessage.rows[0].message_type).toBe('text');
      expect(dbMessage.rows[0].is_edited).toBe(false);
      expect(dbMessage.rows[0].created_at).toBeDefined();
    });

    it('should persist message ordering correctly', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message'
      ];

      const messageIds: string[] = [];

      for (const messageText of messages) {
        const result = await chatService.sendMessage(testRoomIds[0], testParticipantIds[0], messageText);
        messageIds.push(result.id);
      }

      // Verify messages are ordered correctly in database
      const dbMessages = await dbService.query(
        'SELECT message, created_at FROM messages WHERE room_id = $1 ORDER BY created_at ASC',
        [testRoomIds[0]]
      );

      expect(dbMessages.rows.length).toBeGreaterThanOrEqual(4); // At least 4 messages (1 previous + 3 new)
      
      // Check that the last 3 messages are in correct order
      const lastThreeMessages = dbMessages.rows.slice(-3);
      expect(lastThreeMessages[0].message).toBe('First message');
      expect(lastThreeMessages[1].message).toBe('Second message');
      expect(lastThreeMessages[2].message).toBe('Third message');
    });

    it('should persist message pagination correctly', async () => {
      // Get messages with pagination
      const page1 = await chatService.getMessages(testRoomIds[0], 2, 0);
      const page2 = await chatService.getMessages(testRoomIds[0], 2, 2);

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);

      // Verify no overlap between pages
      const page1Ids = page1.map(m => m.id);
      const page2Ids = page2.map(m => m.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Create a room and participant
      const roomData = {
        name: 'Consistency Test Room',
        maxParticipants: 5,
        settings: {}
      };

      const roomResult = await roomService.createRoom(roomData);
      testRoomIds.push(roomResult.id);

      // Create participant record manually
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        roomResult.id,
        'Consistency Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({})
      ]);
      
      const participantId = participantResult.rows[0].id;
      testParticipantIds.push(participantId);

      // Verify foreign key relationships
      const roomParticipant = await dbService.query(
        'SELECT r.name as room_name, p.name as participant_name FROM rooms r JOIN participants p ON r.id = p.room_id WHERE p.id = $1',
        [participantId]
      );

      expect(roomParticipant.rows).toHaveLength(1);
      expect(roomParticipant.rows[0].room_name).toBe('Consistency Test Room');
      expect(roomParticipant.rows[0].participant_name).toBe('Consistency Test Participant');
    });

    it('should handle cascade deletes correctly', async () => {
      // Create a room with participants and messages
      const roomData = {
        name: 'Cascade Test Room',
        maxParticipants: 5,
        settings: {}
      };

      const roomResult = await roomService.createRoom(roomData);
      const cascadeRoomId = roomResult.id;

      // Create participant record manually
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        cascadeRoomId,
        'Cascade Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({})
      ]);
      
      const participantId = participantResult.rows[0].id;

      // Send a message
      await chatService.sendMessage(cascadeRoomId, participantId, 'Cascade test message');

      // Delete the room (should cascade delete participants and messages)
      await roomService.deleteRoom(cascadeRoomId);

      // Verify cascade deletes
      const participants = await dbService.query(
        'SELECT * FROM participants WHERE room_id = $1',
        [cascadeRoomId]
      );

      const messages = await dbService.query(
        'SELECT * FROM messages WHERE room_id = $1',
        [cascadeRoomId]
      );

      expect(participants.rows).toHaveLength(0);
      expect(messages.rows).toHaveLength(0);
    });
  });

  describe('Transaction Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // This test would require implementing transaction support
      // For now, we'll test that operations complete successfully
      const roomData = {
        name: 'Transaction Test Room',
        maxParticipants: 5,
        settings: {}
      };

      const roomResult = await roomService.createRoom(roomData);
      testRoomIds.push(roomResult.id);

      // Create participant record manually
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        roomResult.id,
        'Transaction Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({})
      ]);
      
      const participantId = participantResult.rows[0].id;
      testParticipantIds.push(participantId);

      // Verify all operations completed successfully
      const room = await roomService.getRoom(roomResult.id);
      const participants = await roomService.getRoomParticipants(roomResult.id);

      expect(room).toBeDefined();
      expect(participants).toHaveLength(1);
      expect(participants[0].name).toBe('Transaction Test Participant');
    });
  });
});
