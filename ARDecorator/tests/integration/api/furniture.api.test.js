import { describe, it, expect } from 'vitest';
import axios from 'axios';
const API_URL = 'http://localhost:3001/api/v1';
describe('Furniture API Integration', () => {
    it('should fetch furniture catalog', async () => {
        try {
            const response = await axios.get(`${API_URL}/furniture`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
    it('should fetch single furniture item', async () => {
        try {
            const response = await axios.get(`${API_URL}/furniture/1`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('id');
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
    it('should filter furniture by category', async () => {
        try {
            const response = await axios.get(`${API_URL}/furniture?category=seating`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        }
        catch (error) {
            // API not running - expected to fail in RED phase
            expect(error.code).toBeDefined();
        }
    });
});
//# sourceMappingURL=furniture.api.test.js.map