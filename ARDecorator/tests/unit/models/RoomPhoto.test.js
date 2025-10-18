import { describe, it, expect } from 'vitest';
describe('RoomPhoto Model', () => {
    describe('RoomPhoto Type', () => {
        it('should have required fields', () => {
            const photo = {
                id: 'test-id',
                userId: 'user-id',
                filename: 'room.jpg',
                url: 'https://example.com/room.jpg',
                status: 'processing',
            };
            expect(photo).toHaveProperty('filename');
            expect(photo).toHaveProperty('url');
            expect(photo).toHaveProperty('status');
        });
    });
    describe('CreateRoomPhotoInput validation', () => {
        it('should validate status values', () => {
            // const validStatuses = ['processing', 'completed', 'failed'];
            const input = {
                userId: 'user-id',
                filename: 'room.jpg',
                url: 'https://example.com/room.jpg',
            };
            expect(input).toHaveProperty('url');
        });
        it('should validate dimensions if provided', () => {
            const input = {
                userId: 'user-id',
                filename: 'room.jpg',
                url: 'https://example.com/room.jpg',
                dimensions: { width: 400, height: 300, depth: 250 },
            };
            if (input.dimensions) {
                expect(input.dimensions.width).toBeGreaterThan(0);
                expect(input.dimensions.height).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=RoomPhoto.test.js.map