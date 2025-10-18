import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../apps/api/src/app';
let app;
const API_BASE = '/api/v1';
describe('Designs API Contract Tests', () => {
    beforeAll(async () => {
        app = createApp();
    });
    describe('GET /designs', () => {
        it('should list user designs with pagination', async () => {
            const response = await request(app)
                .get(`${API_BASE}/designs`)
                .set('Authorization', 'Bearer valid-token')
                .query({ page: 1, limit: 20 });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('designs');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.designs)).toBe(true);
        });
    });
    describe('POST /designs', () => {
        it('should create new design', async () => {
            const response = await request(app)
                .post(`${API_BASE}/designs`)
                .set('Authorization', 'Bearer valid-token')
                .send({
                name: 'Living Room Design',
                roomPhotoId: 'room-photo-id',
                placedFurniture: [
                    {
                        furnitureId: 'furniture-id',
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 90, z: 0 },
                        scale: 1.0,
                    },
                ],
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('Living Room Design');
        });
        it('should return 400 for invalid data', async () => {
            const response = await request(app)
                .post(`${API_BASE}/designs`)
                .set('Authorization', 'Bearer valid-token')
                .send({
                name: '',
            });
            expect(response.status).toBe(400);
        });
    });
    describe('GET /designs/:id', () => {
        it('should return design details', async () => {
            const response = await request(app)
                .get(`${API_BASE}/designs/design-id`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('placedFurniture');
        });
        it('should return 404 for non-existent design', async () => {
            const response = await request(app)
                .get(`${API_BASE}/designs/non-existent`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(404);
        });
    });
    describe('PUT /designs/:id', () => {
        it('should update design', async () => {
            const response = await request(app)
                .put(`${API_BASE}/designs/design-id`)
                .set('Authorization', 'Bearer valid-token')
                .send({
                name: 'Updated Design',
                placedFurniture: [],
            });
            expect(response.status).toBe(200);
        });
    });
    describe('DELETE /designs/:id', () => {
        it('should delete design', async () => {
            const response = await request(app)
                .delete(`${API_BASE}/designs/design-id`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
        });
    });
    describe('POST /designs/:id/share', () => {
        it('should create shareable link', async () => {
            const response = await request(app)
                .post(`${API_BASE}/designs/design-id/share`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('shareToken');
            expect(response.body).toHaveProperty('shareUrl');
        });
    });
    describe('GET /shared/:token', () => {
        it('should view shared design', async () => {
            const response = await request(app)
                .get(`${API_BASE}/shared/share-token`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('design');
            expect(response.body).toHaveProperty('owner');
        });
        it('should return 404 for invalid token', async () => {
            const response = await request(app)
                .get(`${API_BASE}/shared/invalid-token`);
            expect(response.status).toBe(404);
        });
    });
    describe('POST /designs/:id/report', () => {
        it('should generate design report', async () => {
            const response = await request(app)
                .post(`${API_BASE}/designs/design-id/report`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(202);
            expect(response.body).toHaveProperty('reportId');
            expect(response.body.status).toBe('generating');
        });
    });
    describe('GET /reports/:id', () => {
        it('should get report status', async () => {
            const response = await request(app)
                .get(`${API_BASE}/reports/report-id`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
        });
    });
});
//# sourceMappingURL=designs.test.js.map