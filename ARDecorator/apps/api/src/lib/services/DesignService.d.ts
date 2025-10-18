import type { Design, CreateDesignInput, UpdateDesignInput } from '../models/Design';
export declare class DesignService {
    createDesign(input: CreateDesignInput): Promise<Design>;
    listDesigns(userId: string, page?: number, limit?: number): Promise<{
        designs: {
            id: string;
            name: string;
            furnitureCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getDesignById(id: string): Promise<any>;
    updateDesign(id: string, input: UpdateDesignInput): Promise<Design>;
    deleteDesign(id: string): Promise<void>;
}
//# sourceMappingURL=DesignService.d.ts.map