import { apiClient } from './client';

export interface RoomPhoto {
  id: string;
  userId: string;
  filename: string;
  url: string;
  dimensions?: any;
  surfaces?: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomPhotoRequest {
  filename: string;
  url: string;
  dimensions?: any;
  surfaces?: any;
}

export interface UpdateRoomPhotoRequest {
  status?: string;
  dimensions?: any;
  surfaces?: any;
  textureData?: any;
}

export const roomPhotosApi = {
  list: async (): Promise<RoomPhoto[]> => {
    const response = await apiClient.get('/room-photos');
    return response.data;
  },

  getById: async (id: string): Promise<RoomPhoto> => {
    try {
      const response = await apiClient.get(`/room-photos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room photo:', error);
      throw error;
    }
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

  deleteAll: async (): Promise<{ message: string; deletedCount: number }> => {
    const response = await apiClient.delete('/room-photos/bulk');
    return response.data;
  },

  reExtractTextures: async (id: string): Promise<{ success: boolean; textureData: any; dimensions: any }> => {
    const response = await apiClient.post(`/image-processing/analyze-room-photo/${id}`);
    return response.data;
  },
};

