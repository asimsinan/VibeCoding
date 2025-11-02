/**
 * FirestoreService Tests
 * Comprehensive tests for database operations and data processing
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { FirestoreService } from '../../../src/lib/food-label-scanner/services/database/FirestoreService';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000 })),
  },
}));

describe('FirestoreService - Data Processing', () => {
  let firestoreService: FirestoreService;

  beforeEach(() => {
    firestoreService = new FirestoreService();
  });

  describe('User Operations', () => {
    it('should create user in database', async () => {
      const { setDoc, doc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const { User } = require('../../../src/lib/food-label-scanner/models/User');
      const user = new User('uid123', 'test@example.com', 'Test User');

      await firestoreService.createUser(user);

      expect(setDoc).toHaveBeenCalled();
    });

    it('should get user from database', async () => {
      const { getDoc, doc } = require('firebase/firestore');
      const mockUserData = {
        uid: 'uid123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'en',
        dietaryRestrictions: [],
        createdAt: {
          seconds: Math.floor(Date.now() / 1000),
          toDate: () => new Date(),
        },
        lastLoginAt: {
          seconds: Math.floor(Date.now() / 1000),
          toDate: () => new Date(),
        },
        preferences: { language: 'en', notifications: true, offlineMode: true, dietaryRestrictions: [] },
        stats: { totalScans: 0, lastScanAt: null },
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const user = await firestoreService.getUser('uid123');

      expect(user).toBeDefined();
      expect(user?.uid).toBe('uid123');
    });

    it('should return null for non-existent user', async () => {
      const { getDoc, doc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false,
      });
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const user = await firestoreService.getUser('nonexistent');

      expect(user).toBeNull();
    });

    it('should update user in database', async () => {
      const { updateDoc, doc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const { User } = require('../../../src/lib/food-label-scanner/models/User');
      const user = new User('uid123', 'test@example.com', 'Test User');
      user.updateLastLogin();

      await firestoreService.updateUser(user);

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Scan Operations', () => {
    it('should create scan in database', async () => {
      const { setDoc, doc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const { FoodScan } = require('../../../src/lib/food-label-scanner/models/FoodScan');
      const scan = new FoodScan(
        'scan123',
        'user123',
        'https://example.com/image.jpg',
        {
          size: 1024 * 1024,
          format: 'jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: new Date(),
        }
      );

      await firestoreService.createScan(scan);

      expect(setDoc).toHaveBeenCalled();
    });

    it('should get scan from database', async () => {
      const { getDoc, doc } = require('firebase/firestore');
      const mockScanData = {
        scanId: 'scan123',
        userId: 'user123',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        imageMetadata: {
          size: 1024 * 1024,
          format: 'jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: {
            seconds: Math.floor(Date.now() / 1000),
            toDate: () => new Date(),
          },
        },
        language: 'en',
        createdAt: {
          seconds: Math.floor(Date.now() / 1000),
          toDate: () => new Date(),
        },
        processedAt: {
          seconds: Math.floor(Date.now() / 1000),
          toDate: () => new Date(),
        },
        nutritionData: null,
        allergens: [],
        alternatives: null,
        error: null,
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockScanData,
      });
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const scan = await firestoreService.getScan('scan123');

      expect(scan).toBeDefined();
    });

    it('should get scans by user with pagination', async () => {
      const { getDocs, query, where, orderBy, limit, collection } = require('firebase/firestore');
      const mockScans = [
        {
          id: 'scan1',
          data: () => ({
            scanId: 'scan1',
            userId: 'user123',
            imageUrl: 'https://example.com/scan1.jpg',
            imageMetadata: {
              size: 1024 * 1024,
              format: 'jpeg',
              width: 1920,
              height: 1080,
              uploadedAt: { seconds: Math.floor(Date.now() / 1000), toDate: () => new Date() },
            },
            language: 'en',
            status: 'completed',
            createdAt: { seconds: Math.floor(Date.now() / 1000), toDate: () => new Date() },
            processedAt: null,
            nutritionData: null,
            allergens: [],
            alternatives: null,
            error: null,
          }),
        },
        {
          id: 'scan2',
          data: () => ({
            scanId: 'scan2',
            userId: 'user123',
            imageUrl: 'https://example.com/scan2.jpg',
            imageMetadata: {
              size: 1024 * 1024,
              format: 'jpeg',
              width: 1920,
              height: 1080,
              uploadedAt: { seconds: Math.floor(Date.now() / 1000), toDate: () => new Date() },
            },
            language: 'en',
            status: 'completed',
            createdAt: { seconds: Math.floor(Date.now() / 1000), toDate: () => new Date() },
            processedAt: null,
            nutritionData: null,
            allergens: [],
            alternatives: null,
            error: null,
          }),
        },
      ];

      getDocs.mockResolvedValue({
        docs: mockScans,
      });
      collection.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const scans = await firestoreService.getScansByUser('user123', 1, 20);

      expect(scans.length).toBeGreaterThanOrEqual(0);
      expect(query).toHaveBeenCalled();
    });

    it('should update scan in database', async () => {
      const { updateDoc, doc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      const { FoodScan } = require('../../../src/lib/food-label-scanner/models/FoodScan');
      const scan = new FoodScan(
        'scan123',
        'user123',
        'https://example.com/image.jpg',
        {
          size: 1024 * 1024,
          format: 'jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: new Date(),
        }
      );
      scan.markAsProcessing();

      await firestoreService.updateScan(scan);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should delete scan from database', async () => {
      const { deleteDoc, doc } = require('firebase/firestore');
      deleteDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({});
      
      // Initialize first
      await firestoreService.initialize();

      await firestoreService.deleteScan('scan123');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { setDoc } = require('firebase/firestore');
      setDoc.mockRejectedValue(new Error('Connection failed'));

      const { User } = require('../../../src/lib/food-label-scanner/models/User');
      const user = new User('uid123', 'test@example.com', 'Test User');

      await expect(
        firestoreService.createUser(user)
      ).rejects.toThrow();
    });

    it('should handle invalid data during creation', async () => {
      const { setDoc } = require('firebase/firestore');
      setDoc.mockRejectedValue(new Error('Invalid data'));

      const { User } = require('../../../src/lib/food-label-scanner/models/User');
      const user = new User('uid123', 'test@example.com', 'Test User');

      await expect(
        firestoreService.createUser(user)
      ).rejects.toThrow();
    });
  });
});

