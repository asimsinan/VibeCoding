import { SharedDesign as PrismaSharedDesign } from '@prisma/client';

/**
 * SharedDesign Model
 * Represents a shareable design link
 */
export interface SharedDesign extends PrismaSharedDesign {}

export interface CreateSharedDesignInput {
  designId: string;
  userId: string;
  expiresAt: Date;
}

export interface SharedDesignView {
  design: {
    name: string;
    roomPhotoUrl: string;
    placedFurniture: any[];
    totalCost: number;
  };
  owner: {
    name: string;
  };
  sharedAt: Date;
}

