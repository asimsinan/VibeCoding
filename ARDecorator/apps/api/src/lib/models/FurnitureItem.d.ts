import { FurnitureItem as PrismaFurnitureItem } from '@prisma/client';
/**
 * FurnitureItem Model
 * Represents a furniture item in the catalog
 */
export interface FurnitureItem extends PrismaFurnitureItem {
}
export type FurnitureCategory = 'seating' | 'tables' | 'storage' | 'lighting' | 'decor';
export type FurnitureStyle = 'modern' | 'traditional' | 'minimalist' | 'industrial' | 'scandinavian';
export interface FurnitureDimensions {
    width: number;
    height: number;
    depth: number;
}
export interface CreateFurnitureInput {
    name: string;
    description?: string;
    category: FurnitureCategory;
    style?: FurnitureStyle;
    price: number;
    dimensions: FurnitureDimensions;
    modelUrl: string;
    thumbnailUrl: string;
}
export interface UpdateFurnitureInput {
    name?: string;
    description?: string;
    category?: FurnitureCategory;
    style?: FurnitureStyle;
    price?: number;
    dimensions?: FurnitureDimensions;
    modelUrl?: string;
    thumbnailUrl?: string;
}
export interface FurnitureListFilters {
    category?: FurnitureCategory;
    style?: FurnitureStyle;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
}
//# sourceMappingURL=FurnitureItem.d.ts.map