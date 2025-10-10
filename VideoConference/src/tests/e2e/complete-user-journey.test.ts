/**
 * Complete User Journey End-to-End Tests
 * Tests the full user flow from registration to video conference participation
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';
import { ServiceFactory } from '../../lib/video-conferencing/services/service.factory';

describe('Complete User Journey E2E Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let roomService: RoomService;
  let chatService: ChatService;
  let testUserId: string;
  let testRoomId: string;
  let testParticipantId: string;

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
    if (testParticipantId) {
      try {
        await dbService.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
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
    
    if (testUserId) {
      try {
        await dbService.query('DELETE FROM "user" WHERE id = $1', [testUserId]);
      } catch (error) {
        console.log('Error cleaning up user:', error);
      }
    }
    
    await dbService.close();
  });

  describe('User Registration and Authentication', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'e2e-test@example.com',
        password: 'TestPassword123!',
        name: 'E2E Test User'
      };

      const result = await authService.register(userData);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('e2e-test@example.com');
      expect(result.user.name).toBe('E2E Test User');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      
      testUserId = result.user.id;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'e2e-test@example.com',
        password: 'TestPassword123!'
      };

      const result = await authService.login(loginData);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('e2e-test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should verify access token', async () => {
      const loginData = {
        email: 'e2e-test@example.com',
        password: 'TestPassword123!'
      };

      const loginResult = await authService.login(loginData);
      const verificationResult = await authService.verifyAccessToken(loginResult.tokens.accessToken);
      
      expect(verificationResult).toBeDefined();
      expect(verificationResult.userId).toBeDefined();
    });
  });

  describe('Room Creation and Management', () => {
    it('should create a room successfully', async () => {
      const roomData = {
        name: 'E2E Test Room',
        maxParticipants: 5,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      };

      const result = await roomService.createRoom(roomData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('E2E Test Room');
      expect(result.maxParticipants).toBe(5);
      expect(result.settings).toBeDefined();
      expect(result.isActive).toBe(true);
      
      testRoomId = result.id;
    });

    it('should get room by ID', async () => {
      const room = await roomService.getRoom(testRoomId);
      
      expect(room).toBeDefined();
      expect(room?.id).toBe(testRoomId);
      expect(room?.name).toBe('E2E Test Room');
    });

    it('should update room settings', async () => {
      const updateData = {
        name: 'Updated E2E Test Room',
        settings: {
          recordingEnabled: true
        }
      };

      const updatedRoom = await roomService.updateRoom(testRoomId, updateData);
      
      expect(updatedRoom).toBeDefined();
      expect(updatedRoom.name).toBe('Updated E2E Test Room');
      expect(updatedRoom.settings.recordingEnabled).toBe(true);
    });
  });

  describe('Room Participants', () => {
    it('should get room participants', async () => {
      const participants = await roomService.getRoomParticipants(testRoomId);
      
      expect(participants).toBeDefined();
      expect(Array.isArray(participants)).toBe(true);
    });
  });

  describe('Message Management', () => {
    it('should send a message to the room', async () => {
      // First create a participant record manually for testing
      const participantQuery = `
        INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        testRoomId,
        'E2E Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({ userAgent: 'E2E Test Browser' })
      ]);
      
      testParticipantId = participantResult.rows[0].id;

      const result = await chatService.sendMessage(testRoomId, testParticipantId, 'Hello from E2E test!');
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Hello from E2E test!');
      expect(result.participant_id).toBe(testParticipantId);
    });

    it('should get room messages', async () => {
      const messages = await chatService.getMessages(testRoomId, 10, 0);
      
      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages[0].message).toBe('Hello from E2E test!');
    });
  });

  describe('Room Cleanup', () => {
    it('should delete the room', async () => {
      await roomService.deleteRoom(testRoomId);
      
      // Verify room is deleted
      const room = await roomService.getRoom(testRoomId);
      expect(room).toBeNull();
    });
  });

  describe('Database Health Check', () => {
    it('should perform database health check', async () => {
      const healthCheck = await dbService.healthCheck();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.database).toBe(true);
      expect(healthCheck.redis).toBe(true);
    });
  });
});
