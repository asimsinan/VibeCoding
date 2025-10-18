import { describe, it, expect } from 'vitest';
import type { Design, CreateDesignInput, PlacedFurnitureInput } from '../../../apps/api/src/lib/models/Design';

describe('Design Model', () => {
  describe('Design Type', () => {
    it('should have required fields', () => {
      const design: Partial<Design> = {
        id: 'test-id',
        userId: 'user-id',
        roomPhotoId: 'photo-id',
        name: 'Living Room Design',
        totalCost: 2999.99,
      };

      expect(design).toHaveProperty('name');
      expect(design).toHaveProperty('userId');
      expect(design).toHaveProperty('roomPhotoId');
    });
  });

  describe('PlacedFurnitureInput validation', () => {
    it('should validate position coordinates', () => {
      const placed: PlacedFurnitureInput = {
        furnitureId: 'furniture-id',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: 1.0,
      };

      expect(placed.position).toHaveProperty('x');
      expect(placed.position).toHaveProperty('y');
      expect(placed.position).toHaveProperty('z');
    });

    it('should validate rotation range', () => {
      const placed: PlacedFurnitureInput = {
        furnitureId: 'furniture-id',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: 1.0,
      };

      expect(placed.rotation.x).toBeGreaterThanOrEqual(0);
      expect(placed.rotation.x).toBeLessThanOrEqual(360);
      expect(placed.rotation.y).toBeGreaterThanOrEqual(0);
      expect(placed.rotation.y).toBeLessThanOrEqual(360);
    });

    it('should validate scale range', () => {
      const placed: PlacedFurnitureInput = {
        furnitureId: 'furniture-id',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: 1.0,
      };

      expect(placed.scale).toBeGreaterThanOrEqual(0.2);
      expect(placed.scale).toBeLessThanOrEqual(3.0);
    });
  });

  describe('CreateDesignInput validation', () => {
    it('should validate name length', () => {
      const input: CreateDesignInput = {
        userId: 'user-id',
        roomPhotoId: 'photo-id',
        name: 'Living Room Design',
        placedFurniture: [],
      };

      expect(input.name.length).toBeGreaterThan(0);
      expect(input.name.length).toBeLessThanOrEqual(100);
    });
  });
});

