import { describe, it, expect } from 'vitest';
import { FurniturePlacementEngine } from '../../../packages/3d-engine/src/furniture-placement';

describe('Furniture Placement Core Logic', () => {
  const engine = new FurniturePlacementEngine();

  describe('Position Validation', () => {
    it('should validate furniture position within room bounds', () => {
      const position = { x: 2.5, y: 0, z: 2.0 };
      const dimensions = { width: 1.0, height: 0.8, depth: 1.0 };
      const roomBounds = { width: 5.0, height: 3.0, depth: 4.0 };

      const isValid = engine.validatePosition(position, dimensions, roomBounds);
      expect(isValid).toBe(true);
    });

    it('should detect collision between furniture items', () => {
      const item1 = {
        id: '1',
        position: { x: 2.0, y: 0, z: 2.0 },
        rotation: 0,
        scale: 1.0,
        dimensions: { width: 1.0, height: 0.8, depth: 1.0 },
      };
      const item2 = {
        id: '2',
        position: { x: 2.5, y: 0, z: 2.0 },
        rotation: 0,
        scale: 1.0,
        dimensions: { width: 1.0, height: 0.8, depth: 1.0 },
      };

      const hasCollision = engine.detectCollision(item1, item2);
      expect(hasCollision).toBe(true);
    });

    it('should calculate optimal furniture placement', () => {
      const dimensions = { width: 1.0, height: 0.8, depth: 1.0 };
      const roomBounds = { width: 5.0, height: 3.0, depth: 4.0 };
      const existingItems: any[] = [];

      const position = engine.calculateOptimalPlacement(dimensions, roomBounds, existingItems);
      expect(position).not.toBeNull();
      expect(position?.x).toBeGreaterThanOrEqual(0);
      expect(position?.z).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scale Validation', () => {
    it('should enforce minimum scale limits (20%)', () => {
      const isValid = engine.validateScale(0.2);
      expect(isValid).toBe(true);

      const isTooSmall = engine.validateScale(0.1);
      expect(isTooSmall).toBe(false);
    });

    it('should enforce maximum scale limits (300%)', () => {
      const isValid = engine.validateScale(3.0);
      expect(isValid).toBe(true);

      const isTooLarge = engine.validateScale(3.5);
      expect(isTooLarge).toBe(false);
    });

    it('should maintain aspect ratio during scaling', () => {
      const originalDimensions = { width: 2.0, height: 1.0, depth: 1.5 };
      const scale = 1.5;

      const scaledDimensions = engine.maintainAspectRatio(originalDimensions, scale);
      expect(scaledDimensions.width).toBe(3.0);
      expect(scaledDimensions.height).toBe(1.5);
      expect(scaledDimensions.depth).toBe(2.25);
    });
  });

  describe('Rotation Logic', () => {
    it('should rotate furniture by specified angle', () => {
      const currentRotation = 45;
      const angle = 90;

      const newRotation = engine.rotateFurniture(currentRotation, angle);
      expect(newRotation).toBe(135);
    });

    it('should snap rotation to common angles (0, 90, 180, 270)', () => {
      expect(engine.snapRotation(5)).toBe(0);
      expect(engine.snapRotation(85)).toBe(90);
      expect(engine.snapRotation(175)).toBe(180);
      expect(engine.snapRotation(265)).toBe(270);
    });
  });
});

