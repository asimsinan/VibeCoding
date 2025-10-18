import { FurniturePlacement, RoomBounds } from './furniture-placement';
export interface FurnitureItem {
    id: string;
    name: string;
    price: number;
    dimensions: {
        width: number;
        height: number;
        depth: number;
    };
}
export interface Design {
    id: string;
    name: string;
    roomBounds: RoomBounds;
    placements: FurniturePlacement[];
    furniture: FurnitureItem[];
}
export interface DiscountRule {
    minItems: number;
    discountPercent: number;
}
export declare class DesignCalculator {
    calculateTotalCost(design: Design, discountRules?: DiscountRule[]): number;
    private calculateDiscount;
    calculateFloorSpaceUsed(design: Design): number;
    calculateRoomUtilization(design: Design): number;
    validateDesign(design: Design): {
        valid: boolean;
        errors: string[];
    };
    private checkOverlap;
    private getBoundingBox;
}
//# sourceMappingURL=design-calculator.d.ts.map