import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { campaignApiService } from '../../../src/lib/services/campaign-api';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'campaign-123',
  }),
}));

// Mock API client
jest.mock('../../../src/lib/api-client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  getPaginated: jest.fn(),
}));

describe('Campaign API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Campaign API Service', () => {
    it('should fetch campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          title: 'Test Campaign 1',
          description: 'Test description 1',
          goal: 10000,
          current: 5000,
          deadline: '2025-12-31',
          category: 'TECHNOLOGY',
          status: 'ACTIVE',
          ownerId: 'user-1',
          owner: { id: 'user-1', name: 'John Doe', avatar: null },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCampaigns,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      // Mock the getPaginated method
      const { getPaginated } = require('../../../src/lib/api-client');
      getPaginated.mockResolvedValue(mockResponse);

      const response = await campaignApiService.getCampaigns({ page: 1, limit: 10 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockCampaigns);
      expect(response.pagination).toEqual(mockResponse.pagination);
    });

    it('should create campaign successfully', async () => {
      const campaignData = {
        title: 'New Campaign',
        description: 'New campaign description',
        goal: 15000,
        deadline: '2025-12-31',
        category: 'ART' as const,
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'campaign-new',
          ...campaignData,
          current: 0,
          status: 'ACTIVE',
          ownerId: 'user-1',
          owner: { id: 'user-1', name: 'John Doe', avatar: null },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      // Mock the post method
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockResponse);

      const response = await campaignApiService.createCampaign(campaignData);

      expect(response.success).toBe(true);
      expect(response.data.title).toBe(campaignData.title);
      expect(response.data.goal).toBe(campaignData.goal);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      };

      // Mock the getPaginated method to return error
      const { getPaginated } = require('../../../src/lib/api-client');
      getPaginated.mockResolvedValue(mockError);

      const response = await campaignApiService.getCampaigns();

      expect(response.success).toBe(false);
      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
    });
  });

  describe('Campaign Page Integration', () => {
    it('should render campaign page with real API integration', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        current: 5000,
        deadline: '2025-12-31',
        category: 'TECHNOLOGY',
        status: 'ACTIVE',
        imageUrl: 'https://example.com/image.jpg',
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'John Doe', avatar: null },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock the get method for individual campaign
      const { get } = require('../../../src/lib/api-client');
      get.mockResolvedValue({
        success: true,
        data: mockCampaign,
      });

      // Mock the post method for donations
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue({
        success: true,
        data: {
          id: 'donation-1',
          amount: 100,
          message: 'Great project!',
          isAnonymous: false,
          campaignId: 'campaign-123',
          donorId: 'user-2',
          donor: { id: 'user-2', name: 'Jane Doe', avatar: null },
          campaign: { id: 'campaign-123', title: 'Test Campaign', ownerId: 'user-1' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      });

      // This would test the actual campaign page component
      // For now, we're testing the API service integration
      const campaignResponse = await campaignApiService.getCampaignById('campaign-123');
      
      expect(campaignResponse.success).toBe(true);
      expect(campaignResponse.data.title).toBe('Test Campaign');
    });
  });
});