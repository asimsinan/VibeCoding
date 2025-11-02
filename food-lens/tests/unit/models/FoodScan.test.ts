/**
 * FoodScan Model Tests
 * Tests for FoodScan data model class
 */

import { FoodScan } from '../../../src/lib/food-label-scanner/models/FoodScan';
import { NutritionInfo } from '../../../src/lib/food-label-scanner/models/NutritionInfo';
import { AllergenInfo } from '../../../src/lib/food-label-scanner/models/AllergenInfo';

describe('FoodScan Model', () => {
  const createImageMetadata = () => ({
    size: 1024 * 1024, // 1MB
    format: 'jpeg' as const,
    width: 1920,
    height: 1080,
    uploadedAt: new Date(),
  });

  describe('Constructor', () => {
    it('should create scan with valid data', () => {
      const scan = new FoodScan(
        'scan123',
        'user123',
        'https://example.com/image.jpg',
        createImageMetadata()
      );
      expect(scan.scanId).toBe('scan123');
      expect(scan.userId).toBe('user123');
      expect(scan.status).toBe('pending');
      // RED status
    });

    it('should validate scan ID format', () => {
      expect(() => {
        new FoodScan('scan 123', 'user123', 'https://example.com/image.jpg', createImageMetadata());
      }).toThrow();
      // RED status
    });

    it('should validate image URL', () => {
      expect(() => {
        new FoodScan('scan123', 'user123', 'invalid-url', createImageMetadata());
      }).toThrow('Image URL must be a valid URL');
      // RED status
    });

    it('should validate image size limit', () => {
      const largeMetadata = {
        ...createImageMetadata(),
        size: 11 * 1024 * 1024, // 11MB
      };
      expect(() => {
        new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', largeMetadata);
      }).toThrow('Image size cannot exceed');
      // RED status
    });
  });

  describe('Status Transitions', () => {
    it('should transition from pending to processing', () => {
      const scan = new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', createImageMetadata());
      scan.markAsProcessing();
      expect(scan.status).toBe('processing');
      // RED status
    });

    it('should transition from processing to completed', () => {
      const scan = new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', createImageMetadata(), 'en', 'processing');
      const nutritionData = new NutritionInfo('Test Food', '100g', 250, {
        protein: 10,
        carbs: 30,
        fat: 8,
        fiber: 5,
        sodium: 500,
        sugar: 15,
        saturatedFat: 3,
        transFat: 0,
      });
      const allergens = [new AllergenInfo('Gluten', 'high')];
      scan.markAsCompleted(nutritionData, allergens);
      expect(scan.status).toBe('completed');
      expect(scan.nutritionData).toBe(nutritionData);
      // RED status
    });

    it('should mark scan as failed', () => {
      const scan = new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', createImageMetadata());
      scan.markAsFailed({ code: 'PROCESSING_ERROR', message: 'Failed to process', timestamp: new Date() });
      expect(scan.status).toBe('failed');
      expect(scan.error).not.toBeNull();
      // RED status
    });
  });

  describe('Allergen Detection', () => {
    it('should detect high severity allergens', () => {
      const scan = new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', createImageMetadata());
      scan.allergens = [
        new AllergenInfo('Gluten', 'high'),
        new AllergenInfo('Dairy', 'low'),
      ];
      expect(scan.hasHighSeverityAllergens()).toBe(true);
      // RED status
    });

    it('should get primary allergens', () => {
      const scan = new FoodScan('scan123', 'user123', 'https://example.com/image.jpg', createImageMetadata());
      scan.allergens = [
        new AllergenInfo('Gluten', 'high'),
        new AllergenInfo('Dairy', 'low'),
      ];
      const primary = scan.getPrimaryAllergens();
      expect(primary.length).toBe(1);
      expect(primary[0].name).toBe('Gluten');
      // RED status
    });
  });
});

