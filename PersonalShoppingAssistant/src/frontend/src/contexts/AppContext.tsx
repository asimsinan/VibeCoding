/**
 * Application Context
 * TASK-022: API Data Flow Integration
 * 
 * Provides global state management for the application including
 * user interactions, real-time updates, and data synchronization.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Product, Recommendation } from '../api';
import { useAuth } from '../hooks';

// State interfaces
export interface AppState {
  // Product state
  products: Product[];
  selectedProduct: Product | null;
  productFilters: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    search?: string;
  };
  
  // Recommendation state
  recommendations: Recommendation[];
  recommendationHistory: Recommendation[];
  
  // User interaction state
  userInteractions: {
    views: string[];
    likes: string[];
    dislikes: string[];
    favorites: string[];
    searches: string[];
    lastInteraction: Date | null;
  };
  
  // UI state
  loading: {
    products: boolean;
    recommendations: boolean;
    interactions: boolean;
  };
  
  // Real-time state
  lastUpdate: Date | null;
  isOnline: boolean;
  
  // Error state
  errors: {
    products: string | null;
    recommendations: string | null;
    interactions: string | null;
  };
}

// Action types
export type AppAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'REMOVE_PRODUCT'; payload: string }
  | { type: 'SET_SELECTED_PRODUCT'; payload: Product | null }
  | { type: 'SET_PRODUCT_FILTERS'; payload: Partial<AppState['productFilters']> }
  | { type: 'SET_RECOMMENDATIONS'; payload: Recommendation[] }
  | { type: 'ADD_RECOMMENDATION'; payload: Recommendation }
  | { type: 'CLEAR_RECOMMENDATIONS' }
  | { type: 'ADD_USER_INTERACTION'; payload: { type: 'view' | 'like' | 'dislike' | 'favorite' | 'search'; productId: string; searchTerm?: string } }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AppState['errors']; value: string | null } }
  | { type: 'SET_LAST_UPDATE'; payload: Date }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  products: [],
  selectedProduct: null,
  productFilters: {},
  recommendations: [],
  recommendationHistory: [],
  userInteractions: {
    views: [],
    likes: [],
    dislikes: [],
    favorites: [],
    searches: [],
    lastInteraction: null,
  },
  loading: {
    products: false,
    recommendations: false,
    interactions: false,
  },
  lastUpdate: null,
  isOnline: true,
  errors: {
    products: null,
    recommendations: null,
    interactions: null,
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload,
        lastUpdate: new Date(),
      };
      
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
        lastUpdate: new Date(),
      };
      
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
        selectedProduct: state.selectedProduct?.id === action.payload.id ? action.payload : state.selectedProduct,
        lastUpdate: new Date(),
      };
      
    case 'REMOVE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id.toString() !== action.payload),
        selectedProduct: state.selectedProduct?.id.toString() === action.payload ? null : state.selectedProduct,
        lastUpdate: new Date(),
      };
      
    case 'SET_SELECTED_PRODUCT':
      return {
        ...state,
        selectedProduct: action.payload,
      };
      
    case 'SET_PRODUCT_FILTERS':
      return {
        ...state,
        productFilters: { ...state.productFilters, ...action.payload },
      };
      
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload,
        lastUpdate: new Date(),
      };
      
    case 'ADD_RECOMMENDATION':
      return {
        ...state,
        recommendations: [...state.recommendations, action.payload],
        lastUpdate: new Date(),
      };
      
    case 'CLEAR_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: [],
        lastUpdate: new Date(),
      };
      
    case 'ADD_USER_INTERACTION':
      const { type: interactionType, productId, searchTerm } = action.payload;
      const newInteractions = { ...state.userInteractions };
      
      if (interactionType === 'view') {
        const viewsSet = new Set([...newInteractions.views, productId]);
        newInteractions.views = Array.from(viewsSet);
      } else if (interactionType === 'like') {
        const likesSet = new Set([...newInteractions.likes, productId]);
        newInteractions.likes = Array.from(likesSet);
        newInteractions.dislikes = newInteractions.dislikes.filter(id => id !== productId);
      } else if (interactionType === 'dislike') {
        const dislikesSet = new Set([...newInteractions.dislikes, productId]);
        newInteractions.dislikes = Array.from(dislikesSet);
        newInteractions.likes = newInteractions.likes.filter(id => id !== productId);
      } else if (interactionType === 'search') {
        newInteractions.searches = [...newInteractions.searches, searchTerm || ''];
      }
      
      newInteractions.lastInteraction = new Date();
      
      return {
        ...state,
        userInteractions: newInteractions,
        lastUpdate: new Date(),
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case 'SET_LAST_UPDATE':
      return {
        ...state,
        lastUpdate: action.payload,
      };
      
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };
      
    case 'TOGGLE_FAVORITE':
      const favoriteProductId = action.payload;
      const isCurrentlyFavorite = state.userInteractions.favorites.includes(favoriteProductId);
      return {
        ...state,
        userInteractions: {
          ...state.userInteractions,
          favorites: isCurrentlyFavorite
            ? state.userInteractions.favorites.filter(id => id !== favoriteProductId)
            : [...state.userInteractions.favorites, favoriteProductId],
          lastInteraction: new Date(),
        },
        lastUpdate: new Date(),
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Context interface
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  setProductFilters: (filters: Partial<AppState['productFilters']>) => void;
  
  // Recommendation actions
  setRecommendations: (recommendations: Recommendation[]) => void;
  addRecommendation: (recommendation: Recommendation) => void;
  clearRecommendations: () => void;
  
  // User interaction actions
  addUserInteraction: (type: 'view' | 'like' | 'dislike' | 'favorite' | 'search', productId: string, searchTerm?: string) => void;
  trackProductView: (productId: string) => void;
  trackProductLike: (productId: string) => void;
  trackProductDislike: (productId: string) => void;
  trackProductFavorite: (productId: string) => void;
  trackSearch: (searchTerm: string) => void;
  
  // Loading and error actions
  setLoading: (key: keyof AppState['loading'], value: boolean) => void;
  setError: (key: keyof AppState['errors'], value: string | null) => void;
  
  // Utility actions
  resetState: () => void;
  isProductLiked: (productId: string) => boolean;
  isProductDisliked: (productId: string) => boolean;
  isProductFavorite: (productId: string) => boolean;
  getInteractionStats: () => {
    totalViews: number;
    totalLikes: number;
    totalDislikes: number;
    totalSearches: number;
    lastInteraction: Date | null;
  };
  
  // Refresh actions
  refreshProducts: () => void;
  setProductRefetchFn: (fn: (() => void) | null) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Try to get auth context, but don't fail if not available (for testing)
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
  } catch (error) {
    // AuthProvider not available, use default value
    isAuthenticated = false;
  }

  // Product actions
  const setProducts = useCallback((products: Product[]) => {
    dispatch({ type: 'SET_PRODUCTS', payload: products });
  }, []);

  const addProduct = useCallback((product: Product) => {
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  }, []);

  const updateProduct = useCallback((product: Product) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: product });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_PRODUCT', payload: productId });
  }, []);

  const setSelectedProduct = useCallback((product: Product | null) => {
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload: product });
  }, []);

  const setProductFilters = useCallback((filters: Partial<AppState['productFilters']>) => {
    dispatch({ type: 'SET_PRODUCT_FILTERS', payload: filters });
  }, []);

  // Recommendation actions
  const setRecommendations = useCallback((recommendations: Recommendation[]) => {
    dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
  }, []);

  const addRecommendation = useCallback((recommendation: Recommendation) => {
    dispatch({ type: 'ADD_RECOMMENDATION', payload: recommendation });
  }, []);

  const clearRecommendations = useCallback(() => {
    dispatch({ type: 'CLEAR_RECOMMENDATIONS' });
  }, []);

  // User interaction actions
  const addUserInteraction = useCallback((type: 'view' | 'like' | 'dislike' | 'favorite' | 'search', productId: string, searchTerm?: string) => {
    dispatch({ type: 'ADD_USER_INTERACTION', payload: { type, productId, searchTerm } });
  }, []);

  const trackProductView = useCallback((productId: string) => {
    addUserInteraction('view', productId);
  }, [addUserInteraction]);

  const trackProductLike = useCallback((productId: string) => {
    addUserInteraction('like', productId);
  }, [addUserInteraction]);

  const trackProductDislike = useCallback((productId: string) => {
    addUserInteraction('dislike', productId);
  }, [addUserInteraction]);

  const trackProductFavorite = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: productId });
    addUserInteraction('favorite', productId);
  }, [addUserInteraction]);

  const trackSearch = useCallback((searchTerm: string) => {
    addUserInteraction('search', '', searchTerm);
  }, [addUserInteraction]);

  // Loading and error actions
  const setLoading = useCallback((key: keyof AppState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  const setError = useCallback((key: keyof AppState['errors'], value: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, value } });
  }, []);

  // Utility actions
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const isProductLiked = useCallback((productId: string) => {
    return state.userInteractions.likes.includes(productId);
  }, [state.userInteractions.likes]);

  const isProductDisliked = useCallback((productId: string) => {
    return state.userInteractions.dislikes.includes(productId);
  }, [state.userInteractions.dislikes]);

  const isProductFavorite = useCallback((productId: string) => {
    return state.userInteractions.favorites.includes(productId);
  }, [state.userInteractions.favorites]);

  const getInteractionStats = useCallback(() => {
    return {
      totalViews: state.userInteractions.views.length,
      totalLikes: state.userInteractions.likes.length,
      totalDislikes: state.userInteractions.dislikes.length,
      totalSearches: state.userInteractions.searches.length,
      lastInteraction: state.userInteractions.lastInteraction,
    };
  }, [state.userInteractions]);

  // Refresh actions
  const [productRefetchFn, setProductRefetchFn] = React.useState<(() => void) | null>(null);
  
  const setProductRefetchFnWithLogging = useCallback((fn: (() => void) | null) => {
    setProductRefetchFn(fn);
  }, []);
  
  const refreshProducts = useCallback(() => {
    if (productRefetchFn && typeof productRefetchFn === 'function') {
      productRefetchFn();
    }
  }, [productRefetchFn]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset state when user logs out - use useLayoutEffect to prevent flickering
  useLayoutEffect(() => {
    if (!isAuthenticated) {
      resetState();
    }
  }, [isAuthenticated, resetState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: AppContextType = useMemo(() => ({
    state,
    dispatch,
    setProducts,
    addProduct,
    updateProduct,
    removeProduct,
    setSelectedProduct,
    setProductFilters,
    setRecommendations,
    addRecommendation,
    clearRecommendations,
    addUserInteraction,
    trackProductView,
    trackProductLike,
    trackProductDislike,
    trackProductFavorite,
    trackSearch,
    setLoading,
    setError,
    resetState,
    isProductLiked,
    isProductDisliked,
    isProductFavorite,
    getInteractionStats,
    refreshProducts,
    setProductRefetchFn: setProductRefetchFnWithLogging,
  }), [
    state,
    setProducts,
    addProduct,
    updateProduct,
    removeProduct,
    setSelectedProduct,
    setProductFilters,
    setRecommendations,
    addRecommendation,
    clearRecommendations,
    addUserInteraction,
    trackProductView,
    trackProductLike,
    trackProductDislike,
    trackProductFavorite,
    trackSearch,
    setLoading,
    setError,
    resetState,
    isProductLiked,
    isProductDisliked,
    isProductFavorite,
    getInteractionStats,
    refreshProducts,
    setProductRefetchFnWithLogging,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
