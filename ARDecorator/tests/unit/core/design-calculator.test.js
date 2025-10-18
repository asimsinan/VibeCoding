import { describe, it, expect } from 'vitest';
import { DesignCalculator } from '../../../packages/3d-engine/src/design-calculator';
describe('Design Calculator Core Logic', () => {
    const calculator = new DesignCalculator();
    describe('Cost Calculation', () => {
        it('should calculate total cost of all furniture items', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [],
                furniture: [
                    { id: '1', name: 'Sofa', price: 500, dimensions: { width: 2, height: 1, depth: 1 } },
                    { id: '2', name: 'Table', price: 300, dimensions: { width: 1.5, height: 0.8, depth: 1 } },
                ],
            };
            const totalCost = calculator.calculateTotalCost(design);
            expect(totalCost).toBe(800);
        });
        it('should handle empty design (0 items)', () => {
            const design = {
                id: '1',
                name: 'Empty Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [],
                furniture: [],
            };
            const totalCost = calculator.calculateTotalCost(design);
            expect(totalCost).toBe(0);
        });
        it('should apply discounts when applicable', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [],
                furniture: [
                    { id: '1', name: 'Sofa', price: 500, dimensions: { width: 2, height: 1, depth: 1 } },
                    { id: '2', name: 'Table', price: 300, dimensions: { width: 1.5, height: 0.8, depth: 1 } },
                    { id: '3', name: 'Chair', price: 200, dimensions: { width: 0.6, height: 1, depth: 0.6 } },
                ],
            };
            const discountRules = [{ minItems: 3, discountPercent: 10 }];
            const totalCost = calculator.calculateTotalCost(design, discountRules);
            expect(totalCost).toBe(900); // 1000 - 10%
        });
    });
    describe('Dimension Calculation', () => {
        it('should calculate total floor space used', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [
                    {
                        id: '1',
                        position: { x: 2, y: 0, z: 2 },
                        rotation: 0,
                        scale: 1,
                        dimensions: { width: 2, height: 1, depth: 1 },
                    },
                ],
                furniture: [],
            };
            const floorSpace = calculator.calculateFloorSpaceUsed(design);
            expect(floorSpace).toBe(2); // 2 * 1
        });
        it('should calculate room utilization percentage', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [
                    {
                        id: '1',
                        position: { x: 2, y: 0, z: 2 },
                        rotation: 0,
                        scale: 1,
                        dimensions: { width: 2, height: 1, depth: 1 },
                    },
                ],
                furniture: [],
            };
            const utilization = calculator.calculateRoomUtilization(design);
            expect(utilization).toBe(10); // (2 / 20) * 100
        });
    });
    describe('Design Validation', () => {
        it('should validate design has at least one furniture item', () => {
            const design = {
                id: '1',
                name: 'Empty Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [],
                furniture: [],
            };
            const result = calculator.validateDesign(design);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Design must have at least one furniture item');
        });
        it('should validate all furniture items are within room bounds', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [
                    {
                        id: '1',
                        position: { x: 10, y: 0, z: 2 },
                        rotation: 0,
                        scale: 1,
                        dimensions: { width: 2, height: 1, depth: 1 },
                    },
                ],
                furniture: [{ id: '1', name: 'Sofa', price: 500, dimensions: { width: 2, height: 1, depth: 1 } }],
            };
            const result = calculator.validateDesign(design);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should detect overlapping furniture', () => {
            const design = {
                id: '1',
                name: 'Test Design',
                roomBounds: { width: 5, height: 3, depth: 4 },
                placements: [
                    {
                        id: '1',
                        position: { x: 2, y: 0, z: 2 },
                        rotation: 0,
                        scale: 1,
                        dimensions: { width: 1, height: 1, depth: 1 },
                    },
                    {
                        id: '2',
                        position: { x: 2.5, y: 0, z: 2 },
                        rotation: 0,
                        scale: 1,
                        dimensions: { width: 1, height: 1, depth: 1 },
                    },
                ],
                furniture: [
                    { id: '1', name: 'Sofa', price: 500, dimensions: { width: 1, height: 1, depth: 1 } },
                    { id: '2', name: 'Table', price: 300, dimensions: { width: 1, height: 1, depth: 1 } },
                ],
            };
            const result = calculator.validateDesign(design);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('overlapping'))).toBe(true);
        });
    });
});
//# sourceMappingURL=design-calculator.test.js.map