/**
 * Components Index
 * TASK-021: UI-API Connection Implementation
 * 
 * Exports all React components for centralized access.
 */

// Core Components
export { default as ProductCard } from './ProductCard';
export { default as ProductList } from './ProductList';
export { default as ProductFilters } from './ProductFilters';
export { default as SearchBar } from './SearchBar';
export { default as RecommendationList } from './RecommendationList';
export { default as UserPreferences } from './UserPreferences';

// UI Components
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorMessage } from './ErrorMessage';
export { default as AuthModal } from './AuthModal';
export { default as ProductDetailModal } from './ProductDetailModal';
export { StarRating } from './StarRating';

// Re-export types
export type { ProductCardProps } from './ProductCard';
export type { ProductListProps } from './ProductList';
export type { ProductFiltersProps } from './ProductFilters';
export type { SearchBarProps } from './SearchBar';
export type { RecommendationListProps } from './RecommendationList';
export type { UserPreferencesComponentProps } from './UserPreferences';
export type { LoadingSpinnerProps } from './LoadingSpinner';
export type { ErrorMessageProps } from './ErrorMessage';
export type { AuthModalProps } from './AuthModal';
export type { ProductDetailModalProps } from './ProductDetailModal';
