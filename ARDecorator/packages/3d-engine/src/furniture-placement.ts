export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface FurniturePlacement {
  id: string;
  position: Position;
  rotation: number;
  scale: number;
  dimensions: Dimensions;
}

export interface RoomBounds {
  width: number;
  height: number;
  depth: number;
}

export class FurniturePlacementEngine {
  private readonly MIN_SCALE = 0.2;
  private readonly MAX_SCALE = 3.0;
  private readonly SNAP_ANGLES = [0, 90, 180, 270];

  validatePosition(position: Position, dimensions: Dimensions, roomBounds: RoomBounds): boolean {
    const halfWidth = dimensions.width / 2;
    const halfDepth = dimensions.depth / 2;

    return (
      position.x - halfWidth >= 0 &&
      position.x + halfWidth <= roomBounds.width &&
      position.z - halfDepth >= 0 &&
      position.z + halfDepth <= roomBounds.depth &&
      position.y >= 0 &&
      position.y <= roomBounds.height
    );
  }

  detectCollision(item1: FurniturePlacement, item2: FurniturePlacement): boolean {
    const box1 = this.getBoundingBox(item1);
    const box2 = this.getBoundingBox(item2);

    return (
      box1.minX < box2.maxX &&
      box1.maxX > box2.minX &&
      box1.minY < box2.maxY &&
      box1.maxY > box2.minY &&
      box1.minZ < box2.maxZ &&
      box1.maxZ > box2.minZ
    );
  }

  private getBoundingBox(item: FurniturePlacement) {
    const scaledWidth = item.dimensions.width * item.scale;
    const scaledHeight = item.dimensions.height * item.scale;
    const scaledDepth = item.dimensions.depth * item.scale;

    return {
      minX: item.position.x - scaledWidth / 2,
      maxX: item.position.x + scaledWidth / 2,
      minY: item.position.y,
      maxY: item.position.y + scaledHeight,
      minZ: item.position.z - scaledDepth / 2,
      maxZ: item.position.z + scaledDepth / 2,
    };
  }

  calculateOptimalPlacement(
    dimensions: Dimensions,
    roomBounds: RoomBounds,
    existingItems: FurniturePlacement[]
  ): Position | null {
    const gridSize = 0.5;
    const attempts = 100;

    for (let i = 0; i < attempts; i++) {
      const x = Math.floor(Math.random() * (roomBounds.width / gridSize)) * gridSize;
      const z = Math.floor(Math.random() * (roomBounds.depth / gridSize)) * gridSize;
      const position: Position = { x, y: 0, z };

      const testItem: FurniturePlacement = {
        id: 'test',
        position,
        rotation: 0,
        scale: 1,
        dimensions,
      };

      if (this.validatePosition(position, dimensions, roomBounds)) {
        const hasCollision = existingItems.some((item) => this.detectCollision(testItem, item));
        if (!hasCollision) {
          return position;
        }
      }
    }

    return null;
  }

  validateScale(scale: number): boolean {
    return scale >= this.MIN_SCALE && scale <= this.MAX_SCALE;
  }

  enforceScaleLimits(scale: number): number {
    return Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale));
  }

  maintainAspectRatio(originalDimensions: Dimensions, scale: number): Dimensions {
    return {
      width: originalDimensions.width * scale,
      height: originalDimensions.height * scale,
      depth: originalDimensions.depth * scale,
    };
  }

  rotateFurniture(currentRotation: number, angle: number): number {
    return (currentRotation + angle) % 360;
  }

  snapRotation(rotation: number, threshold: number = 15): number {
    for (const snapAngle of this.SNAP_ANGLES) {
      if (Math.abs(rotation - snapAngle) <= threshold) {
        return snapAngle;
      }
    }
    return rotation;
  }
}

