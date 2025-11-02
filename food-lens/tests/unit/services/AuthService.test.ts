/**
 * AuthService Tests
 * Comprehensive tests for authentication business operations
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { AuthService } from '../../../src/lib/food-label-scanner/services/api/AuthService';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Mock FirestoreService
jest.mock('../../../src/lib/food-label-scanner/services/database/FirestoreService', () => ({
  firestoreService: {
    initialize: jest.fn(() => Promise.resolve()),
    createUser: jest.fn(() => Promise.resolve()),
    getUser: jest.fn(() => Promise.resolve(null)),
    updateUser: jest.fn(() => Promise.resolve()),
  },
}));

describe('AuthService - Business Operations', () => {
  let authService: AuthService;
  let mockFirebaseUser: any;

  beforeEach(() => {
    authService = new AuthService();
    mockFirebaseUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
      refreshToken: 'mock-refresh-token',
    };
  });

  describe('User Registration', () => {
    it('should register new user with valid credentials', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      const { firestoreService } = require('../../../src/lib/food-label-scanner/services/database/FirestoreService');
      firestoreService.createUser.mockResolvedValue(undefined);

      const result = await authService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(result.user.uid).toBe('test-uid-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-token');
    });

    it('should validate email format during registration', async () => {
      await expect(
        authService.register('invalid-email', 'password123', 'Test User')
      ).rejects.toThrow('Invalid email address format');
    });

    it('should validate password length during registration', async () => {
      await expect(
        authService.register('test@example.com', 'short', 'Test User')
      ).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should validate display name during registration', async () => {
      await expect(
        authService.register('test@example.com', 'password123', 'A')
      ).rejects.toThrow('Display name must be at least 2 characters');
    });

    it('should handle duplicate email registration', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      await expect(
        authService.register('existing@example.com', 'password123', 'Test User')
      ).rejects.toThrow('User already exists');
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      const { firestoreService } = require('../../../src/lib/food-label-scanner/services/database/FirestoreService');
      firestoreService.getUser.mockResolvedValue({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'en',
        dietaryRestrictions: [],
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: { language: 'en', notifications: true, offlineMode: true, dietaryRestrictions: [] },
        stats: { totalScans: 0, lastScanAt: null },
        updateLastLogin: jest.fn(),
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user.uid).toBe('test-uid-123');
      expect(result.token).toBe('mock-token');
    });

    it('should update last login timestamp on successful login', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      const { firestoreService } = require('../../../src/lib/food-label-scanner/services/database/FirestoreService');
      const mockUser = {
        uid: 'test-uid-123',
        updateLastLogin: jest.fn(),
      };
      firestoreService.getUser.mockResolvedValue(mockUser);

      await authService.login('test@example.com', 'password123');

      expect(mockUser.updateLastLogin).toHaveBeenCalled();
      expect(firestoreService.updateUser).toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-credential',
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should create user if not found in Firestore during login', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      const { firestoreService } = require('../../../src/lib/food-label-scanner/services/database/FirestoreService');
      firestoreService.getUser.mockResolvedValue(null);

      await authService.login('test@example.com', 'password123');

      expect(firestoreService.createUser).toHaveBeenCalled();
    });
  });

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const { signOut } = require('firebase/auth');
      signOut.mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).rejects.toThrow();
    });
  });
});

