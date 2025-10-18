export interface Position {
    x: number;
    y: number;
    z: number;
}
export interface Dimensions {
    width: number;
    height: number;
    depth: number;
}
export interface FurniturePlacement {
    id: string;
    position: Position;
    rotation: number;
    scale: number;
    dimensions: Dimensions;
}
export interface RoomBounds {
    width: number;
    height: number;
    depth: number;
}
export declare class FurniturePlacementEngine {
    private readonly MIN_SCALE;
    private readonly MAX_SCALE;
    private readonly SNAP_ANGLES;
    validatePosition(position: Position, dimensions: Dimensions, roomBounds: RoomBounds): boolean;
    detectCollision(item1: FurniturePlacement, item2: FurniturePlacement): boolean;
    private getBoundingBox;
    calculateOptimalPlacement(dimensions: Dimensions, roomBounds: RoomBounds, existingItems: FurniturePlacement[]): Position | null;
    validateScale(scale: number): boolean;
    enforceScaleLimits(scale: number): number;
    maintainAspectRatio(originalDimensions: Dimensions, scale: number): Dimensions;
    rotateFurniture(currentRotation: number, angle: number): number;
    snapRotation(rotation: number, threshold?: number): number;
}
//# sourceMappingURL=furniture-placement.d.ts.map