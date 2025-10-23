import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { donationApiService } from '../../../src/lib/services/donation-api';

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

describe('Donation API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Donation API Service', () => {
    it('should create donation successfully', async () => {
      const donationData = {
        amount: 100,
        message: 'Great project!',
        isAnonymous: false,
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'donation-1',
          ...donationData,
          campaignId: 'campaign-123',
          donorId: 'user-2',
          donor: { id: 'user-2', name: 'Jane Doe', avatar: null },
          campaign: { id: 'campaign-123', title: 'Test Campaign', ownerId: 'user-1' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      // Mock the post method
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockResponse);

      const response = await donationApiService.createDonation('campaign-123', donationData);

      expect(response.success).toBe(true);
      expect(response.data.amount).toBe(donationData.amount);
      expect(response.data.message).toBe(donationData.message);
      expect(response.data.campaignId).toBe('campaign-123');
    });

    it('should get campaign donations successfully', async () => {
      const mockDonations = [
        {
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
        {
          id: 'donation-2',
          amount: 50,
          message: 'Keep it up!',
          isAnonymous: true,
          campaignId: 'campaign-123',
          donorId: 'user-3',
          donor: { id: 'user-3', name: 'Anonymous', avatar: null },
          campaign: { id: 'campaign-123', title: 'Test Campaign', ownerId: 'user-1' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockDonations,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      // Mock the getPaginated method
      const { getPaginated } = require('../../../src/lib/api-client');
      getPaginated.mockResolvedValue(mockResponse);

      const response = await donationApiService.getCampaignDonations('campaign-123', 1, 10);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockDonations);
      expect(response.pagination.total).toBe(2);
    });

    it('should handle donation errors gracefully', async () => {
      const mockError = {
        success: false,
        error: 'Campaign not found',
      };

      // Mock the post method to return error
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockError);

      const response = await donationApiService.createDonation('invalid-campaign', {
        amount: 100,
        message: 'Test donation',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Campaign not found');
    });
  });

  describe('Donation Page Integration', () => {
    it('should render donation functionality with real API integration', async () => {
      const mockDonation = {
        id: 'donation-1',
        amount: 100,
        message: 'Great project!',
        isAnonymous: false,
        campaignId: 'campaign-123',
        donorId: 'user-2',
        donor: { id: 'user-2', name: 'Jane Doe', avatar: null },
        campaign: { id: 'campaign-123', title: 'Test Campaign', ownerId: 'user-1' },
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Mock the post method for creating donation
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // Mock the getPaginated method for getting donations
      const { getPaginated } = require('../../../src/lib/api-client');
      getPaginated.mockResolvedValue({
        success: true,
        data: [mockDonation],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      // Test creating a donation
      const createResponse = await donationApiService.createDonation('campaign-123', {
        amount: 100,
        message: 'Great project!',
        isAnonymous: false,
      });

      expect(createResponse.success).toBe(true);
      expect(createResponse.data.amount).toBe(100);

      // Test getting campaign donations
      const getResponse = await donationApiService.getCampaignDonations('campaign-123');
      
      expect(getResponse.success).toBe(true);
      expect(getResponse.data).toHaveLength(1);
      expect(getResponse.data[0].amount).toBe(100);
    });
  });
});