/**
 * State Management Integration Tests
 * TASK-023: UI-API Integration Tests
 * 
 * Tests the integration between state management and API services.
 */

import React from 'react';
import { screen, waitFor, fireEvent, renderHook, act } from '@testing-library/react';
import { render, createMockProduct, createMockUser, resetAllMocks } from '../utils/testUtils';
import { useApp } from '../../contexts/AppContext';
import { AppProvider } from '../../contexts/AppContext';
import { apiMock } from '../mocks/apiMock';

// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe('State Management Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('AppContext State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      expect(result.current.state.products).toEqual([]);
      expect(result.current.state.recommendations).toEqual([]);
      expect(result.current.state.userInteractions.views).toEqual([]);
      expect(result.current.state.loading.products).toBe(false);
      expect(result.current.state.errors.products).toBeNull();
    });

    it('should update products state from API', async () => {
      const mockProducts = [
        createMockProduct({ id: 1, name: 'Product 1' }),
        createMockProduct({ id: 2, name: 'Product 2' }),
      ];

      (productService.getProducts as jest.Mock).mockResolvedValue({
        data: mockProducts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.setProducts(mockProducts);
      });

      expect(result.current.state.products).toEqual(mockProducts);
      expect(result.current.state.lastUpdate).toBeInstanceOf(Date);
    });

    it('should update recommendations state from API', async () => {
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

      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.setRecommendations(mockRecommendations);
      });

      expect(result.current.state.recommendations).toEqual(mockRecommendations);
      expect(result.current.state.lastUpdate).toBeInstanceOf(Date);
    });

    it('should track user interactions in state', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductView('1');
        result.current.trackProductLike('1');
        result.current.trackProductDislike('2');
        result.current.trackSearch('test search');
      });

      expect(result.current.state.userInteractions.views).toContain('1');
      expect(result.current.state.userInteractions.likes).toContain('1');
      expect(result.current.state.userInteractions.dislikes).toContain('2');
      expect(result.current.state.userInteractions.searches).toContain('test search');
      expect(result.current.state.userInteractions.lastInteraction).toBeInstanceOf(Date);
    });

    it('should manage loading states', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.setLoading('products', true);
        result.current.setLoading('recommendations', true);
      });

      expect(result.current.state.loading.products).toBe(true);
      expect(result.current.state.loading.recommendations).toBe(true);

      await act(async () => {
        result.current.setLoading('products', false);
        result.current.setLoading('recommendations', false);
      });

      expect(result.current.state.loading.products).toBe(false);
      expect(result.current.state.loading.recommendations).toBe(false);
    });

    it('should manage error states', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.setError('products', 'Failed to load products');
        result.current.setError('recommendations', 'Failed to load recommendations');
      });

      expect(result.current.state.errors.products).toBe('Failed to load products');
      expect(result.current.state.errors.recommendations).toBe('Failed to load recommendations');

      await act(async () => {
        result.current.setError('products', null);
        result.current.setError('recommendations', null);
      });

      expect(result.current.state.errors.products).toBeNull();
      expect(result.current.state.errors.recommendations).toBeNull();
    });
  });

  describe('Product State Management', () => {
    it('should add new products to state', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      const newProduct = createMockProduct({ id: 3, name: 'New Product' });

      await act(async () => {
        result.current.addProduct(newProduct);
      });

      expect(result.current.state.products).toContain(newProduct);
    });

    it('should update existing products in state', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      const product = createMockProduct({ id: 1, name: 'Original Name' });
      const updatedProduct = { ...product, name: 'Updated Name' };

      await act(async () => {
        result.current.setProducts([product]);
        result.current.updateProduct(updatedProduct);
      });

      expect(result.current.state.products[0].name).toBe('Updated Name');
    });

    it('should remove products from state', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      const products = [
        createMockProduct({ id: 1, name: 'Product 1' }),
        createMockProduct({ id: 2, name: 'Product 2' }),
      ];

      await act(async () => {
        result.current.setProducts(products);
        result.current.removeProduct('1');
      });

      expect(result.current.state.products).toHaveLength(1);
      expect(result.current.state.products[0].id).toBe(2);
    });

    it('should set selected product', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      const product = createMockProduct({ id: 1, name: 'Selected Product' });

      await act(async () => {
        result.current.setSelectedProduct(product);
      });

      expect(result.current.state.selectedProduct).toEqual(product);
    });

    it('should update product filters', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      const filters = {
        category: 'electronics',
        priceMin: 50,
        priceMax: 200,
      };

      await act(async () => {
        result.current.setProductFilters(filters);
      });

      expect(result.current.state.productFilters).toEqual(filters);
    });
  });

  describe('User Interaction State Management', () => {
    it('should track product views', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductView('1');
        result.current.trackProductView('2');
        result.current.trackProductView('1'); // Duplicate should be handled
      });

      expect(result.current.state.userInteractions.views).toContain('1');
      expect(result.current.state.userInteractions.views).toContain('2');
      expect(result.current.state.userInteractions.views).toHaveLength(2);
    });

    it('should track product likes and dislikes', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductLike('1');
        result.current.trackProductDislike('2');
      });

      expect(result.current.state.userInteractions.likes).toContain('1');
      expect(result.current.state.userInteractions.dislikes).toContain('2');
    });

    it('should handle like/dislike conflicts', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductLike('1');
        result.current.trackProductDislike('1'); // Should remove from likes
      });

      expect(result.current.state.userInteractions.likes).not.toContain('1');
      expect(result.current.state.userInteractions.dislikes).toContain('1');
    });

    it('should track search terms', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackSearch('test search 1');
        result.current.trackSearch('test search 2');
      });

      expect(result.current.state.userInteractions.searches).toContain('test search 1');
      expect(result.current.state.userInteractions.searches).toContain('test search 2');
    });

    it('should provide interaction statistics', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductView('1');
        result.current.trackProductView('2');
        result.current.trackProductLike('1');
        result.current.trackProductDislike('2');
        result.current.trackSearch('test search');
      });

      const stats = result.current.getInteractionStats();

      expect(stats.totalViews).toBe(2);
      expect(stats.totalLikes).toBe(1);
      expect(stats.totalDislikes).toBe(1);
      expect(stats.totalSearches).toBe(1);
      expect(stats.lastInteraction).toBeInstanceOf(Date);
    });

    it('should check if product is liked or disliked', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      await act(async () => {
        result.current.trackProductLike('1');
        result.current.trackProductDislike('2');
      });

      expect(result.current.isProductLiked('1')).toBe(true);
      expect(result.current.isProductLiked('2')).toBe(false);
      expect(result.current.isProductDisliked('1')).toBe(false);
      expect(result.current.isProductDisliked('2')).toBe(true);
    });
  });

  describe('State Reset and Cleanup', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      // Set some state
      await act(async () => {
        result.current.setProducts([createMockProduct()]);
        result.current.setRecommendations([{
          id: 1,
          userId: 1,
          productId: 1,
          score: 0.95,
          algorithm: 'content_based',
          createdAt: new Date(),
          product: createMockProduct(),
        }]);
        result.current.trackProductView('1');
        result.current.setLoading('products', true);
        result.current.setError('products', 'Test error');
      });

      // Reset state
      await act(async () => {
        result.current.resetState();
      });

      expect(result.current.state.products).toEqual([]);
      expect(result.current.state.recommendations).toEqual([]);
      expect(result.current.state.userInteractions.views).toEqual([]);
      expect(result.current.state.loading.products).toBe(false);
      expect(result.current.state.errors.products).toBeNull();
    });
  });

  describe('Online/Offline State Management', () => {
    it('should track online status', async () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: ({ children }) => (
          <AppProvider>{children}</AppProvider>
        ),
      });

      expect(result.current.state.isOnline).toBe(true);

      // Simulate going offline
      await act(async () => {
        result.current.dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
      });

      expect(result.current.state.isOnline).toBe(false);

      // Simulate going back online
      await act(async () => {
        result.current.dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      });

      expect(result.current.state.isOnline).toBe(true);
    });
  });
});
