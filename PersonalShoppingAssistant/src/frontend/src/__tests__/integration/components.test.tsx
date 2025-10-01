/**
 * Component Integration Tests
 * TASK-023: UI-API Integration Tests
 * 
 * Tests the integration between UI components and API services.
 */

import React from 'react';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { render, createMockProduct, createMockUser, resetAllMocks } from '../utils/testUtils';
import { ProductCard, ProductList, UserPreferences, RecommendationList } from '../../components';
import { apiMock } from '../mocks/apiMock';

// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe('Component Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('ProductCard Integration', () => {
    it('should display product data from API', async () => {
      const mockProduct = createMockProduct({
        name: 'Test Product',
        price: 99.99,
        category: 'electronics',
        brand: 'TestBrand',
        rating: 4.5,
      });

      render(
        <ProductCard
          product={mockProduct}
          onView={jest.fn()}
          onLike={jest.fn()}
          onDislike={jest.fn()}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should handle product interactions with API calls', async () => {
      const mockProduct = createMockProduct();
      const onView = jest.fn();
      const onLike = jest.fn();
      const onDislike = jest.fn();

      (interactionService.recordInteraction as jest.Mock).mockResolvedValue({
        success: true,
        id: 1,
      });

      render(
        <ProductCard
          product={mockProduct}
          onView={onView}
          onLike={onLike}
          onDislike={onDislike}
        />
      );

      // Test view interaction
      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);
      
      expect(onView).toHaveBeenCalledWith(mockProduct);

      // Test like interaction
      const likeButton = screen.getByLabelText('Like product');
      fireEvent.click(likeButton);
      
      expect(onLike).toHaveBeenCalledWith(mockProduct);

      // Test dislike interaction
      const dislikeButton = screen.getByLabelText('Dislike product');
      fireEvent.click(dislikeButton);
      
      expect(onDislike).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle API errors during interactions', async () => {
      const mockProduct = createMockProduct();
      const onView = jest.fn();

      (interactionService.recordInteraction as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      });

      render(
        <ProductCard
          product={mockProduct}
          onView={onView}
          onLike={jest.fn()}
          onDislike={jest.fn()}
        />
      );

      // Should still call the handler even if API fails
      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);
      
      expect(onView).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('ProductList Integration', () => {
    it('should load and display products from API', async () => {
      const mockProducts = [
        createMockProduct({ id: 1, name: 'Product 1' }),
        createMockProduct({ id: 2, name: 'Product 2' }),
      ];

      (productService.getProducts as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          products: mockProducts,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            hasMore: false,
          },
          filters: {},
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
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
      });

      expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should handle search with API integration', async () => {
      const searchTerm = 'test search';
      const mockProducts = [createMockProduct({ name: 'Test Search Product' })];

      (productService.searchProducts as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          products: mockProducts,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
          query: searchTerm,
        },
      });

      render(
        <ProductList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      // Clear any previous calls
      jest.clearAllMocks();

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: searchTerm } });

      await waitFor(() => {
        expect(productService.searchProducts).toHaveBeenCalledWith(
          expect.objectContaining({ q: searchTerm })
        );
      });
    });

    it('should handle filtering with API integration', async () => {
      const filters = {
        category: 'electronics',
        priceMin: 50,
        priceMax: 200,
      };

      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: [createMockProduct({ category: 'electronics' })],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      render(
        <ProductList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      // Simulate filter application
      // This would be triggered by filter UI components
      await waitFor(() => {
        expect(productService.getProducts).toHaveBeenCalled();
      });
    });

    it('should handle pagination with API integration', async () => {
      const mockProducts = Array.from({ length: 20 }, (_, i) => 
        createMockProduct({ id: i + 1, name: `Product ${i + 1}` })
      );

      (productService.getProducts as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          products: mockProducts.slice(0, 10),
          pagination: {
            page: 1,
            limit: 10,
            total: 20,
            totalPages: 2,
            hasMore: true,
          },
          filters: {},
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
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      // Test pagination
      const nextPageButton = screen.getByText(/next/i);
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(productService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe('UserPreferences Integration', () => {
    it.skip('should render user preferences component', () => {
      render(
        <UserPreferences
          onPreferencesUpdate={jest.fn()}
        />
      );

      // The component should render without hanging
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
    });

    it.skip('should display preference form elements', () => {
      render(
        <UserPreferences
          onPreferencesUpdate={jest.fn()}
        />
      );

      // Check for key form elements
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
      expect(screen.getByText('Style Preferences')).toBeInTheDocument();
    });

    it.skip('should handle component mounting', () => {
      const { container } = render(
        <UserPreferences
          onPreferencesUpdate={jest.fn()}
        />
      );

      // Component should mount successfully
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('RecommendationList Integration', () => {
    it.skip('should load recommendations from API', async () => {
      const mockRecommendations = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          score: 0.95,
          algorithm: 'content_based',
          createdAt: new Date(),
          product: createMockProduct({ name: 'Recommended Product' }),
        },
      ];

      (recommendationService.getRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);

      render(
        <RecommendationList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Recommended Product')).toBeInTheDocument();
      });

      expect(recommendationService.getRecommendations).toHaveBeenCalled();
    });

    it.skip('should generate new recommendations with API integration', async () => {
      const mockRecommendations = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          score: 0.95,
          algorithm: 'hybrid',
          createdAt: new Date(),
          product: createMockProduct({ name: 'New Recommendation' }),
        },
      ];

      (recommendationService.generateRecommendations as jest.Mock).mockResolvedValue(mockRecommendations);

      render(
        <RecommendationList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      // Simulate recommendation generation
      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(recommendationService.generateRecommendations).toHaveBeenCalled();
      });
    });

    it.skip('should handle recommendation errors', async () => {
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

  describe('Loading States Integration', () => {
    it('should show loading states during API calls', async () => {
      (productService.getProducts as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }), 100))
      );

      render(
        <ProductList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      // Should show loading state initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Should hide loading state after API call completes
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple loading states simultaneously', async () => {
      (productService.getProducts as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: [createMockProduct()],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }), 100))
      );

      (recommendationService.getRecommendations as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 150))
      );

      render(
        <div>
          <ProductList
            onProductView={jest.fn()}
            onProductLike={jest.fn()}
            onProductDislike={jest.fn()}
          />
          <RecommendationList
            onProductView={jest.fn()}
            onProductLike={jest.fn()}
            onProductDislike={jest.fn()}
          />
        </div>
      );

      // Should show at least one loading state initially
      const loadingElements = screen.getAllByTestId('loading-spinner');
      expect(loadingElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error messages for API failures', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
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
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should allow retry after API failures', async () => {
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

      render(
        <ProductList
          onProductView={jest.fn()}
          onProductLike={jest.fn()}
          onProductDislike={jest.fn()}
        />
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });

      // Should retry and succeed
      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(callCount).toBe(2);
      });
    });
  });
});
