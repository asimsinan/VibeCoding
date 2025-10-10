/**
 * Authorization Security Tests
 * Tests access control, role-based permissions, and resource authorization
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';

describe('Authorization Security Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let roomService: RoomService;
  let chatService: ChatService;
  let testUsers: any[] = [];
  let testRooms: any[] = [];

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    authService = new AuthService(dbService);
    await authService.initialize();
    roomService = new RoomService(dbService);
    chatService = new ChatService(dbService);
  });

  beforeEach(async () => {
    // Create test users
    for (let i = 0; i < 3; i++) {
      const result = await authService.register({
        email: `auth-test-${i}@example.com`,
        password: 'TestPassword123!',
        name: `Auth Test User ${i}`
      });
      testUsers.push(result.user);
    }

    // Create test rooms
    for (let i = 0; i < 2; i++) {
      const room = await roomService.createRoom({
        name: `Auth Test Room ${i}`,
        maxParticipants: 10,
        settings: {}
      });
      testRooms.push(room);
    }
  });

  afterEach(async () => {
    // Clean up test data
    for (const room of testRooms) {
      try {
        await roomService.deleteRoom(room.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    for (const user of testUsers) {
      try {
        await dbService.query('DELETE FROM "user" WHERE id = $1', [user.id]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    testUsers = [];
    testRooms = [];
  });

  describe('Room Access Control', () => {
    it('should prevent unauthorized room access', async () => {
      const roomId = testRooms[0].id;
      const unauthorizedUserId = testUsers[1].id;

      // Try to access room without proper authentication
      await expect(
        roomService.getRoom('invalid-room-id')
      ).rejects.toThrow();

      // Try to access room with invalid user context
      await expect(
        roomService.updateRoom(roomId, { name: 'Hacked Room' })
      ).rejects.toThrow();
    });

    it('should prevent room deletion by non-owners', async () => {
      const roomId = testRooms[0].id;
      const nonOwnerUserId = testUsers[1].id;

      // Non-owner should not be able to delete room
      await expect(
        roomService.deleteRoom(roomId)
      ).rejects.toThrow();
    });

    it('should prevent unauthorized room updates', async () => {
      const roomId = testRooms[0].id;
      const nonOwnerUserId = testUsers[1].id;

      // Non-owner should not be able to update room settings
      await expect(
        roomService.updateRoom(roomId, {
          name: 'Hacked Room Name',
          maxParticipants: 100
        })
      ).rejects.toThrow();
    });

    it('should validate room ownership', async () => {
      const roomId = testRooms[0].id;
      const ownerId = testUsers[0].id;
      const nonOwnerId = testUsers[1].id;

      // Owner should be able to access room
      const room = await roomService.getRoom(roomId);
      expect(room).toBeDefined();
      expect(room.id).toBe(roomId);

      // Non-owner should not be able to access room details
      await expect(
        roomService.getRoom(roomId)
      ).rejects.toThrow();
    });
  });

  describe('Message Authorization', () => {
    let participantId: string;

    beforeEach(async () => {
      // Create a participant for message testing
      const participantQuery = `
        INSERT INTO participants (room_id, user_id, name, is_connected, media_permissions, client_info, joined_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `;
      
      const participantResult = await dbService.query(participantQuery, [
        testRooms[0].id,
        testUsers[0].id,
        'Test Participant',
        true,
        JSON.stringify({ camera: true, microphone: true, screen_share: false }),
        JSON.stringify({})
      ]);
      
      participantId = participantResult.rows[0].id;
    });

    it('should prevent unauthorized message sending', async () => {
      const roomId = testRooms[0].id;
      const unauthorizedParticipantId = 'invalid-participant-id';

      // Try to send message with invalid participant
      await expect(
        chatService.sendMessage(roomId, unauthorizedParticipantId, 'Unauthorized message')
      ).rejects.toThrow();
    });

    it('should prevent message spoofing', async () => {
      const roomId = testRooms[0].id;
      const spoofedParticipantId = '00000000-0000-0000-0000-000000000000';

      // Try to send message with spoofed participant ID
      await expect(
        chatService.sendMessage(roomId, spoofedParticipantId, 'Spoofed message')
      ).rejects.toThrow();
    });

    it('should validate participant-room relationship', async () => {
      const roomId = testRooms[1].id; // Different room
      const participantId = 'valid-participant-id';

      // Try to send message to wrong room
      await expect(
        chatService.sendMessage(roomId, participantId, 'Wrong room message')
      ).rejects.toThrow();
    });

    it('should prevent message injection attacks', async () => {
      const roomId = testRooms[0].id;
      const maliciousMessages = [
        '<script>alert("xss")</script>',
        'Message\'; DROP TABLE messages; --',
        'Message" OR "1"="1',
        'Message\n<script>alert("xss")</script>',
        'Message\0null\0byte',
        'Message' + String.fromCharCode(0) + 'null'
      ];

      for (const message of maliciousMessages) {
        await expect(
          chatService.sendMessage(roomId, participantId, message)
        ).rejects.toThrow();
      }
    });

    it('should prevent message flooding', async () => {
      const roomId = testRooms[0].id;
      const longMessage = 'A'.repeat(10000); // Very long message

      await expect(
        chatService.sendMessage(roomId, participantId, longMessage)
      ).rejects.toThrow();
    });
  });

  describe('User Data Protection', () => {
    it('should prevent user data enumeration', async () => {
      // Try to access user data without proper authentication
      await expect(
        authService.getUserProfile('invalid-user-id')
      ).rejects.toThrow();

      // Try to access user data with invalid token
      await expect(
        authService.getUserProfile(testUsers[0].id)
      ).rejects.toThrow();
    });

    it('should prevent user data modification by others', async () => {
      const targetUserId = testUsers[0].id;
      const attackerUserId = testUsers[1].id;

      // Attacker should not be able to modify target user's data
      await expect(
        authService.updateUserProfile(targetUserId, {
          name: 'Hacked Name',
          email: 'hacked@evil.com'
        })
      ).rejects.toThrow();
    });

    it('should validate user ownership', async () => {
      const userId = testUsers[0].id;
      const otherUserId = testUsers[1].id;

      // User should only be able to access their own data
      await expect(
        authService.getUserProfile(otherUserId)
      ).rejects.toThrow();
    });
  });

  describe('Resource Isolation', () => {
    it('should prevent cross-room data access', async () => {
      const room1Id = testRooms[0].id;
      const room2Id = testRooms[1].id;

      // Try to access room 1's data using room 2's context
      await expect(
        roomService.getRoom(room1Id)
      ).rejects.toThrow();

      // Try to access room 2's data using room 1's context
      await expect(
        roomService.getRoom(room2Id)
      ).rejects.toThrow();
    });

    it('should prevent cross-user data access', async () => {
      const user1Id = testUsers[0].id;
      const user2Id = testUsers[1].id;

      // Try to access user 1's data using user 2's context
      await expect(
        authService.getUserProfile(user1Id)
      ).rejects.toThrow();

      // Try to access user 2's data using user 1's context
      await expect(
        authService.getUserProfile(user2Id)
      ).rejects.toThrow();
    });

    it('should prevent privilege escalation', async () => {
      const regularUserId = testUsers[0].id;
      const adminUserId = testUsers[1].id;

      // Regular user should not be able to escalate to admin
      await expect(
        authService.updateUserProfile(regularUserId, {
          role: 'admin',
          permissions: ['admin:all']
        })
      ).rejects.toThrow();
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize room names', async () => {
      const maliciousRoomNames = [
        '<script>alert("xss")</script>',
        'Room\'; DROP TABLE rooms; --',
        'Room" OR "1"="1',
        'Room\n<script>alert("xss")</script>',
        'Room\0null\0byte'
      ];

      for (const name of maliciousRoomNames) {
        await expect(
          roomService.createRoom({
            name,
            maxParticipants: 10,
            settings: {}
          })
        ).rejects.toThrow();
      }
    });

    it('should validate room settings', async () => {
      const maliciousSettings = [
        { allowScreenShare: '<script>alert("xss")</script>' },
        { allowChat: 'true\'; DROP TABLE rooms; --' },
        { allowCamera: 'true" OR "1"="1' },
        { allowMicrophone: 'true\n<script>alert("xss")</script>' }
      ];

      for (const settings of maliciousSettings) {
        await expect(
          roomService.createRoom({
            name: 'Test Room',
            maxParticipants: 10,
            settings
          })
        ).rejects.toThrow();
      }
    });

    it('should validate participant names', async () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        'Participant\'; DROP TABLE participants; --',
        'Participant" OR "1"="1',
        'Participant\n<script>alert("xss")</script>',
        'Participant\0null\0byte'
      ];

      for (const name of maliciousNames) {
        await expect(
          dbService.query(
            'INSERT INTO participants (room_id, name, is_connected, media_permissions, client_info, joined_at, last_seen) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [
              testRooms[0].id,
              name,
              true,
              JSON.stringify({}),
              JSON.stringify({})
            ]
          )
        ).rejects.toThrow();
      }
    });
  });

  describe('Session Management', () => {
    it('should handle concurrent sessions', async () => {
      const email = 'concurrent-session@example.com';
      const password = 'TestPassword123!';

      // Register user
      await authService.register({
        email,
        password,
        name: 'Concurrent Session User'
      });

      // Create multiple sessions
      const sessions = await Promise.all([
        authService.login({ email, password }),
        authService.login({ email, password }),
        authService.login({ email, password })
      ]);

      // All sessions should be valid
      expect(sessions).toHaveLength(3);
      sessions.forEach(session => {
        expect(session.user).toBeDefined();
        expect(session.tokens).toBeDefined();
      });
    });

    it('should handle session invalidation', async () => {
      const result = await authService.register({
        email: 'session-invalidation@example.com',
        password: 'TestPassword123!',
        name: 'Session Invalidation User'
      });

      const { accessToken, refreshToken } = result.tokens;

      // Verify session works
      await expect(
        authService.verifyAccessToken(accessToken)
      ).resolves.toBeDefined();

      // Invalidate session
      await authService.logout(refreshToken);

      // Session should no longer work
      await expect(
        authService.verifyAccessToken(accessToken)
      ).rejects.toThrow();
    });

    it('should handle token refresh security', async () => {
      const result = await authService.register({
        email: 'token-refresh@example.com',
        password: 'TestPassword123!',
        name: 'Token Refresh User'
      });

      const { refreshToken } = result.tokens;

      // Refresh token should work
      const refreshResult = await authService.refreshAccessToken(refreshToken);
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();

      // Old refresh token should be invalidated
      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow();
    });
  });

  describe('Error Handling and Information Disclosure', () => {
    it('should not reveal internal system information', async () => {
      try {
        await authService.login({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
      } catch (error: any) {
        // Error should not reveal internal details
        expect(error.message).not.toContain('database');
        expect(error.message).not.toContain('query');
        expect(error.message).not.toContain('table');
        expect(error.message).not.toContain('column');
        expect(error.message).not.toContain('connection');
      }
    });

    it('should not reveal user existence', async () => {
      const error1 = await authService.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }).catch(e => e.message);

      const error2 = await authService.login({
        email: testUsers[0].email,
        password: 'wrongpassword'
      }).catch(e => e.message);

      // Both errors should be similar to prevent user enumeration
      expect(error1).toContain('Invalid');
      expect(error2).toContain('Invalid');
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        null,
        undefined,
        {},
        { email: null },
        { password: null },
        { email: '', password: '' },
        { email: 'test@example.com' }, // missing password
        { password: 'TestPassword123!' } // missing email
      ];

      for (const request of malformedRequests) {
        await expect(
          authService.login(request as any)
        ).rejects.toThrow();
      }
    });
  });
});
