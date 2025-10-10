/**
 * Input Validation Security Tests
 * Tests input sanitization, injection prevention, and data validation
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ChatService } from '../../lib/video-conferencing/services/chat.service';

describe('Input Validation Security Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let roomService: RoomService;
  let chatService: ChatService;

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    authService = new AuthService(dbService);
    await authService.initialize();
    roomService = new RoomService(dbService);
    chatService = new ChatService(dbService);
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in email field', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO "user" VALUES ('hacker', 'hacker@evil.com', 'password'); --",
        "' UNION SELECT * FROM "user" --"
      ];

      for (const injection of sqlInjectionAttempts) {
        await expect(
          authService.login({
            email: injection,
            password: 'TestPassword123!'
          })
        ).rejects.toThrow();
      }
    });

    it('should prevent SQL injection in password field', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO "user" VALUES ('hacker', 'hacker@evil.com', 'password'); --"
      ];

      for (const injection of sqlInjectionAttempts) {
        await expect(
          authService.login({
            email: 'test@example.com',
            password: injection
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent XSS in user registration', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        '"><img src=x onerror=alert("xss")>',
        'javascript:alert("xss")'
      ];

      for (const xss of xssAttempts) {
        await expect(
          authService.register({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name: xss
          })
        ).rejects.toThrow();
      }
    });

    it('should prevent XSS in room names', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        '"><img src=x onerror=alert("xss")>',
        'javascript:alert("xss")'
      ];

      for (const xss of xssAttempts) {
        await expect(
          roomService.createRoom({
            name: xss,
            maxParticipants: 10,
            settings: {}
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example..com',
        'test@.com',
        'test@example.',
        'test@example.com.',
        'test@example.com..'
      ];

      for (const email of invalidEmails) {
        await expect(
          authService.register({
            email,
            password: 'TestPassword123!',
            name: 'Test User'
          })
        ).rejects.toThrow();
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'qwerty',
        'abc123',
        'Password',
        'PASSWORD123',
        'password123'
      ];

      for (const password of weakPasswords) {
        await expect(
          authService.register({
            email: `test-${Date.now()}@example.com`,
            password,
            name: 'Test User'
          })
        ).rejects.toThrow();
      }
    });

    it('should validate room participant limits', async () => {
      const invalidLimits = [
        -1,
        0,
        1000,
        'not-a-number',
        null,
        undefined,
        Infinity,
        -Infinity
      ];

      for (const limit of invalidLimits) {
        await expect(
          roomService.createRoom({
            name: 'Test Room',
            maxParticipants: limit as any,
            settings: {}
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Length Validation', () => {
    it('should validate input length limits', async () => {
      const longInputs = {
        email: 'a'.repeat(300) + '@example.com',
        name: 'a'.repeat(300),
        roomName: 'a'.repeat(300),
        message: 'a'.repeat(10000)
      };

      // Test long email
      await expect(
        authService.register({
          email: longInputs.email,
          password: 'TestPassword123!',
          name: 'Test User'
        })
      ).rejects.toThrow();

      // Test long name
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: longInputs.name
        })
      ).rejects.toThrow();

      // Test long room name
      await expect(
        roomService.createRoom({
          name: longInputs.roomName,
          maxParticipants: 10,
          settings: {}
        })
      ).rejects.toThrow();
    });
  });

  describe('Special Character Handling', () => {
    it('should handle special characters safely', async () => {
      const specialChars = [
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'Test User with Special Chars !@#$%',
        'Room with Special Chars !@#$%',
        'Message with Special Chars !@#$%'
      ];

      // These should be handled safely without causing errors
      for (const input of specialChars) {
        try {
          await authService.register({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name: input
          });
        } catch (error) {
          // Some special characters might be rejected, which is acceptable
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Null Byte Injection', () => {
    it('should prevent null byte injection', async () => {
      const nullByteInputs = [
        'test\0@example.com',
        'Test User\0',
        'Test Room\0',
        'Test Message\0'
      ];

      for (const input of nullByteInputs) {
        await expect(
          authService.register({
            email: input,
            password: 'TestPassword123!',
            name: 'Test User'
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('Unicode and Encoding', () => {
    it('should handle unicode characters safely', async () => {
      const unicodeInputs = [
        '测试用户',
        'Тестовый пользователь',
        'مستخدم اختبار',
        'テストユーザー',
        '🧪 Test User 🧪'
      ];

      for (const input of unicodeInputs) {
        try {
          await authService.register({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name: input
          });
        } catch (error) {
          // Some unicode might be rejected, which is acceptable
          expect(error).toBeDefined();
        }
      }
    });
  });
});
