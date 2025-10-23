import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import apiClient from '../lib/api-client';
import { authApiService, userApiService } from '../lib/services/auth-api';
import { campaignApiService } from '../lib/services/campaign-api';
import { donationApiService } from '../lib/services/donation-api';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  UserProfile,
  Campaign,
  CreateCampaignData,
  UpdateCampaignData,
  CampaignFilters,
  Donation,
  CreateDonationData,
  DonationFilters
} from '../lib/services';

// Auth hooks
export function useLogin() {
  return useApi<User>('/auth/login');
}

export function useRegister() {
  return useApi<User>('/auth/register');
}

export function useLogout() {
  return useApi<void>('/auth/logout');
}

export function useChangePassword() {
  return useApi<void>('/auth/change-password');
}

// User hooks
export function useUserProfile() {
  return useApi<User>('/users/profile');
}

export function useUpdateProfile() {
  return useApi<User>('/users/profile');
}

export function useUserStats() {
  return useApi('/users/stats');
}

// Campaign hooks
export function useCampaigns(filters?: CampaignFilters) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await campaignApiService.getCampaigns(filters);
      if (response.success) {
        setData(response);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useCampaign(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching campaign:', id);
      const response = await apiClient.get(`/campaign-by-id?id=${id}`);
      console.log('Campaign response:', response);
      if (response.success) {
        setData(response);
      } else {
        setError(response.error || 'Failed to fetch campaign');
      }
    } catch (err) {
      console.error('Campaign fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useCreateCampaign() {
  return useApi<Campaign>('/campaigns');
}

export function useUpdateCampaign() {
  return useApi<Campaign>('/campaigns');
}

export function useDeleteCampaign() {
  return useApi<void>('/campaigns');
}

export function useFeaturedCampaigns() {
  const [data, setData] = useState<Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await campaignApiService.getFeaturedCampaigns();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch featured campaigns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useTrendingCampaigns() {
  const [data, setData] = useState<Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await campaignApiService.getTrendingCampaigns();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch trending campaigns');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Donation hooks
export function useDonations(filters?: DonationFilters) {
  const queryString = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
  return useApi(`/donations${queryString}`);
}

export function useCreateDonation() {
  return useApi<Donation>('/donations');
}

export function useCampaignDonations(campaignId: string, page?: number, limit?: number) {
  let endpoint = `/campaign-donations?campaignId=${campaignId}`;
  if (page && limit) {
    endpoint += `&page=${page}&limit=${limit}`;
  }
  return useApi(endpoint);
}

export function useUserDonations(page?: number, limit?: number) {
  const queryString = page && limit ? `?page=${page}&limit=${limit}` : '';
  return useApi(`/users/donations${queryString}`);
}

export function useRecentDonations(limit?: number) {
  const queryString = limit ? `?limit=${limit}` : '';
  return useApi(`/donations/recent${queryString}`);
}

export function useTopDonors(limit?: number) {
  const queryString = limit ? `?limit=${limit}` : '';
  return useApi(`/donations/top-donors${queryString}`);
}

// User campaigns hook
export function useMyCampaigns(filters?: { status?: string; page?: number; limit?: number }) {
  // Check if user is authenticated before making API call
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  // Always call useApi hook to maintain hook order
  let endpoint = '/user-campaigns/my-campaigns';
  
  if (filters) {
    // Filter out empty values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
    );
    
    const queryString = Object.keys(cleanFilters).length > 0 
      ? `?${new URLSearchParams(cleanFilters as any).toString()}` 
      : '';
      
    endpoint = `/user-campaigns/my-campaigns${queryString}`;
  }
  
  const result = useApi(endpoint);
  
  // Return appropriate result based on authentication
  if (!token) {
    return { data: null, loading: false, error: null, refetch: () => {} };
  }
  
  return result;
}

// Platform stats hook
export function usePlatformStats() {
  return useApi('/stats');
}
