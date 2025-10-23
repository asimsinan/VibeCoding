import apiClient, { ApiResponse, PaginatedResponse } from '../api-client';

// Types
export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  deadline: string;
  category: 'TECHNOLOGY' | 'ART' | 'EDUCATION' | 'HEALTH' | 'ENVIRONMENT' | 'OTHER';
  status: 'DRAFT' | 'ACTIVE' | 'OPEN' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
  images: string[];
  isFeatured: boolean;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  goal: number;
  deadline: string;
  category: 'TECHNOLOGY' | 'ART' | 'EDUCATION' | 'HEALTH' | 'ENVIRONMENT' | 'OTHER';
  imageUrl?: string;
}

export interface UpdateCampaignData {
  title?: string;
  description?: string;
  goal?: number;
  deadline?: string;
  category?: 'TECHNOLOGY' | 'ART' | 'EDUCATION' | 'HEALTH' | 'ENVIRONMENT' | 'OTHER';
  imageUrl?: string;
}

export interface CampaignFilters {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRaised: number;
  averageGoal: number;
}

// Campaign API Service
export class CampaignApiService {
  async getCampaigns(filters?: CampaignFilters): Promise<PaginatedResponse<Campaign>> {
    return apiClient.getPaginated('/campaigns', filters);
  }

  async getCampaignById(id: string): Promise<ApiResponse<Campaign>> {
    return apiClient.get(`/campaigns/${id}`);
  }

  async createCampaign(data: CreateCampaignData): Promise<ApiResponse<Campaign>> {
    return apiClient.post('/campaigns', data);
  }

  async updateCampaign(id: string, data: UpdateCampaignData): Promise<ApiResponse<Campaign>> {
    return apiClient.put(`/campaigns/${id}`, data);
  }

  async deleteCampaign(id: string): Promise<ApiResponse> {
    return apiClient.delete(`/campaigns/${id}`);
  }

  async getCampaignStats(): Promise<ApiResponse<CampaignStats>> {
    return apiClient.get('/campaigns/stats');
  }

  async searchCampaigns(query: string, filters?: Omit<CampaignFilters, 'search'>): Promise<PaginatedResponse<Campaign>> {
    return apiClient.getPaginated('/campaigns', { ...filters, search: query });
  }

  async getFeaturedCampaigns(): Promise<{ success: boolean; data?: Campaign[]; error?: string }> {
    return apiClient.get('/campaigns/featured');
  }

  async getTrendingCampaigns(): Promise<{ success: boolean; data?: Campaign[]; error?: string }> {
    return apiClient.get('/campaigns/trending');
  }

  async uploadCampaignImage(campaignId: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ imageUrl: string }>> {
    return apiClient.uploadFile(`/campaigns/${campaignId}/image`, file, onProgress);
  }
}

// Create singleton instance
export const campaignApiService = new CampaignApiService();
