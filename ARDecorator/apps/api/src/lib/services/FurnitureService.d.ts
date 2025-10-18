import type { FurnitureItem, CreateFurnitureInput, UpdateFurnitureInput, FurnitureListFilters } from '../models/FurnitureItem';
export declare class FurnitureService {
    createFurniture(input: CreateFurnitureInput): Promise<FurnitureItem>;
    listFurniture(filters: FurnitureListFilters, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            category: string;
            style: string | null;
            price: number;
            dimensions: string;
            modelUrl: string;
            thumbnailUrl: string;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getFurnitureById(id: string): Promise<FurnitureItem | null>;
    updateFurniture(id: string, input: UpdateFurnitureInput): Promise<FurnitureItem>;
    deleteFurniture(id: string): Promise<void>;
}
//# sourceMappingURL=FurnitureService.d.ts.map