export interface Model3D {
    id: string;
    url: string;
    format: 'glb' | 'gltf';
    vertices: number;
    triangles: number;
}
export interface RenderOptions {
    enableShadows: boolean;
    enableLighting: boolean;
    targetFPS: number;
    lodEnabled: boolean;
    cullingEnabled: boolean;
}
export interface LightingConfig {
    ambient: {
        intensity: number;
        color: string;
    };
    directional: {
        intensity: number;
        direction: {
            x: number;
            y: number;
            z: number;
        };
        color: string;
    };
    shadows: {
        enabled: boolean;
        quality: 'low' | 'medium' | 'high';
    };
}
export declare class Renderer3D {
    private models;
    private readonly SUPPORTED_FORMATS;
    private readonly FRAME_TIME_MS;
    loadModel(url: string, format: 'glb' | 'gltf'): Promise<Model3D>;
    validateFormat(format: string): boolean;
    handleLoadingError(error: Error): {
        success: boolean;
        error: string;
    };
    private generateModelId;
    maintainFrameRate(deltaTime: number): boolean;
    implementLOD(distance: number, model: Model3D): Model3D;
    cullOffscreenObjects(objects: Array<{
        position: {
            x: number;
            y: number;
            z: number;
        };
        radius: number;
    }>, cameraPosition: {
        x: number;
        y: number;
        z: number;
    }, viewDistance: number): Array<{
        position: {
            x: number;
            y: number;
            z: number;
        };
        radius: number;
    }>;
    applyLighting(model: Model3D, _lightingConfig: LightingConfig): Model3D;
    castShadows(model: Model3D, _enabled: boolean): Model3D;
    matchRoomLighting(roomLighting: {
        ambientLevel: number;
        sources: Array<{
            intensity: number;
        }>;
    }, _model: Model3D): LightingConfig;
}
//# sourceMappingURL=3d-renderer.d.ts.map