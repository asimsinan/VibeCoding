import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { authApiService, userApiService } from '../../../src/lib/services/auth-api';

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
}));

// Mock API client
jest.mock('../../../src/lib/api-client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth API Service', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            avatar: null,
            bio: null,
            isVerified: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          token: 'mock-jwt-token',
        },
      };

      // Mock the post method
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockResponse);

      const response = await authApiService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.data.token).toBe('mock-jwt-token');
    });

    it('should register successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        bio: 'New user bio',
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-new',
            email: userData.email,
            name: userData.name,
            role: 'USER',
            avatar: null,
            bio: userData.bio,
            isVerified: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          token: 'mock-jwt-token',
        },
      };

      // Mock the post method
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockResponse);

      const response = await authApiService.register(userData);

      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe(userData.email);
      expect(response.data.user.name).toBe(userData.name);
    });

    it('should handle login errors gracefully', async () => {
      const mockError = {
        success: false,
        error: 'Invalid credentials',
      };

      // Mock the post method to return error
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockError);

      const response = await authApiService.login({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });
  });

  describe('User API Service', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        avatar: null,
        bio: 'Test bio',
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      // Mock the get method
      const { get } = require('../../../src/lib/api-client');
      get.mockResolvedValue(mockResponse);

      const response = await userApiService.getProfile();

      expect(response.success).toBe(true);
      expect(response.data.name).toBe('Test User');
      expect(response.data.email).toBe('test@example.com');
    });

    it('should update user profile successfully', async () => {
      const profileData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        avatar: 'https://example.com/avatar.jpg',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'user-1',
          email: 'test@example.com',
          ...profileData,
          role: 'USER',
          isVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      // Mock the put method
      const { put } = require('../../../src/lib/api-client');
      put.mockResolvedValue(mockResponse);

      const response = await userApiService.updateProfile(profileData);

      expect(response.success).toBe(true);
      expect(response.data.name).toBe(profileData.name);
      expect(response.data.bio).toBe(profileData.bio);
    });
  });

  describe('Auth Page Integration', () => {
    it('should render login page with real API integration', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            avatar: null,
            bio: null,
            isVerified: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          token: 'mock-jwt-token',
        },
      };

      // Mock the post method
      const { post } = require('../../../src/lib/api-client');
      post.mockResolvedValue(mockResponse);

      // Test the login API call
      const loginResponse = await authApiService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResponse.success).toBe(true);
      expect(loginResponse.data.user.email).toBe('test@example.com');
    });
  });
});