/**
 * API Integration Tests
 * Tests API service layer integration with UI components
 */

import { authService } from '../../../src/lib/food-label-scanner/services/api/AuthService';
import { scanService } from '../../../src/lib/food-label-scanner/services/api/ScanService';
import { firestoreService } from '../../../src/lib/food-label-scanner/services/database/FirestoreService';

// Mock Firebase Auth
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

const mockCreateUser = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Mock Firestore Service
const mockFirestoreService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  createUser: jest.fn().mockResolvedValue(undefined),
  getUser: jest.fn().mockResolvedValue(null),
  createScan: jest.fn().mockResolvedValue(undefined),
  getScan: jest.fn().mockResolvedValue(null),
  getScansByUser: jest.fn().mockResolvedValue([]),
};

jest.mock('../../../src/lib/food-label-scanner/services/database/FirestoreService', () => ({
  firestoreService: mockFirestoreService,
}));

describe('API Integration - Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestoreService.getUser.mockResolvedValue(null);
    mockFirestoreService.createUser.mockResolvedValue(undefined);
  });

  describe('User Registration', () => {
    it('should register user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const displayName = 'Test User';

      // Mock Firebase Auth response (minimal required properties)
      const mockAuthUser = {
        uid: 'user123',
        email,
        displayName,
        emailVerified: false,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: 'mock-refresh-token',
        tenantId: null,
        delete: jest.fn().mockResolvedValue(undefined),
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({}),
      } as any;

      mockCreateUser.mockResolvedValue({
        user: mockAuthUser,
      } as any);

      // Test registration flow
      await expect(
        authService.register(email, password, displayName)
      ).resolves.toHaveProperty('user');
    });

    it('should handle registration errors', async () => {
      const email = 'invalid-email';
      const password = '123'; // Too short

      await expect(
        authService.register(email, password, 'User')
      ).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // Mock Firebase Auth response (minimal required properties)
      const mockAuthUser = {
        uid: 'user123',
        email,
        emailVerified: false,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: 'mock-refresh-token',
        tenantId: null,
        delete: jest.fn().mockResolvedValue(undefined),
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
        getIdTokenResult: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockResolvedValue(undefined),
        toJSON: jest.fn().mockReturnValue({}),
      } as any;

      mockSignIn.mockResolvedValue({
        user: mockAuthUser,
      } as any);

      // Mock Firestore user data
      mockFirestoreService.getUser.mockResolvedValue({
        uid: 'user123',
        email,
        displayName: 'Test User',
        createdAt: new Date(),
        preferences: { language: 'en', notifications: true },
      });

      // Test login flow
      await expect(
        authService.login(email, password)
      ).resolves.toHaveProperty('user');
    });

    it('should handle login errors', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';

      await expect(authService.login(email, password)).rejects.toThrow();
    });
  });

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });
});

describe('API Integration - Scan Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestoreService.createScan.mockResolvedValue(undefined);
  });

  describe('Scan Creation', () => {
    it('should create scan with valid image data', async () => {
      const userId = 'user123';
      const scanRequest = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', // Valid base64
        language: 'en' as const,
      };

      // Test scan creation
      const result = await scanService.createScan(userId, scanRequest);
      expect(result).toHaveProperty('scanId');
      expect(mockFirestoreService.createScan).toHaveBeenCalled();
    });

    it('should handle invalid image data', async () => {
      const userId = 'user123';
      const scanRequest = {
        image: 'invalid-data',
        language: 'en' as const,
      };

      await expect(
        scanService.createScan(userId, scanRequest)
      ).rejects.toThrow();
    });
  });

  describe('Scan Retrieval', () => {
    it('should retrieve scan by ID', async () => {
      const scanId = 'scan123';

      // Mock Firestore scan data
      mockFirestoreService.getScan.mockResolvedValue({
        scanId,
        userId: 'user123',
        status: 'completed',
      });

      const result = await scanService.getScan(scanId);
      expect(result).toMatchObject({
        scanId,
      });
    });

    it('should handle non-existent scan', async () => {
      const scanId = 'nonexistent';

      await expect(scanService.getScan(scanId)).resolves.toBeNull();
    });
  });

  describe('Scan History', () => {
    it('should retrieve scan history for user', async () => {
      const userId = 'user123';
      const page = 1;
      const limit = 20;

      // Mock Firestore scan history
      mockFirestoreService.getScansByUser.mockResolvedValue([
        { scanId: 'scan1', userId, status: 'completed' },
        { scanId: 'scan2', userId, status: 'completed' },
      ]);

      const result = await scanService.getScanHistory(userId, page, limit);
      expect(result).toBeInstanceOf(Array);
      expect(mockFirestoreService.getScansByUser).toHaveBeenCalledWith(userId, page, limit);
    });
  });
});

describe('API Integration - Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Mock network failure
    mockFirestoreService.initialize.mockRejectedValue(new Error('Network error'));

    await expect(
      authService.register('test@example.com', 'password123', 'User')
    ).rejects.toThrow();
  });

  it('should handle validation errors', async () => {
    await expect(
      authService.register('invalid-email', '123', 'User')
    ).rejects.toThrow();
  });
});

describe('API Integration - Data Transformation', () => {
  it('should transform user data correctly', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const displayName = 'Test User';

    // Mock Firebase Auth response (minimal required properties)
    const mockAuthUser = {
      uid: 'user123',
      email,
      displayName,
      emailVerified: false,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: 'mock-refresh-token',
      tenantId: null,
      delete: jest.fn().mockResolvedValue(undefined),
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      getIdTokenResult: jest.fn().mockResolvedValue({}),
      reload: jest.fn().mockResolvedValue(undefined),
      toJSON: jest.fn().mockReturnValue({}),
    } as any;

    mockCreateUser.mockResolvedValue({
      user: mockAuthUser,
    } as any);

    mockFirestoreService.getUser.mockResolvedValue({
      uid: 'user123',
      email,
      displayName,
      createdAt: new Date(),
      preferences: { language: 'en', notifications: true },
    });

    const response = await authService.register(email, password, displayName);

    expect(response.user).toHaveProperty('uid');
    expect(response.user.email).toBe(email);
    expect(response.user.displayName).toBe(displayName);
  });

  it('should transform scan data correctly', async () => {
    const userId = 'user123';
    const scanRequest = {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      language: 'en' as const,
    };

    mockFirestoreService.createScan.mockResolvedValue(undefined);

    const response = await scanService.createScan(userId, scanRequest);

    expect(response).toHaveProperty('scanId');
    expect(response).toHaveProperty('status');
    expect(response.status).toBe('pending');
  });
});

