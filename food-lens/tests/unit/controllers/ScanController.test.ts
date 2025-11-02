import { ScanController } from '../../../src/lib/food-label-scanner/services/controllers/ScanController';
import { scanService } from '../../../src/lib/food-label-scanner/services/api/ScanService';
import { FoodScan, ImageMetadata } from '../../../src/lib/food-label-scanner/models/FoodScan';
import { ValidationError } from '../../../src/lib/food-label-scanner/utils/errors';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';
import { AllergenInfo } from '../../../src/lib/food-label-scanner/models/AllergenInfo';

// Mock FirestoreService
jest.mock('../../../src/lib/food-label-scanner/services/database/FirestoreService', () => ({
  firestoreService: {
    initialize: jest.fn(() => Promise.resolve()),
    createScan: jest.fn(() => Promise.resolve()),
    getScan: jest.fn(() => Promise.resolve(null)),
    getScansByUser: jest.fn(() => Promise.resolve([])),
    deleteScan: jest.fn(() => Promise.resolve()),
    updateScan: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../../src/lib/food-label-scanner/services/api/ScanService');

describe('ScanController', () => {
  let controller: ScanController;
  const mockScanService = scanService as jest.Mocked<typeof scanService>;

  beforeEach(() => {
    controller = new ScanController();
    jest.clearAllMocks();
  });

  describe('Request Handling', () => {
    it('should handle scan creation request with valid image', async () => {
      const mockResponse = {
        scanId: 'scan123',
        status: 'pending' as const,
        message: 'Scan accepted for processing',
      };

      mockScanService.createScan.mockResolvedValue(mockResponse);

      const result = await controller.createScan({
        userId: 'user123',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        language: 'en',
      });

      expect(mockScanService.createScan).toHaveBeenCalledWith('user123', {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        language: 'en',
      });
      expect(result.success).toBe(true);
      expect(result.data?.scanId).toBe('scan123');
    });

    it('should handle get scan request', async () => {
      const mockScan = createMockScan();
      mockScanService.getScan.mockResolvedValue(mockScan);

      const result = await controller.getScan('scan123');

      expect(mockScanService.getScan).toHaveBeenCalledWith('scan123');
      expect(result.success).toBe(true);
      expect(result.data?.scanId).toBe('scan123');
    });

    it('should handle get scan history request with pagination', async () => {
      const mockScans = [createMockScan(), createMockScan()];
      mockScanService.getScanHistory.mockResolvedValue(mockScans);

      const result = await controller.getScanHistory({
        userId: 'user123',
        page: 1,
        limit: 20,
      });

      expect(mockScanService.getScanHistory).toHaveBeenCalledWith('user123', 1, 20);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle delete scan request', async () => {
      mockScanService.deleteScan.mockResolvedValue(undefined);

      const result = await controller.deleteScan('scan123');

      expect(mockScanService.deleteScan).toHaveBeenCalledWith('scan123');
      expect(result.success).toBe(true);
    });

    it('should handle process scan request', async () => {
      mockScanService.processScan.mockResolvedValue(undefined);

      const result = await controller.processScan('scan123');

      expect(mockScanService.processScan).toHaveBeenCalledWith('scan123');
      expect(result.success).toBe(true);
    });
  });

  describe('Response Formatting', () => {
    it('should format successful scan creation response', async () => {
      const mockResponse = {
        scanId: 'scan123',
        status: 'pending' as const,
        message: 'Scan accepted for processing',
      };

      mockScanService.createScan.mockResolvedValue(mockResponse);

      const result = await controller.createScan({
        userId: 'user123',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        language: 'en',
      });

      expect(result.success).toBe(true);
      expect(result.data?.scanId).toBe('scan123');
      expect(result.data?.status).toBe('pending');
      expect(result.data?.message).toBe('Scan accepted for processing');
    });

    it('should format scan data response with nutrition info', async () => {
      const mockScan = createMockScan();
      mockScan.markAsProcessing();
      mockScan.markAsCompleted(
        new NutritionInfo('Food', '100g', 250, {
          protein: 10,
          carbs: 30,
          fat: 8,
          fiber: 5,
          sodium: 500,
          sugar: 15,
          saturatedFat: 3,
          transFat: 0,
        }),
        [new AllergenInfo('Gluten', 'high', 'Contains wheat')]
      );
      mockScanService.getScan.mockResolvedValue(mockScan);

      const result = await controller.getScan('scan123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.nutritionData).toBeDefined();
      expect(result.data?.allergens).toBeDefined();
    });

    it('should format scan history response with array', async () => {
      const mockScans = [createMockScan(), createMockScan()];
      mockScanService.getScanHistory.mockResolvedValue(mockScans);

      const result = await controller.getScanHistory({
        userId: 'user123',
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Error Management', () => {
    it('should format validation error for invalid image', async () => {
      mockScanService.createScan.mockRejectedValue(
        new Error('Invalid image format. Only JPEG and PNG are supported.')
      );

      const result = await controller.createScan({
        userId: 'user123',
        image: 'invalid-image',
        language: 'en',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid image format');
    });

    it('should format error for image size exceeding limit', async () => {
      mockScanService.createScan.mockRejectedValue(
        new Error('Image size exceeds 10MB limit')
      );

      const result = await controller.createScan({
        userId: 'user123',
        image: 'data:image/jpeg;base64,' + 'A'.repeat(15 * 1024 * 1024),
        language: 'en',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Image size exceeds');
    });

    it('should format error for scan not found', async () => {
      mockScanService.getScan.mockResolvedValue(null);

      const result = await controller.getScan('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toContain('Scan not found');
    });

    it('should format error for processing failure', async () => {
      mockScanService.processScan.mockRejectedValue(
        new Error('AI processing failed')
      );

      const result = await controller.processScan('scan123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('AI processing failed');
    });

    it('should handle service unavailable errors gracefully', async () => {
      mockScanService.createScan.mockRejectedValue(
        new Error('Service unavailable')
      );

      const result = await controller.createScan({
        userId: 'user123',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        language: 'en',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  function createMockScan(): FoodScan {
    const metadata: ImageMetadata = {
      size: 1024,
      format: 'jpeg',
      width: 1920,
      height: 1080,
      uploadedAt: new Date(),
    };

    return new FoodScan(
      'scan123',
      'user123',
      'https://storage.googleapis.com/scans/scan123.jpg',
      metadata,
      'en',
      'pending'
    );
  }
});
