import { AuthService } from '../../lib/auth/auth.service';
import { DatabaseService } from '../../lib/video-conferencing/services/database.service';

// Mock DatabaseService
jest.mock('../../lib/video-conferencing/services/database.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = {
      isConnected: jest.fn().mockReturnValue(true),
      query: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<DatabaseService>;

    authService = new AuthService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(authService.initialize()).resolves.toBeUndefined();
      expect(mockDatabaseService.initialize).toHaveBeenCalled();
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS users')
      );
    });
  });

  describe('register', () => {
    beforeEach(async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await authService.initialize();
    });

    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        avatar: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock user creation query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const existingUser = {
        id: 'existing-user-id',
        email: userData.email,
        name: 'Existing User',
        password_hash: 'hashed-password'
      };

      // Mock user lookup query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [existingUser],
        rowCount: 1
      });

      await expect(authService.register(userData))
        .rejects.toThrow('User with this email already exists');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123'
      };

      await expect(authService.register(userData))
        .rejects.toThrow('Valid email is required');
    });

    it('should validate password length', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: '123'
      };

      await expect(authService.register(userData))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should validate name length', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'A',
        password: 'password123'
      };

      await expect(authService.register(userData))
        .rejects.toThrow('Name must be at least 2 characters long');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await authService.initialize();
    });

    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        name: 'Test User',
        password_hash: '$2a$12$hashedpassword', // Mock bcrypt hash
        avatar: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      };

      // Mock user lookup query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Mock password comparison (bcrypt.compare)
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      // Mock last login update query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      const result = await authService.login(credentials);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock user lookup query - no user found
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        name: 'Test User',
        password_hash: '$2a$12$hashedpassword',
        avatar: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      };

      // Mock user lookup query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Mock password comparison (bcrypt.compare) - return false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid email or password');
    });

    it('should validate email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(authService.login(credentials))
        .rejects.toThrow('Valid email is required');
    });

    it('should validate password presence', async () => {
      const credentials = {
        email: 'test@example.com',
        password: ''
      };

      await expect(authService.login(credentials))
        .rejects.toThrow('Password is required');
    });
  });

  describe('refreshToken', () => {
    beforeEach(async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await authService.initialize();
    });

    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      };

      // Mock JWT verify
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        userId: 'user-id',
        email: 'test@example.com',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      // Mock user lookup query
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await authService.refreshToken(refreshToken);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(15 * 60); // 15 minutes
    });

    it('should throw error for invalid token type', async () => {
      const refreshToken = 'invalid-token';

      // Mock JWT verify to return access token type
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        userId: 'user-id',
        email: 'test@example.com',
        type: 'access', // Wrong type
        iat: Date.now(),
        exp: Date.now() + 15 * 60 * 1000
      });

      await expect(authService.refreshToken(refreshToken))
        .rejects.toThrow('Invalid token type');
    });

    it('should throw error for invalid token', async () => {
      const refreshToken = 'invalid-token';

      // Mock JWT verify to throw error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken))
        .rejects.toThrow('Token verification failed');
    });
  });

  describe('verifyToken', () => {
    it('should verify access token successfully', async () => {
      const accessToken = 'valid-access-token';

      // Mock JWT verify
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        userId: 'user-id',
        email: 'test@example.com',
        type: 'access',
        iat: Date.now(),
        exp: Date.now() + 15 * 60 * 1000
      });

      const result = await authService.verifyToken(accessToken);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-id');
      expect(result.email).toBe('test@example.com');
      expect(result.type).toBe('access');
    });

    it('should throw error for invalid token type', async () => {
      const accessToken = 'invalid-token';

      // Mock JWT verify to return refresh token type
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        userId: 'user-id',
        email: 'test@example.com',
        type: 'refresh', // Wrong type
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      await expect(authService.verifyToken(accessToken))
        .rejects.toThrow('Invalid token type');
    });

    it('should throw error for invalid token', async () => {
      const accessToken = 'invalid-token';

      // Mock JWT verify to throw error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken(accessToken))
        .rejects.toThrow('Token verification failed');
    });
  });

  describe('getUserById', () => {
    beforeEach(async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await authService.initialize();
    });

    it('should get user by ID successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await authService.getUserById(userId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(userId);
      expect(result!.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistent-user-id';

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await authService.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    beforeEach(async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await authService.initialize();
    });

    it('should update user successfully', async () => {
      const userId = 'user-id';
      const updates = {
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg'
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        name: updates.name,
        avatar: updates.avatar,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUpdatedUser],
        rowCount: 1
      });

      const result = await authService.updateUser(userId, updates);

      expect(result).toBeDefined();
      expect(result.name).toBe(updates.name);
      expect(result.avatar).toBe(updates.avatar);
    });

    it('should throw error if no updates provided', async () => {
      const userId = 'user-id';
      const updates = {};

      await expect(authService.updateUser(userId, updates))
        .rejects.toThrow('No updates provided');
    });
  });
});
