/**
 * Models Index - Export all data models
 * TASK-007: Create Data Models - FR-001 through FR-007
 * 
 * This file exports all data models for the Personal Shopping Assistant system
 * providing a centralized import point for all model classes and interfaces.
 */

// User models
export { 
  User, 
  UserEntity, 
  UserCreateData, 
  UserUpdateData, 
  UserProfile 
} from './User';

// User preferences models
export { 
  UserPreferencesModel, 
  UserPreferences, 
  UserPreferencesCreateData, 
  UserPreferencesUpdateData 
} from './UserPreferences';

// Product models
export { 
  Product, 
  ProductEntity, 
  ProductCreateData, 
  ProductUpdateData, 
  ProductSearchFilters, 
  ProductSearchResult 
} from './Product';

// Interaction models
export { 
  Interaction, 
  InteractionEntity, 
  InteractionCreateData, 
  InteractionUpdateData, 
  InteractionType, 
  InteractionStats, 
  InteractionAnalytics 
} from './Interaction';

// Recommendation models
export { 
  Recommendation, 
  RecommendationEntity, 
  RecommendationCreateData, 
  RecommendationUpdateData, 
  RecommendationAlgorithm, 
  RecommendationResult, 
  RecommendationBatch, 
  RecommendationStats 
} from './Recommendation';

// Re-export domain types for convenience
export type {
  UserEntity as DomainUser
} from './User';

export type {
  ProductEntity as DomainProduct
} from './Product';

export type {
  InteractionEntity as DomainInteraction
} from './Interaction';

export type {
  UserPreferences as DomainUserPreferences
} from './UserPreferences';
