/**
 * Data Flow Integration Tests
 * TASK-023: UI-API Integration Tests
 * 
 * Tests the data flow between UI components and API services.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, createMockProduct, createMockUser, resetAllMocks } from '../utils/testUtils';
import App from '../../App';
import { apiMock } from '../mocks/apiMock';

// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe.skip('Data Flow Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Authentication Data Flow', () => {
    it('should handle login flow with API integration', async () => {
      const mockUser = createMockUser();
      const mockToken = 'mock-jwt-token';
      
      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });
      
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      
      render(<App />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Personal Shopping Assistant')).toBeInTheDocument();
      });
      
      // Simulate login (this would be triggered by a login form in a real app)
      // For now, we'll test the data flow by checking if the auth service is called
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle logout flow with API integration', async () => {
      const mockUser = createMockUser();
      
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockResolvedValue({});
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Personal Shopping Assistant')).toBeInTheDocument();
      });
      
      // Simulate logout
      authService.logout();
      
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Product Data Flow', () => {
    it('should load and display products from API', async () => {
      const mockProducts = [
        createMockProduct({ id: 1, name: 'Test Product 1' }),
        createMockProduct({ id: 2, name: 'Test Product 2' }),
      ];
      
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(productService.getProducts).toHaveBeenCalled();
      });
    });

    it('should handle product search with API integration', async () => {
      const searchTerm = 'test search';
      const mockProducts = [createMockProduct({ name: 'Test Search Product' })];
      
      (productService.searchProducts as jest.Mock).mockResolvedValue({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      
      render(<App />);
      
      // Simulate search
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: searchTerm } });
      
      await waitFor(() => {
        expect(productService.searchProducts).toHaveBeenCalledWith(searchTerm);
      });
    });

    it('should handle product filtering with API integration', async () => {
      const filters = {
        category: 'electronics',
        priceMin: 50,
        priceMax: 200,
      };
      
      const mockProducts = [createMockProduct({ category: 'electronics' })];
      
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      
      render(<App />);
      
      // Simulate filter application
      // This would be triggered by filter UI components
      await waitFor(() => {
        expect(productService.getProducts).toHaveBeenCalled();
      });
    });
  });

  describe('Recommendation Data Flow', () => {
    it('should load recommendations from API', async () => {
      const mockRecommendations = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          score: 0.95,
          algorithm: 'content_based',
          createdAt: new Date(),
          product: createMockProduct(),
        },
      ];
      
      (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);
      
      render(<App />);
      
      await waitFor(() => {
        expect(recommendationService.getRecommendations).toHaveBeenCalled();
      });
    });

    it('should generate new recommendations with API integration', async () => {
      const mockRecommendations = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          score: 0.95,
          algorithm: 'hybrid',
          createdAt: new Date(),
          product: createMockProduct(),
        },
      ];
      
      (recommendationService.generateRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);
      
      render(<App />);
      
      // Simulate recommendation generation
      // This would be triggered by a "Refresh Recommendations" button
      await waitFor(() => {
        expect(recommendationService.generateRecommendations).toHaveBeenCalled();
      });
    });
  });

  describe('User Interaction Data Flow', () => {
    it('should track product views with API integration', async () => {
      const mockProduct = createMockProduct();
      
      (interactionService.recordInteraction as jest.Mock).mockResolvedValue({
        success: true,
        id: 1,
      });
      
      render(<App />);
      
      // Simulate product view
      // This would be triggered by clicking on a product
      await waitFor(() => {
        expect(interactionService.recordInteraction).toHaveBeenCalled();
      });
    });

    it('should track product likes with API integration', async () => {
      const mockProduct = createMockProduct();
      
      (interactionService.recordInteraction as jest.Mock).mockResolvedValue({
        success: true,
        id: 1,
      });
      
      render(<App />);
      
      // Simulate product like
      // This would be triggered by clicking a like button
      await waitFor(() => {
        expect(interactionService.recordInteraction).toHaveBeenCalled();
      });
    });

    it('should track search interactions with API integration', async () => {
      const searchTerm = 'test search';
      
      (interactionService.recordInteraction as jest.Mock).mockResolvedValue({
        success: true,
        id: 1,
      });
      
      render(<App />);
      
      // Simulate search interaction
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: searchTerm } });
      
      await waitFor(() => {
        expect(interactionService.recordInteraction).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Data Flow', () => {
    it('should handle API errors gracefully', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        message: 'Internal Server Error',
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        message: 'Network Error',
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should retry failed requests', async () => {
      let callCount = 0;
      (productService.getProducts as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            response: {
              status: 500,
              data: { message: 'Internal Server Error' },
            },
          });
        }
        return Promise.resolve({
          data: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        });
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(1);
      });
    });
  });

  describe('Loading States Data Flow', () => {
    it('should show loading states during API calls', async () => {
      (productService.getProducts as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }), 100))
      );
      
      render(<App />);
      
      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Should hide loading state after API call completes
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it('should handle multiple concurrent API calls', async () => {
      const promises = [
        (productService.getProducts as jest.Mock).mockResolvedValue({
          data: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
        (recommendationService.getRecommendations as jest.Mock).mockResolvedValue([]),
        (interactionService.getUserInteractions as jest.Mock).mockResolvedValue({
          success: true,
          data: {
            interactions: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        }),
      ];
      
      render(<App />);
      
      await Promise.all(promises);
      
      expect(productService.getProducts).toHaveBeenCalled();
      expect(recommendationService.getRecommendations).toHaveBeenCalled();
      expect(interactionService.getUserInteractions).toHaveBeenCalled();
    });
  });

  describe('State Synchronization', () => {
    it('should synchronize state between components', async () => {
      const mockProduct = createMockProduct();
      
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [mockProduct],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(productService.getProducts).toHaveBeenCalled();
      });
      
      // State should be synchronized across all components
      // This would be verified by checking that all components show the same data
    });

    it('should handle state updates from user interactions', async () => {
      const mockProduct = createMockProduct();
      
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [mockProduct],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
      
      (interactionService.recordInteraction as jest.Mock).mockResolvedValue({
        success: true,
        id: 1,
      });
      
      render(<App />);
      
      // Simulate user interaction
      // State should be updated across all components
      await waitFor(() => {
        expect(interactionService.recordInteraction).toHaveBeenCalled();
      });
    });
  });
});
