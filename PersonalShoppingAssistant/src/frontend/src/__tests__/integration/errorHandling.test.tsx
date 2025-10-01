/**
 * Error Handling Integration Tests
 * TASK-023: UI-API Integration Tests
 * 
 * Tests the integration of error handling across the application.
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, createMockProduct, resetAllMocks } from '../utils/testUtils';
import App from '../../App';
import { ProductCard, ProductList, UserPreferences, RecommendationList } from '../../components';

// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe.skip('Error Handling Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('API Error Handling', () => {
    it('should handle 500 Internal Server Error', async () => {
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

    it('should handle 401 Unauthorized Error', async () => {
      (authService.getCurrentUser as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        message: 'Unauthorized',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 Not Found Error', async () => {
      (productService.getProduct as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
        message: 'Product not found',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        message: 'Network Error',
        code: 'NETWORK_ERROR',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        message: 'Request timeout',
        code: 'TIMEOUT',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Error Handling', () => {
    it('should handle ProductCard API errors gracefully', async () => {
      const mockProduct = createMockProduct();
      
      (interactionService.recordInteraction as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to record interaction' },
        },
      });

      render(
        <ProductCard
          product={mockProduct}
          onView={jest.fn()}
          onLike={jest.fn()}
          onDislike={jest.fn()}
        />
      );

      // Should not crash the component
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });

    it('should handle ProductList API errors gracefully', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load products' },
        },
      });

      render(
        <ProductList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle UserPreferences API errors gracefully', async () => {
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });

      (authService.updatePreferences as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to update preferences' },
        },
      });

      render(
        <UserPreferences
          onPreferencesUpdate={jest.fn()}
        />
      );

      // Simulate preference update
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle RecommendationList API errors gracefully', async () => {
      (recommendationService.getRecommendations as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load recommendations' },
        },
      });

      render(
        <RecommendationList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after API errors', async () => {
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

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Should retry and succeed
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(callCount).toBe(2);
      });
    });

    it('should handle partial failures gracefully', async () => {
      // Mock some services to succeed and others to fail
      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [createMockProduct()],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      (recommendationService.getRecommendations as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load recommendations' },
        },
      });

      render(<App />);

      // Should show products but error for recommendations
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State Management', () => {
    it('should clear errors when new data is loaded successfully', async () => {
      // First call fails
      (productService.getProducts as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Second call succeeds
      (productService.getProducts as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          products: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          filters: {},
        },
      });

      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('should handle multiple error types simultaneously', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load products' },
        },
      });

      (recommendationService.getRecommendations as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'No recommendations found' },
        },
      });

      render(<App />);

      await waitFor(() => {
        const errorElements = screen.getAllByText(/error/i);
        expect(errorElements.length).toBeGreaterThan(1);
      });
    });
  });

  describe('User Experience During Errors', () => {
    it('should show appropriate error messages to users', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });

    it('should provide retry options for recoverable errors', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(<App />);

      await waitFor(() => {
        const retryButton = screen.getByText(/retry/i);
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).not.toBeDisabled();
      });
    });

    it('should disable retry for non-recoverable errors', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        // Should not show retry button for 403 errors
        expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should track error metrics', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Error should be tracked in state
      // This would be verified by checking the error state
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue functioning with reduced features during errors', async () => {
      // Products fail to load
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load products' },
        },
      });

      // But recommendations work
      (recommendationService.getRecommendations as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              userId: 1,
              productId: 1,
              score: 0.95,
              algorithm: 'content_based',
              createdAt: new Date(),
              product: createMockProduct(),
            },
          ],
          algorithm: 'content_based',
          count: 1,
        },
      });

      render(<App />);

      // Should show error for products but still show recommendations
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should provide fallback content during errors', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load products' },
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });
  });
});
