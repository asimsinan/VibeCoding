/**
 * Domain Types - Core business entities
 * TASK-001: Create API Contracts - FR-001 through FR-007
 */

// Core Domain Entities
export interface UserEntity {
  id: number;
  email: string;
  passwordHash: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductEntity {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: number;
  userId: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  stylePreferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionEntity {
  id: number;
  userId: number;
  productId: number;
  type: InteractionType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type InteractionType = 'view' | 'like' | 'dislike' | 'purchase';

// Recommendation Domain Types
export interface RecommendationEntity {
  id: number;
  userId: number;
  productId: number;
  score: number;
  algorithm: RecommendationAlgorithm;
  createdAt: Date;
  expiresAt: Date;
}

export type RecommendationAlgorithm = 'collaborative' | 'content-based' | 'hybrid';

export interface RecommendationScore {
  productId: number;
  score: number;
  reasons: string[];
  algorithm: RecommendationAlgorithm;
}

// Search Domain Types
export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  userId?: number;
  limit: number;
  offset: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  availability?: boolean;
}

export interface SearchResult {
  products: ProductEntity[];
  totalCount: number;
  recommendations: ProductEntity[];
  searchTime: number;
}

// Business Logic Types
export interface RecommendationContext {
  userId: number;
  userPreferences: UserPreferences;
  interactionHistory: InteractionEntity[];
  availableProducts: ProductEntity[];
  limit: number;
}

export interface UserProfile {
  userId: number;
  preferences: UserPreferences;
  interactionStats: {
    totalViews: number;
    totalLikes: number;
    totalPurchases: number;
    favoriteCategories: string[];
    favoriteBrands: string[];
  };
  lastActiveAt: Date;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Database Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
}

// Service Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: Record<string, any>;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Event Types
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, any>;
  timestamp: Date;
  version: number;
}

export interface UserRegisteredEvent extends DomainEvent {
  type: 'UserRegistered';
  data: {
    userId: number;
    email: string;
  };
}

export interface ProductViewedEvent extends DomainEvent {
  type: 'ProductViewed';
  data: {
    userId: number;
    productId: number;
    timestamp: Date;
  };
}

export interface ProductLikedEvent extends DomainEvent {
  type: 'ProductLiked';
  data: {
    userId: number;
    productId: number;
    timestamp: Date;
  };
}

export interface ProductPurchasedEvent extends DomainEvent {
  type: 'ProductPurchased';
  data: {
    userId: number;
    productId: number;
    timestamp: Date;
    amount: number;
  };
}

// Configuration Types
export interface AppConfig {
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  server: {
    port: number;
    host: string;
  };
  recommendation: {
    defaultLimit: number;
    maxLimit: number;
    cacheTtl: number;
  };
  search: {
    defaultLimit: number;
    maxLimit: number;
    timeout: number;
  };
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// API Request/Response Mappers
export interface EntityMapper<TEntity, TDto> {
  toDto(entity: TEntity): TDto;
  toEntity(dto: TDto): TEntity;
  toDtoList(entities: TEntity[]): TDto[];
  toEntityList(dtos: TDto[]): TEntity[];
}

// Repository Types
export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(limit?: number, offset?: number): Promise<TEntity[]>;
  create(entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity>;
  update(id: TId, updates: Partial<TEntity>): Promise<TEntity | null>;
  delete(id: TId): Promise<boolean>;
  count(): Promise<number>;
}

// Service Interfaces
export interface UserService {
  register(email: string, password: string): Promise<UserEntity>;
  login(email: string, password: string): Promise<{ user: UserEntity; token: string }>;
  getProfile(userId: number): Promise<UserEntity>;
  updatePreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserEntity>;
  validateCredentials(email: string, password: string): Promise<boolean>;
}

export interface ProductService {
  findById(id: number): Promise<ProductEntity | null>;
  findAll(filters: SearchFilters, limit: number, offset: number): Promise<ProductEntity[]>;
  search(query: SearchQuery): Promise<SearchResult>;
  getCategories(): Promise<string[]>;
  getBrands(): Promise<string[]>;
}

export interface RecommendationService {
  getRecommendations(context: RecommendationContext): Promise<RecommendationScore[]>;
  updateUserPreferences(userId: number, interaction: InteractionEntity): Promise<void>;
  getPopularProducts(category?: string, limit?: number): Promise<ProductEntity[]>;
  getSimilarProducts(productId: number, limit?: number): Promise<ProductEntity[]>;
}

export interface InteractionService {
  record(interaction: Omit<InteractionEntity, 'id' | 'timestamp'>): Promise<InteractionEntity>;
  getUserInteractions(userId: number, limit?: number): Promise<InteractionEntity[]>;
  getProductInteractions(productId: number, limit?: number): Promise<InteractionEntity[]>;
  getInteractionStats(userId: number): Promise<Record<string, number>>;
}
