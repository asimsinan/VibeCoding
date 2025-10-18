import { apiClient } from './client';

export interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  modelUrl: string;
  thumbnailUrl: string;
}

export interface FurnitureFilters {
  category?: string;
  style?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface CreateFurnitureRequest {
  name: string;
  description?: string;
  category: string;
  style?: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  modelUrl: string;
  thumbnailUrl: string;
}

export const furnitureApi = {
  list: async (filters?: FurnitureFilters): Promise<FurnitureItem[]> => {
    const response = await apiClient.get('/furniture', { params: filters });
    return response.data;
  },

  getAll: async (filters?: FurnitureFilters): Promise<FurnitureItem[]> => {
    const response = await apiClient.get('/furniture', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<FurnitureItem> => {
    const response = await apiClient.get(`/furniture/${id}`);
    return response.data;
  },

  create: async (data: CreateFurnitureRequest): Promise<FurnitureItem> => {
    const response = await apiClient.post('/furniture', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateFurnitureRequest>): Promise<FurnitureItem> => {
    const response = await apiClient.put(`/furniture/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/furniture/${id}`);
  },

  search: async (query: string): Promise<FurnitureItem[]> => {
    const response = await apiClient.get('/furniture/search', { params: { q: query } });
    return response.data;
  },
};

