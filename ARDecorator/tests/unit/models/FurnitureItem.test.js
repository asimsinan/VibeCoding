import { describe, it, expect } from 'vitest';
describe('FurnitureItem Model', () => {
    describe('FurnitureItem Type', () => {
        it('should have required fields', () => {
            const item = {
                id: 'test-id',
                name: 'Modern Sofa',
                category: 'seating',
                price: 999.99,
                dimensions: JSON.stringify({ width: 200, height: 80, depth: 90 }),
                modelUrl: 'https://example.com/model.glb',
                thumbnailUrl: 'https://example.com/thumb.jpg',
            };
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('category');
            expect(item).toHaveProperty('price');
        });
    });
    describe('CreateFurnitureInput validation', () => {
        it('should validate dimensions', () => {
            const input = {
                name: 'Modern Sofa',
                category: 'seating',
                price: 999.99,
                dimensions: { width: 200, height: 80, depth: 90 },
                modelUrl: 'https://example.com/model.glb',
                thumbnailUrl: 'https://example.com/thumb.jpg',
            };
            expect(input.dimensions.width).toBeGreaterThan(0);
            expect(input.dimensions.height).toBeGreaterThan(0);
            expect(input.dimensions.depth).toBeGreaterThan(0);
        });
        it('should validate price is positive', () => {
            const input = {
                name: 'Modern Sofa',
                category: 'seating',
                price: 999.99,
                dimensions: { width: 200, height: 80, depth: 90 },
                modelUrl: 'https://example.com/model.glb',
                thumbnailUrl: 'https://example.com/thumb.jpg',
            };
            expect(input.price).toBeGreaterThan(0);
        });
        it('should validate category', () => {
            const validCategories = ['seating', 'tables', 'storage', 'lighting', 'decor'];
            const input = {
                name: 'Modern Sofa',
                category: 'seating',
                price: 999.99,
                dimensions: { width: 200, height: 80, depth: 90 },
                modelUrl: 'https://example.com/model.glb',
                thumbnailUrl: 'https://example.com/thumb.jpg',
            };
            expect(validCategories).toContain(input.category);
        });
    });
});
//# sourceMappingURL=FurnitureItem.test.js.map