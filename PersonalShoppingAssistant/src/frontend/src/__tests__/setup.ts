/**
 * Test Setup
 * TASK-023: UI-API Integration Tests
 * 
 * Configures the test environment for UI-API integration testing.
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
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

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock API services
jest.mock('../api', () => {
  const { apiMock } = require('./mocks/apiMock');
  
  return {
    authService: {
      login: jest.fn().mockImplementation((email, password) => apiMock.login(email, password)),
      register: jest.fn().mockImplementation((userData) => apiMock.register(userData)),
      logout: jest.fn().mockImplementation(() => apiMock.logout()),
      getCurrentUser: jest.fn().mockImplementation(() => apiMock.getCurrentUser()),
      updateProfile: jest.fn().mockImplementation((userId, data) => apiMock.updateProfile(userId, data)),
      updatePreferences: jest.fn().mockImplementation((userId, preferences) => apiMock.updatePreferences(userId, preferences)),
      isAuthenticated: jest.fn(() => apiMock.isAuthenticated()),
      getProfile: jest.fn().mockImplementation((userId) => apiMock.getProfile(userId)),
    },
    productService: {
      getProducts: jest.fn().mockImplementation((filters) => apiMock.getProducts(filters?.page, filters?.limit, filters)),
      getProduct: jest.fn().mockImplementation((id) => apiMock.getProduct(id)),
      createProduct: jest.fn().mockImplementation((data) => apiMock.createProduct(data)),
      updateProduct: jest.fn().mockImplementation((id, data) => apiMock.updateProduct(id, data)),
      deleteProduct: jest.fn().mockImplementation((id) => apiMock.deleteProduct(id)),
      searchProducts: jest.fn().mockImplementation((params) => apiMock.searchProducts(params)),
    },
    recommendationService: {
      getRecommendations: jest.fn().mockImplementation((params) => apiMock.getRecommendations(params)),
      getCollaborativeRecommendations: jest.fn().mockImplementation((limit) => apiMock.getCollaborativeRecommendations(limit)),
      getContentBasedRecommendations: jest.fn().mockImplementation((limit) => apiMock.getContentBasedRecommendations(limit)),
      getHybridRecommendations: jest.fn().mockImplementation((limit) => apiMock.getHybridRecommendations(limit)),
      getPopularityRecommendations: jest.fn().mockImplementation((limit) => apiMock.getPopularityRecommendations(limit)),
      generateRecommendations: jest.fn().mockImplementation((params) => apiMock.generateRecommendations(params)),
      updateRecommendation: jest.fn().mockImplementation((id, data) => apiMock.updateRecommendation(id, data)),
    },
    interactionService: {
      recordInteraction: jest.fn().mockImplementation((data) => apiMock.recordInteraction(data)),
      getUserInteractions: jest.fn().mockImplementation((userId, page, limit) => apiMock.getUserInteractions(userId, page, limit)),
      getInteractionStats: jest.fn().mockImplementation((userId) => apiMock.getInteractionStats(userId)),
    },
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      setAuthToken: jest.fn(),
      clearAuthToken: jest.fn(),
    },
  };
});

// Individual service mocks are now handled in the main API mock above

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      preferences: {
        id: 1,
        userId: 1,
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 1000 },
        stylePreferences: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    updatePreferences: jest.fn(),
    refreshProfile: jest.fn(),
  }),
  useUpdatePreferences: () => ({
    mutate: jest.fn(),
    loading: false,
    error: null,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock recommendation hooks
jest.mock('../hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useCollaborativeRecommendations: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useContentBasedRecommendations: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useHybridRecommendations: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
  usePopularityRecommendations: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock realtime service
jest.mock('../services/realtimeService', () => ({
  realtimeService: {
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    forceRefresh: jest.fn(),
    getStatus: jest.fn(() => ({ isActive: false, isOnline: true })),
  },
  useRealtime: () => ({
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    forceRefresh: jest.fn(),
    getStatus: () => ({ isActive: false, isOnline: true }),
  }),
}));

// Mock interaction tracker
jest.mock('../services/interactionTracker', () => ({
  interactionTracker: {
    initialize: jest.fn(),
    trackInteraction: jest.fn(),
    trackProductView: jest.fn(),
    trackProductLike: jest.fn(),
    trackProductDislike: jest.fn(),
    trackSearch: jest.fn(),
    trackFilter: jest.fn(),
    getAnalytics: jest.fn(() => ({
      totalInteractions: 0,
      interactionsByType: {},
      popularProducts: [],
      searchTrends: [],
      userEngagement: {
        averageSessionLength: 0,
        interactionsPerSession: 0,
        mostActiveHour: 0,
      },
      timeRange: { start: new Date(), end: new Date() },
    })),
  },
  useInteractionTracker: () => ({
    initialize: jest.fn(),
    trackInteraction: jest.fn(),
    trackProductView: jest.fn(),
    trackProductLike: jest.fn(),
    trackProductDislike: jest.fn(),
    trackSearch: jest.fn(),
    trackFilter: jest.fn(),
    getAnalytics: jest.fn(() => ({
      totalInteractions: 0,
      interactionsByType: {},
      popularProducts: [],
      searchTrends: [],
      userEngagement: {
        averageSessionLength: 0,
        interactionsPerSession: 0,
        mostActiveHour: 0,
      },
      timeRange: { start: new Date(), end: new Date() },
    })),
  }),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('React Router Future Flag Warning'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error: Warning:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Clean up timers and services after each test
afterEach(() => {
  // Stop the realtime service to prevent hanging tests
  const { realtimeService } = require('../services/realtimeService');
  realtimeService.stop();
});
