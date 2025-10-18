import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
describe('Furniture Repository Integration Tests', () => {
    beforeAll(async () => {
        // Setup test database
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('CREATE operations', () => {
        it('should create furniture item', async () => {
            const item = await prisma.furnitureItem.create({
                data: {
                    name: 'Modern Sofa',
                    category: 'seating',
                    price: 999.99,
                    dimensions: JSON.stringify({ width: 200, height: 80, depth: 90 }),
                    modelUrl: 'https://example.com/model.glb',
                    thumbnailUrl: 'https://example.com/thumb.jpg',
                },
            });
            expect(item).toHaveProperty('id');
            expect(item.name).toBe('Modern Sofa');
        });
    });
    describe('READ operations', () => {
        it('should list furniture by category', async () => {
            const items = await prisma.furnitureItem.findMany({
                where: { category: 'seating' },
            });
            expect(Array.isArray(items)).toBe(true);
            items.forEach(item => {
                expect(item.category).toBe('seating');
            });
        });
        it('should filter by price range', async () => {
            const items = await prisma.furnitureItem.findMany({
                where: {
                    price: {
                        gte: 100,
                        lte: 1000,
                    },
                },
            });
            expect(Array.isArray(items)).toBe(true);
        });
    });
});
//# sourceMappingURL=furniture.repository.test.js.map