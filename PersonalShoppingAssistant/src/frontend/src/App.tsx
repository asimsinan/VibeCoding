/**
 * Main App Component
 * TASK-021: UI-API Connection Implementation
 * 
 * Main application component that orchestrates all UI components
 * and provides the overall layout and navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks';
import { ProductList, RecommendationList, UserPreferences, LoadingSpinner, ErrorMessage } from './components';
import { RecommendationErrorBoundary } from './components/RecommendationErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AppProvider, useApp } from './contexts/AppContext';
import { useRealtime } from './services/realtimeService';
import { useInteractionTracker } from './services/interactionTracker';
import { useLoadingStates } from './hooks/useLoadingStates';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useUserInteractionState } from './hooks/useUserInteractions';
import type { Product } from './api';

// Main App Content (wrapped with AuthProvider and AppProvider)
const AppContent: React.FC = () => {
  console.log('🔄 AppContent: Component rendering');
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  console.log('🔄 AppContent: Auth state:', { isAuthenticated, isLoading });
  const appContext = useApp();
  const { state, setSelectedProduct, trackProductView, refreshProducts, setProductRefetchFn } = appContext;
  const { recordLike, recordDislike, recordFavorite, removeFavorite, recordRating, removeRating, isLiked, isDisliked, isFavorited, getProductRating, isRated } = useUserInteractionState();
  const realtimeService = useRealtime();
  const interactionTracker = useInteractionTracker();
  // Loading and error handling hooks (currently unused but available for future use)
  useLoadingStates();
  useErrorHandler();
  
  const [activeTab, setActiveTab] = useState<'products' | 'recommendations' | 'preferences'>('products');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [refetchTimeout, setRefetchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleProductView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductDetailOpen(true);
    trackProductView(product.id.toString());
    interactionTracker.trackProductView(product.id.toString(), {
      productName: product.name,
      category: product.category,
      price: product.price,
    });
  }, [setSelectedProduct, trackProductView, interactionTracker]);

  const handleProductLike = useCallback((product: Product) => {
    // Record in database
    recordLike(product.id.toString());
    
    // Track interaction
    interactionTracker.trackProductLike(product.id.toString(), {
      productName: product.name,
      category: product.category,
      price: product.price,
    });
  }, [recordLike, interactionTracker]);

  const handleProductDislike = useCallback((product: Product) => {
    // Record in database
    recordDislike(product.id.toString());
    
    // Track interaction
    interactionTracker.trackProductDislike(product.id.toString(), {
      productName: product.name,
      category: product.category,
      price: product.price,
    });
  }, [recordDislike, interactionTracker]);

  const handleProductFavorite = useCallback((product: Product) => {
    const productId = product.id.toString();
    
    if (isFavorited(productId)) {
      // Remove from favorites
      removeFavorite(productId);
    } else {
      // Add to favorites
      recordFavorite(productId);
    }
    
    // Track interaction
    interactionTracker.trackInteraction('favorite', {
      productId,
      metadata: {
        productName: product.name,
        category: product.category,
        price: product.price,
      },
    });
  }, [recordFavorite, removeFavorite, isFavorited, interactionTracker]);

  const handleProductRating = useCallback((product: Product, rating: number) => {
    if (!isAuthenticated) {
      // Show error message for unauthenticated users
      console.warn('User must be authenticated to rate products');
      return;
    }
    
    const productId = product.id.toString();
    
    if (rating === 0) {
      // Remove rating
      removeRating(productId);
    } else {
      // Record rating
      recordRating(productId, rating);
    }
    
    // Track interaction
    interactionTracker.trackInteraction('rating', {
      productId,
      metadata: {
        productName: product.name,
        category: product.category,
        price: product.price,
        rating: rating,
      },
    });
    
    // Refresh products to show updated average rating with debouncing
    if (refreshProducts && typeof refreshProducts === 'function') {
      // Clear any existing timeout
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      
      // Set a new timeout with debouncing to avoid rate limiting
      const timeout = setTimeout(() => {
        try {
          refreshProducts();
        } catch (error) {
          console.error('Error refreshing products:', error);
        }
      }, 1500); // Debounced delay to avoid rate limiting
      
      setRefetchTimeout(timeout);
    } else {
      console.warn('refreshProducts not available for rating update');
    }
  }, [recordRating, removeRating, interactionTracker, isAuthenticated, refreshProducts, refetchTimeout]);

  const handlePreferencesUpdate = useCallback((preferences: any) => {
    interactionTracker.trackInteraction('filter', {
      filterData: { preferences },
      metadata: { preferences },
    });
  }, [interactionTracker]);

  // Initialize services
  useEffect(() => {
    if (isAuthenticated) {
      realtimeService.initialize(appContext);
      interactionTracker.initialize(appContext);
    }
  }, [isAuthenticated, realtimeService, interactionTracker, appContext]);

  // Initialize real-time updates
  useEffect(() => {
    if (isAuthenticated) {
      realtimeService.start();
    } else {
      realtimeService.stop();
    }

    return () => {
      realtimeService.stop();
    };
  }, [isAuthenticated, realtimeService]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
    };
  }, [refetchTimeout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading application..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Personal Shopping Assistant
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Products
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recommendations
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferences
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Always render ProductList to register refetch function */}
        <ProductList
          onProductView={handleProductView}
          onProductLike={handleProductLike}
          onProductDislike={handleProductDislike}
          onProductFavorite={handleProductFavorite}
          onProductRating={handleProductRating}
          isLiked={isLiked}
          isDisliked={isDisliked}
          isFavorite={isFavorited}
          getProductRating={getProductRating}
          isRated={isRated}
          onRefetchReady={setProductRefetchFn}
          isVisible={activeTab === 'products'}
          shouldRefresh={activeTab === 'products'}
        />

        {activeTab === 'recommendations' && (
          <RecommendationErrorBoundary>
            <RecommendationList
              onProductView={handleProductView}
              onProductLike={handleProductLike}
              onProductDislike={handleProductDislike}
              onProductFavorite={handleProductFavorite}
              onProductRating={handleProductRating}
              isLiked={isLiked}
              isDisliked={isDisliked}
              isFavorite={isFavorited}
              getProductRating={getProductRating}
              isRated={isRated}
            />
          </RecommendationErrorBoundary>
        )}

        {activeTab === 'preferences' && isAuthenticated && (
          <UserPreferences
            onPreferencesUpdate={handlePreferencesUpdate}
          />
        )}

        {activeTab === 'preferences' && !isAuthenticated && (
          <div className="text-center py-12">
            <ErrorMessage
              message="Please sign in to view and update your preferences"
              type="info"
            />
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={state.selectedProduct}
        isOpen={productDetailOpen}
        onClose={() => setProductDetailOpen(false)}
        onLike={handleProductLike}
        onDislike={handleProductDislike}
        onAddToFavorites={handleProductFavorite}
        onRemoveFromFavorites={handleProductFavorite}
        isLiked={state.selectedProduct ? isLiked(state.selectedProduct.id.toString()) : false}
        isDisliked={state.selectedProduct ? isDisliked(state.selectedProduct.id.toString()) : false}
        isFavorite={state.selectedProduct ? isFavorited(state.selectedProduct.id.toString()) : false}
        onProductRating={handleProductRating}
        getProductRating={getProductRating}
        isRated={isRated}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Personal Shopping Assistant - Powered by AI Recommendations</p>
            <p className="mt-2">
              Built with React, TypeScript, and Node.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
