import { db } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { ServiceFactory } from '../../lib/video-conferencing/services/service.factory';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';
import { RoomModel } from '../../lib/video-conferencing/models/room.model';
import { ParticipantModel } from '../../lib/video-conferencing/models/participant.model';
import { MessageModel } from '../../lib/video-conferencing/models/message.model';

describe('API Integration Tests', () => {
  let authService: AuthService;
  let serviceFactory: ServiceFactory;
  let roomService: RoomService;
  let chatService: ChatService;
  let testUser: any;
  let testRoom: any;
  let authToken: string;

  beforeAll(async () => {
    // Initialize database
    await db.initialize();
    
    // Clean up any existing test data
    await db.query('DELETE FROM messages WHERE room_id IN (SELECT id FROM rooms WHERE name LIKE $1)', ['Test%']);
    await db.query('DELETE FROM participants WHERE room_id IN (SELECT id FROM rooms WHERE name LIKE $1)', ['Test%']);
    await db.query('DELETE FROM rooms WHERE name LIKE $1', ['Test%']);
    await db.query('DELETE FROM "user" WHERE email LIKE $1', ['test%@example.com']);
    
    // Initialize auth service
    authService = new AuthService(db);
    await authService.initialize();
    
    // Initialize service factory
    serviceFactory = new ServiceFactory(db);
    await serviceFactory.initialize();
    
    // Get service instances
    roomService = serviceFactory.getRoomService();
    chatService = serviceFactory.getChatService();
  });

  afterAll(async () => {
    // Clean up database
    await db.query('DELETE FROM messages WHERE room_id IN (SELECT id FROM rooms WHERE name LIKE $1)', ['Test%']);
    await db.query('DELETE FROM participants WHERE room_id IN (SELECT id FROM rooms WHERE name LIKE $1)', ['Test%']);
    await db.query('DELETE FROM rooms WHERE name LIKE $1', ['Test%']);
    await db.query('DELETE FROM "user" WHERE email LIKE $1', ['test%@example.com']);
    
    await db.close();
  });

  beforeEach(async () => {
    // Create test user
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User'
    };
    
    testUser = await authService.register(userData);
    authToken = testUser.tokens.accessToken;
  });

  afterEach(async () => {
    // Clean up test data
    if (testRoom) {
      await db.query('DELETE FROM participants WHERE room_id = $1', [testRoom.id]);
      await db.query('DELETE FROM messages WHERE room_id = $1', [testRoom.id]);
      await db.query('DELETE FROM rooms WHERE id = $1', [testRoom.id]);
    }
    await db.query('DELETE FROM "user" WHERE email = $1', ['test@example.com']);
    await db.query('DELETE FROM "user" WHERE email = $1', ['newuser@example.com']);
  });

  describe('Authentication Service Integration', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        name: 'New User'
      };

      // Check if user already exists and delete if necessary
      const existingUser = await authService.getUserByEmail(userData.email);
      if (existingUser) {
        await db.query('DELETE FROM "user" WHERE email = $1', [userData.email]);
      }

      const result = await authService.register(userData);
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const result = await authService.login(loginData);
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should verify access token', async () => {
      const decoded = await authService.verifyAccessToken(authToken);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUser.user.id);
      expect(decoded.email).toBe('test@example.com');
    });

    it('should refresh access token', async () => {
      const refreshResult = await authService.refreshToken(testUser.tokens.refreshToken);
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });
  });

  describe('Room Service Integration', () => {
    it('should create a new room', async () => {
      const roomData = {
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true
        }
      };

      const result = await roomService.createRoom(roomData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(roomData.name);
      expect(result.maxParticipants).toBe(roomData.maxParticipants);
      
      testRoom = result;
    });

    it('should get room by id', async () => {
      // Create a test room first
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room Get', 5]
      );
      testRoom = roomResult.rows[0];

      const room = await roomService.getRoom(testRoom.id);
      
      expect(room).toBeDefined();
      expect(room!.id).toBe(testRoom.id);
      expect(room!.name).toBe('Test Room Get');
    });

    it('should update room settings', async () => {
      // Create a test room first
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room Update', 5]
      );
      testRoom = roomResult.rows[0];

      const updateData = {
        name: 'Updated Room Name',
        maxParticipants: 8,
        settings: {
          allowScreenShare: false,
          allowChat: true
        }
      };

      const updatedRoom = await roomService.updateRoom(testRoom.id, updateData);
      
      expect(updatedRoom).toBeDefined();
      expect(updatedRoom.name).toBe(updateData.name);
      expect(updatedRoom.maxParticipants).toBe(updateData.maxParticipants);
    });

    it('should delete a room', async () => {
      // Create a test room first
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room Delete', 5]
      );
      testRoom = roomResult.rows[0];

      await roomService.deleteRoom(testRoom.id);
      
      // Verify room is deleted by trying to get it
      const deletedRoom = await roomService.getRoom(testRoom.id);
      expect(deletedRoom).toBeNull();
    });
  });

  describe('Participant Service Integration', () => {
    beforeEach(async () => {
      // Create a test room
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room Participants', 5]
      );
      testRoom = roomResult.rows[0];
    });

    it('should get room participants', async () => {
      // Add a participant first
      const participantResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [testRoom.id, 'Test Participant', JSON.stringify({ camera: true, microphone: true, screen_share: false }), true, 'connected']
      );

      const participants = await roomService.getRoomParticipants(testRoom.id);
      
      expect(participants).toBeDefined();
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBe(1);
      expect(participants[0].name).toBe('Test Participant');
    });

  });

  describe('Message Service Integration', () => {
    beforeEach(async () => {
      // Create a test room and participant
      const roomResult = await db.query(
        'INSERT INTO rooms (name, max_participants) VALUES ($1, $2) RETURNING *',
        ['Test Room Messages', 5]
      );
      testRoom = roomResult.rows[0];

      const participantResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [testRoom.id, 'Test Participant', JSON.stringify({ camera: true, microphone: true, screen_share: false }), true, 'connected']
      );
    });

    it('should get room messages', async () => {
      // Create a participant first
      const participantResult = await db.query(
        'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [testRoom.id, 'Test Participant', JSON.stringify({ camera: true, microphone: true, screen_share: false }), true, 'connected']
      );
      const participant = participantResult.rows[0];

      // Add a message with the valid participant ID
      await db.query(
        'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5)',
        [testRoom.id, participant.id, 'Test Participant', 'Test message', 'text']
      );

      const messages = await roomService.getRoomMessages(testRoom.id);
      
      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(1);
      expect(messages[0].message).toBe('Test message');
    });

  });

  describe('Health Check Integration', () => {
    it('should perform database health check', async () => {
      const isHealthy = await db.isConnected();
      expect(isHealthy).toBe(true);
    });

    it('should get database statistics', async () => {
      const stats = await db.getPoolStats();
      expect(stats).toBeDefined();
      expect(stats.totalCount).toBeDefined();
      expect(stats.idleCount).toBeDefined();
      expect(stats.waitingCount).toBeDefined();
    });
  });
});
