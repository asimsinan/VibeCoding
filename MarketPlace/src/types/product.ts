// Product Types
// TypeScript type definitions for product-related data

// Product is defined in database.ts
export type { Product } from './database';

export interface ProductCreateData {
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
}

export interface ProductUpdateData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
  isAvailable?: boolean;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductFilter {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  sellerId?: string;
}

export interface ProductStats {
  totalViews: number;
  totalFavorites: number;
  totalOrders: number;
  conversionRate: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  productCount: number;
  children?: ProductCategory[];
}