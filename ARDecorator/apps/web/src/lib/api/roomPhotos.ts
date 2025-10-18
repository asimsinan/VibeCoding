import { apiClient } from './client';

export interface RoomPhoto {
  id: string;
  userId: string;
  filename: string;
  url: string;
  dimensions: { width: number; height: number; depth: number } | null;
  surfaces: string[] | null;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface CreateRoomPhotoRequest {
  filename: string;
  url: string;
  dimensions?: { width: number; height: number; depth: number };
  surfaces?: string[];
}

export interface UpdateRoomPhotoRequest {
  dimensions?: { width: number; height: number; depth: number };
  surfaces?: string[];
  status?: 'processing' | 'completed' | 'failed';
}

export const roomPhotosApi = {
  getAll: async (): Promise<RoomPhoto[]> => {
    const response = await apiClient.get('/room-photos');
    return response.data;
  },

  getById: async (id: string): Promise<RoomPhoto> => {
    const response = await apiClient.get(`/room-photos/${id}`);
    return response.data;
  },

  create: async (data: CreateRoomPhotoRequest): Promise<RoomPhoto> => {
    const response = await apiClient.post('/room-photos', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRoomPhotoRequest): Promise<RoomPhoto> => {
    const response = await apiClient.put(`/room-photos/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/room-photos/${id}`);
  },
};

