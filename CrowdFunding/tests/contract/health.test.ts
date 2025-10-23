import request from 'supertest';
import app from '../../src/app';

// Contract tests for Health API endpoint
describe('Health API Contract Tests', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.version).toBe('string');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
