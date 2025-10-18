export interface RoomDimensions {
    width: number;
    height: number;
    depth: number;
    area: number;
}
export interface Surface {
    type: 'floor' | 'wall' | 'ceiling';
    vertices: number[][];
    normal: number[];
}
export interface LightSource {
    position: {
        x: number;
        y: number;
        z: number;
    };
    intensity: number;
    type: 'ambient' | 'directional' | 'point';
}
export interface LightingAnalysis {
    ambientLevel: number;
    sources: LightSource[];
    dominantDirection: {
        x: number;
        y: number;
        z: number;
    };
}
export declare class RoomAnalyzer {
    detectDimensions(_imageData: any): RoomDimensions;
    estimateDepth(_imageData: any): number;
    calculateArea(width: number, depth: number): number;
    detectSurfaces(_imageData: any): Surface[];
    detectFloor(_imageData: any): Surface;
    detectWalls(_imageData: any): Surface[];
    detectCeiling(_imageData: any): Surface;
    analyzeLighting(_imageData: any): LightingAnalysis;
    detectLightSources(_imageData: any): LightSource[];
    calculateAmbientLight(_imageData: any): number;
}
//# sourceMappingURL=room-analyzer.d.ts.map