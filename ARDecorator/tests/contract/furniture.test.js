import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../apps/api/src/app';
let app;
const API_BASE = '/api/v1';
describe('Furniture API Contract Tests', () => {
    beforeAll(async () => {
        app = createApp();
    });
    describe('GET /furniture', () => {
        it('should list furniture items with pagination', async () => {
            const response = await request(app)
                .get(`${API_BASE}/furniture`)
                .query({ page: 1, limit: 20 });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.items)).toBe(true);
        });
        it('should filter by category', async () => {
            const response = await request(app)
                .get(`${API_BASE}/furniture`)
                .query({ category: 'seating' });
            expect(response.status).toBe(200);
            expect(response.body.items.every((item) => item.category === 'seating')).toBe(true);
        });
        it('should filter by price range', async () => {
            const response = await request(app)
                .get(`${API_BASE}/furniture`)
                .query({ minPrice: 100, maxPrice: 500 });
            expect(response.status).toBe(200);
            expect(response.body.items.every((item) => item.price >= 100 && item.price <= 500)).toBe(true);
        });
    });
    describe('GET /furniture/:id', () => {
        it('should return furniture item by id', async () => {
            const response = await request(app)
                .get(`${API_BASE}/furniture/test-id`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('price');
        });
        it('should return 404 for non-existent item', async () => {
            const response = await request(app)
                .get(`${API_BASE}/furniture/non-existent-id`);
            expect(response.status).toBe(404);
        });
    });
    describe('POST /furniture', () => {
        it('should create furniture item (admin only)', async () => {
            const response = await request(app)
                .post(`${API_BASE}/furniture`)
                .set('Authorization', 'Bearer admin-token')
                .field('name', 'Modern Sofa')
                .field('category', 'seating')
                .field('price', '999.99')
                .field('dimensions', JSON.stringify({ width: 200, height: 80, depth: 90 }))
                .attach('model', Buffer.from('model-data'), 'model.glb')
                .attach('thumbnail', Buffer.from('image-data'), 'thumbnail.jpg');
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
        });
        it('should return 403 for non-admin users', async () => {
            const response = await request(app)
                .post(`${API_BASE}/furniture`)
                .set('Authorization', 'Bearer user-token')
                .send({});
            expect(response.status).toBe(403);
        });
    });
    describe('PUT /furniture/:id', () => {
        it('should update furniture item (admin only)', async () => {
            const response = await request(app)
                .put(`${API_BASE}/furniture/test-id`)
                .set('Authorization', 'Bearer admin-token')
                .send({
                name: 'Updated Sofa',
                price: 1099.99,
            });
            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Sofa');
        });
    });
    describe('DELETE /furniture/:id', () => {
        it('should delete furniture item (admin only)', async () => {
            const response = await request(app)
                .delete(`${API_BASE}/furniture/test-id`)
                .set('Authorization', 'Bearer admin-token');
            expect(response.status).toBe(200);
        });
    });
});
//# sourceMappingURL=furniture.test.js.map