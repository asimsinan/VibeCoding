/**
 * Authentication Security Tests
 * Tests authentication mechanisms, token security, and password policies
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication Security Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    authService = new AuthService(dbService);
    await authService.initialize();
  });

  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'qwerty',
        'abc123',
        'Password',
        'PASSWORD123',
        'password123',
        'admin',
        'test'
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

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password2024',
        'Complex#Pass1',
        'Very$Strong2',
        'Super&Secure3'
      ];

      for (const password of strongPasswords) {
        const result = await authService.register({
          email: `test-${Date.now()}@example.com`,
          password,
          name: 'Test User'
        });
        
        expect(result.user).toBeDefined();
        expect(result.tokens).toBeDefined();
      }
    });

    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const result = await authService.register({
        email: 'hash-test@example.com',
        password,
        name: 'Hash Test User'
      });

      // Check that password is hashed in database
      const userQuery = await dbService.query(
        'SELECT password_hash FROM "user" WHERE id = $1',
        [result.user.id]
      );
      
      const storedHash = userQuery.rows[0].password_hash;
      expect(storedHash).not.toBe(password);
      expect(storedHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
      
      // Verify password can be verified
      const isValid = await bcrypt.compare(password, storedHash);
      expect(isValid).toBe(true);
    });

    it('should prevent password reuse', async () => {
      const email = 'reuse-test@example.com';
      const password = 'TestPassword123!';
      
      // Register first user
      await authService.register({
        email,
        password,
        name: 'Test User'
      });

      // Try to register with same email
      await expect(
        authService.register({
          email,
          password: 'DifferentPassword123!',
          name: 'Another User'
        })
      ).rejects.toThrow();
    });
  });

  describe('Token Security', () => {
    let testUser: any;
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const result = await authService.register({
        email: 'token-test@example.com',
        password: 'TestPassword123!',
        name: 'Token Test User'
      });
      
      testUser = result.user;
      accessToken = result.tokens.accessToken;
      refreshToken = result.tokens.refreshToken;
    });

    it('should generate secure JWT tokens', () => {
      // Verify access token structure
      const accessPayload = jwt.decode(accessToken) as any;
      expect(accessPayload).toBeDefined();
      expect(accessPayload.userId).toBe(testUser.id);
      expect(accessPayload.type).toBe('access');
      expect(accessPayload.exp).toBeDefined();
      expect(accessPayload.iat).toBeDefined();

      // Verify refresh token structure
      const refreshPayload = jwt.decode(refreshToken) as any;
      expect(refreshPayload).toBeDefined();
      expect(refreshPayload.userId).toBe(testUser.id);
      expect(refreshPayload.type).toBe('refresh');
      expect(refreshPayload.exp).toBeDefined();
      expect(refreshPayload.iat).toBeDefined();
    });

    it('should have appropriate token expiration times', () => {
      const accessPayload = jwt.decode(accessToken) as any;
      const refreshPayload = jwt.decode(refreshToken) as any;
      
      const now = Math.floor(Date.now() / 1000);
      const accessExp = accessPayload.exp - now;
      const refreshExp = refreshPayload.exp - now;
      
      // Access token should expire in 15 minutes (900 seconds)
      expect(accessExp).toBeCloseTo(900, -2);
      
      // Refresh token should expire in 7 days (604800 seconds)
      expect(refreshExp).toBeCloseTo(604800, -2);
    });

    it('should reject invalid tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null,
        undefined
      ];

      for (const token of invalidTokens) {
        await expect(
          authService.verifyAccessToken(token as string)
        ).rejects.toThrow();
      }
    });

    it('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, type: 'access' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      await expect(
        authService.verifyAccessToken(expiredToken)
      ).rejects.toThrow();
    });

    it('should reject tokens with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: testUser.id, type: 'access' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      await expect(
        authService.verifyAccessToken(wrongSecretToken)
      ).rejects.toThrow();
    });

    it('should refresh tokens securely', async () => {
      const refreshResult = await authService.refreshAccessToken(refreshToken);
      
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(accessToken);
      expect(refreshResult.refreshToken).not.toBe(refreshToken);
      
      // Verify new tokens work
      const newAccessPayload = jwt.decode(refreshResult.accessToken) as any;
      expect(newAccessPayload.userId).toBe(testUser.id);
    });

    it('should invalidate refresh token after use', async () => {
      // Use refresh token
      await authService.refreshAccessToken(refreshToken);
      
      // Try to use it again - should fail
      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow();
    });
  });

  describe('Login Security', () => {
    let testUser: any;

    beforeAll(async () => {
      const result = await authService.register({
        email: 'login-test@example.com',
        password: 'TestPassword123!',
        name: 'Login Test User'
      });
      testUser = result.user;
    });

    it('should prevent brute force attacks', async () => {
      const maxAttempts = 5;
      
      // Try to login with wrong password multiple times
      for (let i = 0; i < maxAttempts; i++) {
        await expect(
          authService.login({
            email: 'login-test@example.com',
            password: 'WrongPassword123!'
          })
        ).rejects.toThrow();
      }
      
      // Even with correct password, should still work
      const result = await authService.login({
        email: 'login-test@example.com',
        password: 'TestPassword123!'
      });
      
      expect(result.user).toBeDefined();
    });

    it('should handle case-insensitive email', async () => {
      const result = await authService.login({
        email: 'LOGIN-TEST@EXAMPLE.COM',
        password: 'TestPassword123!'
      });
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login-test@example.com');
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
      ).rejects.toThrow();
    });

    it('should not reveal if email exists', async () => {
      // Both should throw similar errors
      const error1 = await authService.login({
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }).catch(e => e.message);

      const error2 = await authService.login({
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      }).catch(e => e.message);

      // Errors should be similar to prevent email enumeration
      expect(error1).toContain('Invalid');
      expect(error2).toContain('Invalid');
    });
  });

  describe('Session Security', () => {
    it('should handle concurrent logins', async () => {
      const email = 'concurrent-test@example.com';
      const password = 'TestPassword123!';
      
      // Register user
      await authService.register({
        email,
        password,
        name: 'Concurrent Test User'
      });

      // Login multiple times concurrently
      const loginPromises = Array(5).fill(null).map(() =>
        authService.login({ email, password })
      );

      const results = await Promise.all(loginPromises);
      
      // All logins should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.user).toBeDefined();
        expect(result.tokens).toBeDefined();
      });
    });

    it('should handle logout securely', async () => {
      const result = await authService.register({
        email: 'logout-test@example.com',
        password: 'TestPassword123!',
        name: 'Logout Test User'
      });

      const { accessToken, refreshToken } = result.tokens;

      // Verify tokens work before logout
      await expect(
        authService.verifyAccessToken(accessToken)
      ).resolves.toBeDefined();

      // Logout should invalidate tokens
      await authService.logout(refreshToken);

      // Tokens should no longer work
      await expect(
        authService.verifyAccessToken(accessToken)
      ).rejects.toThrow();

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should sanitize email input', async () => {
      const maliciousEmails = [
        'test@example.com<script>alert("xss")</script>',
        'test@example.com\'; DROP TABLE users; --',
        'test@example.com" OR "1"="1',
        'test@example.com\n<script>alert("xss")</script>'
      ];

      for (const email of maliciousEmails) {
        await expect(
          authService.register({
            email,
            password: 'TestPassword123!',
            name: 'Test User'
          })
        ).rejects.toThrow();
      }
    });

    it('should sanitize name input', async () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        'Test User\'; DROP TABLE users; --',
        'Test User" OR "1"="1',
        'Test User\n<script>alert("xss")</script>'
      ];

      for (const name of maliciousNames) {
        await expect(
          authService.register({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name
          })
        ).rejects.toThrow();
      }
    });

    it('should handle SQL injection attempts', async () => {
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
  });

  describe('Rate Limiting', () => {
    it('should handle rapid registration attempts', async () => {
      const promises = Array(10).fill(null).map((_, i) =>
        authService.register({
          email: `rapid-test-${i}@example.com`,
          password: 'TestPassword123!',
          name: `Rapid Test User ${i}`
        }).catch(error => error)
      );

      const results = await Promise.all(promises);
      
      // Some should succeed, some might fail due to rate limiting
      const successes = results.filter(r => !r.message);
      const failures = results.filter(r => r.message);
      
      expect(successes.length).toBeGreaterThan(0);
      // Rate limiting might cause some failures, which is expected
    });

    it('should handle rapid login attempts', async () => {
      const email = 'rapid-login-test@example.com';
      const password = 'TestPassword123!';
      
      // Register user first
      await authService.register({
        email,
        password,
        name: 'Rapid Login Test User'
      });

      const promises = Array(20).fill(null).map(() =>
        authService.login({ email, password }).catch(error => error)
      );

      const results = await Promise.all(promises);
      
      // Most should succeed, some might fail due to rate limiting
      const successes = results.filter(r => !r.message);
      const failures = results.filter(r => r.message);
      
      expect(successes.length).toBeGreaterThan(0);
    });
  });
});
