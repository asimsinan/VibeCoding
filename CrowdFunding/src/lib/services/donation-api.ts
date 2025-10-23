import apiClient, { ApiResponse, PaginatedResponse } from '../api-client';

// Types
export interface Donation {
  id: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  campaignId: string;
  donorId: string;
  donor: {
    id: string;
    name: string;
    avatar?: string;
  };
  campaign: {
    id: string;
    title: string;
    ownerId: string;
  };
  createdAt: string;
}

export interface CreateDonationData {
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}

export interface DonationFilters {
  campaignId?: string;
  donorId?: string;
  page?: number;
  limit?: number;
}

export interface DonationStats {
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  topDonors: Array<{
    donorId: string;
    donorName: string;
    totalDonated: number;
    donationCount: number;
  }>;
}

// Donation API Service
export class DonationApiService {
  async getDonations(filters?: DonationFilters): Promise<PaginatedResponse<Donation>> {
    return apiClient.getPaginated('/donations', filters);
  }

  async getDonationById(id: string): Promise<ApiResponse<Donation>> {
    return apiClient.get(`/donations/${id}`);
  }

  async createDonation(campaignId: string, data: CreateDonationData): Promise<ApiResponse<Donation>> {
    return apiClient.post(`/campaigns/${campaignId}/donations`, data);
  }

  async getCampaignDonations(campaignId: string, page?: number, limit?: number): Promise<PaginatedResponse<Donation>> {
    return apiClient.getPaginated(`/campaigns/${campaignId}/donations`, { page, limit });
  }

  async getUserDonations(page?: number, limit?: number): Promise<PaginatedResponse<Donation>> {
    return apiClient.getPaginated('/donations/my', { page, limit });
  }

  async getDonationStats(): Promise<ApiResponse<DonationStats>> {
    return apiClient.get('/donations/stats');
  }

  async getRecentDonations(limit?: number): Promise<ApiResponse<Donation[]>> {
    return apiClient.get('/donations/recent', { params: { limit } });
  }

  async getTopDonors(limit?: number): Promise<ApiResponse<Array<{
    donorId: string;
    donorName: string;
    totalDonated: number;
    donationCount: number;
  }>>> {
    return apiClient.get('/donations/top-donors', { params: { limit } });
  }
}

// Create singleton instance
export const donationApiService = new DonationApiService();
