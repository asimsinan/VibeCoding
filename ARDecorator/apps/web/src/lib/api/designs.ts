import { apiClient } from './client';
import type { FurnitureItem } from './furniture';

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  furnitureItem: FurnitureItem;
}

export interface Design {
  id: string;
  name: string;
  roomPhotoId: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  placedFurniture?: PlacedFurniture[];
  roomPhoto?: {
    id: string;
    url: string;
    filename: string;
  };
}

export interface CreateDesignRequest {
  name: string;
  roomPhotoId: string;
  furniture?: Array<{
    furnitureId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  }>;
}

export interface UpdateDesignRequest {
  name?: string;
  furniture?: Array<{
    furnitureId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  }>;
}

export const designsApi = {
  list: async (): Promise<Design[]> => {
    const response = await apiClient.get('/designs');
    return response.data;
  },

  getAll: async (): Promise<Design[]> => {
    const response = await apiClient.get('/designs');
    return response.data;
  },

  getById: async (id: string): Promise<Design> => {
    const response = await apiClient.get(`/designs/${id}`);
    return response.data;
  },

  create: async (data: CreateDesignRequest): Promise<Design> => {
    const response = await apiClient.post('/designs', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDesignRequest): Promise<Design> => {
    const response = await apiClient.put(`/designs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/designs/${id}`);
  },
};

