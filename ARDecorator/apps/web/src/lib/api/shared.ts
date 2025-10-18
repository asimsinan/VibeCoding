import { apiClient } from './client';
import type { Design } from './designs';

export interface SharedDesign {
  id: string;
  designId: string;
  shareToken: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  design: Design;
}

export interface CreateShareRequest {
  designId: string;
  expiresInDays?: number;
}

export const sharedApi = {
  getByToken: async (token: string): Promise<SharedDesign> => {
    const response = await apiClient.get(`/shared/${token}`);
    return response.data;
  },

  createShare: async (data: CreateShareRequest): Promise<SharedDesign> => {
    const response = await apiClient.post('/shared', data);
    return response.data;
  },
};

