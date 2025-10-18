import { RoomPhoto as PrismaRoomPhoto } from '@prisma/client';

/**
 * RoomPhoto Model
 * Represents an uploaded room photo
 */
export interface RoomPhoto extends PrismaRoomPhoto {}

export type PhotoStatus = 'processing' | 'completed' | 'failed';

export interface RoomDimensions {
  width: number;
  height: number;
  depth?: number;
}

export interface RoomSurface {
  type: 'floor' | 'wall' | 'ceiling';
  points: Array<{ x: number; y: number; z: number }>;
  normal: { x: number; y: number; z: number };
}

export interface CreateRoomPhotoInput {
  userId: string;
  filename: string;
  url: string;
  dimensions?: RoomDimensions;
  surfaces?: RoomSurface[];
}

export interface UpdateRoomPhotoInput {
  status?: PhotoStatus;
  dimensions?: RoomDimensions;
  surfaces?: RoomSurface[];
}

