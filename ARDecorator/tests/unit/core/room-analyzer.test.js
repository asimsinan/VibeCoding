import { describe, it, expect } from 'vitest';
import { RoomAnalyzer } from '../../../packages/3d-engine/src/room-analyzer';
describe('Room Analyzer Core Logic', () => {
    const analyzer = new RoomAnalyzer();
    describe('Room Dimension Detection', () => {
        it('should detect room width and height from image', () => {
            const dimensions = analyzer.detectDimensions('mock-image-data');
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(0);
        });
        it('should estimate room depth', () => {
            const depth = analyzer.estimateDepth('mock-image-data');
            expect(depth).toBeGreaterThan(0);
        });
        it('should calculate room area', () => {
            const area = analyzer.calculateArea(5.0, 4.0);
            expect(area).toBe(20.0);
        });
    });
    describe('Surface Detection', () => {
        it('should detect floor surface', () => {
            const floor = analyzer.detectFloor('mock-image-data');
            expect(floor.type).toBe('floor');
            expect(floor.vertices.length).toBeGreaterThan(0);
        });
        it('should detect wall surfaces', () => {
            const walls = analyzer.detectWalls('mock-image-data');
            expect(walls.length).toBeGreaterThan(0);
            expect(walls.every((w) => w.type === 'wall')).toBe(true);
        });
        it('should detect ceiling surface', () => {
            const ceiling = analyzer.detectCeiling('mock-image-data');
            expect(ceiling.type).toBe('ceiling');
            expect(ceiling.vertices.length).toBeGreaterThan(0);
        });
    });
    describe('Lighting Analysis', () => {
        it('should analyze room lighting conditions', () => {
            const lighting = analyzer.analyzeLighting('mock-image-data');
            expect(lighting.ambientLevel).toBeGreaterThan(0);
            expect(lighting.sources.length).toBeGreaterThan(0);
        });
        it('should detect light sources', () => {
            const sources = analyzer.detectLightSources('mock-image-data');
            expect(sources.length).toBeGreaterThan(0);
        });
        it('should calculate ambient light level', () => {
            const ambientLevel = analyzer.calculateAmbientLight('mock-image-data');
            expect(ambientLevel).toBeGreaterThan(0);
            expect(ambientLevel).toBeLessThanOrEqual(1);
        });
    });
});
//# sourceMappingURL=room-analyzer.test.js.map