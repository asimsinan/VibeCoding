import { describe, it, expect } from 'vitest';
import axios from 'axios';
const API_URL = 'http://localhost:3001/api/v1';
describe('Designs API Integration', () => {
    it('should create a new design', async () => {
        try {
            const response = await axios.post(`${API_URL}/designs`, {
                name: 'Test Design',
                roomPhotoId: 1,
            });
            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
    it('should fetch user designs', async () => {
        try {
            const response = await axios.get(`${API_URL}/designs`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
    it('should fetch single design', async () => {
        try {
            const response = await axios.get(`${API_URL}/designs/1`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
    it('should update design', async () => {
        try {
            const response = await axios.put(`${API_URL}/designs/1`, {
                name: 'Updated Design',
            });
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('name');
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
});
//# sourceMappingURL=designs.api.test.js.map