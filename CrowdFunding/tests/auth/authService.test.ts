import { AuthService } from '../../src/lib/services/auth';
import { UserRepository } from '../../src/repositories/UserRepository';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const mockBcrypt = bcrypt as any;
const mockJwt = jwt as any;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as any;

    authService = new AuthService(mockUserRepo);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'USER' as const,
      avatar: null,
      bio: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockJwt.sign.mockReturnValue('mock-jwt-token' as any);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      });
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should fail with invalid email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const result = await authService.login('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should fail with invalid password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as any);

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });

    it('should handle database errors', async () => {
      mockUserRepo.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
    });
  });

  describe('register', () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User'
    };

    const createdUser = {
      id: 'user-456',
      email: 'newuser@example.com',
      password: 'hashedpassword',
      name: 'New User',
      role: 'USER' as const,
      avatar: null,
      bio: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should register successfully with valid data', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as any);
      mockUserRepo.create.mockResolvedValue(createdUser);
      mockJwt.sign.mockReturnValue('mock-jwt-token' as any);

      const result = await authService.register(newUserData);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role
      });
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'hashedpassword',
        name: 'New User',
        role: 'USER'
      });
    });

    it('should fail if email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(createdUser);

      const result = await authService.register(newUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as any);
      mockUserRepo.create.mockRejectedValue(new Error('Database error'));

      const result = await authService.register(newUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    });

    it('should handle password hashing errors', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockRejectedValue(new Error('Hashing error'));

      const result = await authService.register(newUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    });
  });

  describe('verifyToken', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER'
    };

    it('should verify valid token', async () => {
      mockJwt.verify.mockReturnValue(mockPayload as any);
      mockUserRepo.findById.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        password: 'hashedpassword',
        avatar: null,
        bio: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.verifyToken('valid-token');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      });
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    });

    it('should fail with invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should fail if user not found', async () => {
      mockJwt.verify.mockReturnValue(mockPayload as any);
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await authService.verifyToken('valid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail with expired token', async () => {
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      const result = await authService.verifyToken('expired-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token expired');
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER' as const,
      password: 'hashedpassword',
      avatar: null,
      bio: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should refresh token successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue('new-jwt-token' as any);

      const result = await authService.refreshToken('user-123');

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      });
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
    });

    it('should fail if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await authService.refreshToken('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockUserRepo.findById.mockRejectedValue(new Error('Database error'));

      const result = await authService.refreshToken('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'oldhashedpassword',
      name: 'Test User',
      role: 'USER' as const,
      avatar: null,
      bio: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should change password successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockBcrypt.hash.mockResolvedValue('newhashedpassword' as any);
      mockUserRepo.update.mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
        avatar: null,
        bio: null,
        isVerified: false
      });

      const result = await authService.changePassword('user-123', 'oldpassword', 'newpassword');

      expect(result.success).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('oldpassword', 'oldhashedpassword');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-123', {
        password: 'newhashedpassword'
      });
    });

    it('should fail with incorrect current password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as any);

      const result = await authService.changePassword('user-123', 'wrongpassword', 'newpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('should fail if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await authService.changePassword('nonexistent-user', 'oldpassword', 'newpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockBcrypt.hash.mockResolvedValue('newhashedpassword' as any);
      mockUserRepo.update.mockRejectedValue(new Error('Database error'));

      const result = await authService.changePassword('user-123', 'oldpassword', 'newpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password change failed');
    });
  });
});
