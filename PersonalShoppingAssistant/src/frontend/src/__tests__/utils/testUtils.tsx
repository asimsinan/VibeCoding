/**
 * Test Utilities
 * TASK-023: UI-API Integration Tests
 * 
 * Provides utilities and helpers for UI-API integration testing.
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { AuthProvider } from '../../hooks/useAuth';
import { apiMock } from '../mocks/apiMock';

// Mocks are now handled in setup.ts

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuthState?: {
    user?: any;
    isAuthenticated?: boolean;
    isLoading?: boolean;
  };
  initialAppState?: any;
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialAuthState = {},
    initialAppState = {},
    ...renderOptions
  } = options;

  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockProduct = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  category: 'electronics',
  brand: 'TestBrand',
  rating: 4.5,
  imageUrl: 'https://example.com/product.jpg',
  inStock: true,
  style: 'modern',
  ...overrides,
});

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

export const createMockRecommendation = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  userId: 1,
  productId: 1,
  score: 0.95,
  algorithm: 'content_based',
  createdAt: new Date('2023-01-01'),
  product: createMockProduct(),
  ...overrides,
});

export const createMockUserPreferences = (overrides: Partial<any> = {}) => ({
  id: 1,
  userId: 1,
  categories: ['electronics', 'clothing'],
  brands: ['Apple', 'Nike'],
  priceRange: { min: 50, max: 200 },
  stylePreferences: ['modern', 'casual'],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

// API mock helpers
export const mockApiResponse = (data: any, delay: number = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve({ data }), delay);
  });
};

export const mockApiError = (message: string, status: number = 500) => {
  return Promise.reject({
    response: {
      status,
      data: { message },
    },
    message,
  });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock fetch
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  apiMock.reset();
  
  // Reset localStorage mock
  const localStorage = mockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: localStorage,
    writable: true,
  });
  
  // Reset fetch mock
  global.fetch = jest.fn();
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Set up DOM environment
  document.body.innerHTML = '<div id="root"></div>';
  
  // Mock window methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};
