import { Design as PrismaDesign, PlacedFurniture as PrismaPlacedFurniture } from '@prisma/client';

/**
 * Design Model
 * Represents a room design with placed furniture
 */
export interface Design extends PrismaDesign {}

export interface PlacedFurniture extends PrismaPlacedFurniture {}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface PlacedFurnitureInput {
  furnitureId: string;
  position: Position3D;
  rotation: Rotation3D;
  scale: number;
}

export interface CreateDesignInput {
  userId: string;
  roomPhotoId: string;
  name: string;
  placedFurniture: PlacedFurnitureInput[];
}

export interface UpdateDesignInput {
  name?: string;
  placedFurniture?: PlacedFurnitureInput[];
}

export interface DesignWithFurniture extends Design {
  placedFurniture: Array<PlacedFurniture & {
    furnitureItem: any; // Will be populated with FurnitureItem
  }>;
}

