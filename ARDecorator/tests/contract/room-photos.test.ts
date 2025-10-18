import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../apps/api/src/app';

let app: any;
const API_BASE = '/api/v1';

describe('Room Photos API Contract Tests', () => {
  beforeAll(async () => {
    app = createApp();
  });

  describe('POST /room-photos', () => {
    it('should upload room photo', async () => {
      const response = await request(app)
        .post(`${API_BASE}/room-photos`)
        .set('Authorization', 'Bearer valid-token')
        .attach('photo', Buffer.from('image-data'), 'room.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body.status).toBe('processing');
    });

    it('should return 400 for invalid file', async () => {
      const response = await request(app)
        .post(`${API_BASE}/room-photos`)
        .set('Authorization', 'Bearer valid-token')
        .attach('photo', Buffer.from('not-an-image'), 'file.txt');

      expect(response.status).toBe(400);
    });

    it('should return 413 for file too large', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const response = await request(app)
        .post(`${API_BASE}/room-photos`)
        .set('Authorization', 'Bearer valid-token')
        .attach('photo', largeBuffer, 'large.jpg');

      expect(response.status).toBe(413);
    });
  });

  describe('GET /room-photos/:id', () => {
    it('should get room photo details', async () => {
      const response = await request(app)
        .get(`${API_BASE}/room-photos/photo-id`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get(`${API_BASE}/room-photos/non-existent`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /room-photos/:id', () => {
    it('should delete room photo', async () => {
      const response = await request(app)
        .delete(`${API_BASE}/room-photos/photo-id`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });
});

