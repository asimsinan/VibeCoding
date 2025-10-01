/**
 * User Interactions Hook
 * 
 * Manages user interactions (likes, dislikes, favorites) with database persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { interactionService } from '../api';

export interface UserInteractions {
  likes: string[];
  dislikes: string[];
  favorites: string[];
  ratings: Record<string, number>; // productId -> rating value
}

export function useUserInteractionState() {
  const { isAuthenticated } = useAuth();
  const [interactions, setInteractions] = useState<UserInteractions>({
    likes: [],
    dislikes: [],
    favorites: [],
    ratings: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user interactions from API
  const loadInteractions = useCallback(async () => {
    if (!isAuthenticated) {
      setInteractions({ likes: [], dislikes: [], favorites: [], ratings: {} });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await interactionService.getUserInteractions(1, 1000); // Get all interactions
      
      if (response.success && response.data) {
        const { interactions: userInteractions } = response.data;
        
        const likes = userInteractions
          .filter(i => i.type === 'like')
          .map(i => i.productId.toString());
        
        const dislikes = userInteractions
          .filter(i => i.type === 'dislike')
          .map(i => i.productId.toString());
        
        const favorites = userInteractions
          .filter(i => i.type === 'favorite')
          .map(i => i.productId.toString());

        const ratings: Record<string, number> = {};
        userInteractions
          .filter(i => i.type === 'rating' && i.metadata?.rating)
          .forEach(i => {
            ratings[i.productId.toString()] = i.metadata!.rating;
          });

        setInteractions({ likes, dislikes, favorites, ratings });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interactions');
      console.error('Failed to load user interactions:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Toggle like interaction
  const recordLike = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    const isCurrentlyLiked = interactions.likes.includes(productId);

    try {
      if (isCurrentlyLiked) {
        // Remove like
        await interactionService.deleteInteractionByProductType(parseInt(productId, 10), 'like');
        
        setInteractions(prev => ({
          ...prev,
          likes: prev.likes.filter(id => id !== productId)
        }));
      } else {
        // Add like and remove dislike if present
        await interactionService.recordLike(parseInt(productId, 10));
        
        setInteractions(prev => ({
          ...prev,
          likes: [...prev.likes, productId],
          dislikes: prev.dislikes.filter(id => id !== productId) // Remove from dislikes if present
        }));
      }
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
    }
  }, [isAuthenticated, interactions.likes]);

  // Toggle dislike interaction
  const recordDislike = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    const isCurrentlyDisliked = interactions.dislikes.includes(productId);

    try {
      if (isCurrentlyDisliked) {
        // Remove dislike
        await interactionService.deleteInteractionByProductType(parseInt(productId, 10), 'dislike');
        
        setInteractions(prev => ({
          ...prev,
          dislikes: prev.dislikes.filter(id => id !== productId)
        }));
      } else {
        // Add dislike and remove like if present
        await interactionService.recordDislike(parseInt(productId, 10));
        
        setInteractions(prev => ({
          ...prev,
          dislikes: [...prev.dislikes, productId],
          likes: prev.likes.filter(id => id !== productId) // Remove from likes if present
        }));
      }
    } catch (err: any) {
      console.error('Failed to toggle dislike:', err);
    }
  }, [isAuthenticated, interactions.dislikes]);

  // Record a favorite interaction
  const recordFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await interactionService.recordFavorite(parseInt(productId, 10));
      
      setInteractions(prev => ({
        ...prev,
        favorites: [...prev.favorites, productId]
      }));
    } catch (err: any) {
      console.error('Failed to record favorite:', err);
    }
  }, [isAuthenticated]);

  // Remove a favorite interaction
  const removeFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await interactionService.deleteInteractionByProductType(parseInt(productId, 10), 'favorite');
      
      setInteractions(prev => ({
        ...prev,
        favorites: prev.favorites.filter(id => id !== productId)
      }));
    } catch (err: any) {
      console.error('Failed to remove favorite:', err);
    }
  }, [isAuthenticated]);

  // Record a rating interaction
  const recordRating = useCallback(async (productId: string, rating: number) => {
    if (!isAuthenticated) return;

    try {
      // First, remove any existing rating for this product
      if (interactions.ratings[productId]) {
        await interactionService.deleteInteractionByProductType(parseInt(productId, 10), 'rating');
      }
      
      // Then record the new rating
      await interactionService.recordRating(parseInt(productId, 10), rating);
      
      // Update the product's average rating
      try {
        await interactionService.updateProductRating(parseInt(productId, 10));
      } catch (updateErr) {
        console.warn('Failed to update product average rating:', updateErr);
        // Don't fail the whole operation if rating update fails
      }
      
      setInteractions(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [productId]: rating
        }
      }));
    } catch (err: any) {
      console.error('Failed to record rating:', err);
    }
  }, [isAuthenticated, interactions.ratings]);

  // Remove a rating interaction
  const removeRating = useCallback(async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await interactionService.deleteInteractionByProductType(parseInt(productId, 10), 'rating');
      
      // Update the product's average rating
      try {
        await interactionService.updateProductRating(parseInt(productId, 10));
      } catch (updateErr) {
        console.warn('Failed to update product average rating:', updateErr);
        // Don't fail the whole operation if rating update fails
      }
      
      setInteractions(prev => {
        const newRatings = { ...prev.ratings };
        delete newRatings[productId];
        return {
          ...prev,
          ratings: newRatings
        };
      });
    } catch (err: any) {
      console.error('Failed to remove rating:', err);
    }
  }, [isAuthenticated]);

  // Check if product is liked
  const isLiked = useCallback((productId: string) => {
    return interactions.likes.includes(productId);
  }, [interactions.likes]);

  // Check if product is disliked
  const isDisliked = useCallback((productId: string) => {
    return interactions.dislikes.includes(productId);
  }, [interactions.dislikes]);

  // Check if product is favorited
  const isFavorited = useCallback((productId: string) => {
    return interactions.favorites.includes(productId);
  }, [interactions.favorites]);

  // Get product rating
  const getProductRating = useCallback((productId: string) => {
    return interactions.ratings[productId] || 0;
  }, [interactions.ratings]);

  // Check if product is rated
  const isRated = useCallback((productId: string) => {
    return productId in interactions.ratings;
  }, [interactions.ratings]);

  // Load interactions when authentication status changes
  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  return {
    interactions,
    loading,
    error,
    loadInteractions,
    recordLike,
    recordDislike,
    recordFavorite,
    removeFavorite,
    recordRating,
    removeRating,
    isLiked,
    isDisliked,
    isFavorited,
    getProductRating,
    isRated
  };
}
