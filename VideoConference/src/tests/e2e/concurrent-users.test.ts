/**
 * Concurrent Users End-to-End Tests
 * Tests the system behavior with multiple users and concurrent operations
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';

describe('Concurrent Users E2E Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let roomService: RoomService;
  let chatService: ChatService;
  let testUserIds: string[] = [];
  let testRoomId: string;
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
    // Clean up test data
    for (const participantId of testParticipantIds) {
      try {
        await dbService.query('DELETE FROM participants WHERE id = $1', [participantId]);
      } catch (error) {
        console.log('Error cleaning up participant:', error);
      }
    }
    
    if (testRoomId) {
      try {
        await dbService.query('DELETE FROM rooms WHERE id = $1', [testRoomId]);
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

  describe('Concurrent User Registration', () => {
    it('should register multiple users concurrently', async () => {
      const userPromises = [];
      
      // Create 5 users concurrently
      for (let i = 0; i < 5; i++) {
        const userData = {
          email: `concurrent-user-${i}@example.com`,
          password: 'TestPassword123!',
          name: `Concurrent User ${i}`
        };
        
        userPromises.push(authService.register(userData));
      }

      const results = await Promise.all(userPromises);
      
      expect(results).toHaveLength(5);
      
      for (let i = 0; i < results.length; i++) {
        expect(results[i]).toBeDefined();
        expect(results[i].user.email).toBe(`concurrent-user-${i}@example.com`);
        expect(results[i].user.name).toBe(`Concurrent User ${i}`);
        expect(results[i].tokens).toBeDefined();
        
        testUserIds.push(results[i].user.id);
      }
    });
  });

  describe('Concurrent Room Operations', () => {
    it('should create a room successfully', async () => {
      // Create a room
      const roomData = {
        name: 'Concurrent Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      const roomResult = await roomService.createRoom(roomData);
      testRoomId = roomResult.id;

      expect(roomResult).toBeDefined();
      expect(roomResult.name).toBe('Concurrent Test Room');
      expect(roomResult.maxParticipants).toBe(10);
    });

    it('should get room participants', async () => {
      const participants = await roomService.getRoomParticipants(testRoomId);
      
      expect(participants).toBeDefined();
      expect(Array.isArray(participants)).toBe(true);
    });
  });

  describe('Concurrent Message Operations', () => {
    it('should send messages concurrently', async () => {
      // First create a participant record manually for testing
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        testRoomId,
        'Concurrent Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({ userAgent: 'Concurrent Test Browser' })
      ]);
      
      const participantId = participantResult.rows[0].id;
      testParticipantIds.push(participantId);

      const messagePromises = [];
      
      // Send 5 messages concurrently
      for (let i = 0; i < 5; i++) {
        messagePromises.push(chatService.sendMessage(testRoomId, participantId, `Concurrent message ${i}`));
      }

      const results = await Promise.all(messagePromises);
      
      expect(results).toHaveLength(5);
      
      // Verify all messages were created
      for (const result of results) {
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.participant_id).toBeDefined();
      }
    });

    it('should retrieve messages correctly after concurrent sends', async () => {
      const messages = await chatService.getMessages(testRoomId, 20, 0);
      
      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThanOrEqual(5);
      
      // Verify message content
      const messageTexts = messages.map(m => m.message);
      for (let i = 0; i < 5; i++) {
        const expectedMessage = `Concurrent message ${i}`;
        expect(messageTexts).toContain(expectedMessage);
      }
    });
  });

  describe('Concurrent Room Updates', () => {
    it('should handle concurrent room updates gracefully', async () => {
      const updatePromises = [
        roomService.updateRoom(testRoomId, { name: 'Updated Room Name 1' }),
        roomService.updateRoom(testRoomId, { maxParticipants: 15 }),
        roomService.updateRoom(testRoomId, { 
          settings: { 
            recordingEnabled: true,
            allowScreenShare: false 
          } 
        })
      ];

      const results = await Promise.all(updatePromises);
      
      expect(results).toHaveLength(3);
      
      // All updates should succeed
      for (const result of results) {
        expect(result).toBeDefined();
        expect(result.id).toBe(testRoomId);
      }
    });
  });

  describe('Database Performance Under Load', () => {
    it('should maintain database performance during concurrent operations', async () => {
      const startTime = Date.now();
      
      // Perform multiple concurrent operations
      const operations = [
        roomService.getRoomParticipants(testRoomId),
        chatService.getMessages(testRoomId, 10, 0),
        roomService.getRoom(testRoomId),
        dbService.healthCheck()
      ];

      const results = await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(4);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all operations succeeded
      for (const result of results) {
        expect(result).toBeDefined();
      }
    });
  });
});
