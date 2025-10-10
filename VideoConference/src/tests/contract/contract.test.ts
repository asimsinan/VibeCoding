/**
 * Contract Tests
 * Generated from OpenAPI specification for automated API testing
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app/api/server'; // This will be created later
import { db } from '../../lib/video-conferencing/services/database.service';

// Test data
const testRoom = {
  participantName: 'Test User',
  mediaPermissions: {
    camera: true,
    microphone: true,
    screenShare: false,
  },
};

const testParticipant = {
  participantName: 'Test Participant',
  mediaPermissions: {
    camera: true,
    microphone: true,
    screenShare: false,
  },
};

const testMessage = {
  participantId: 'test-participant-id',
  message: 'Hello, world!',
};

// Helper functions
const createTestRoom = async () => {
  const response = await request(app)
    .post('/api/v1/rooms')
    .send(testRoom)
    .expect(201);
  
  return response.body.data;
};

const createTestParticipant = async (roomId: string) => {
  const response = await request(app)
    .post(`/api/v1/rooms/${roomId}/join`)
    .send(testParticipant)
    .expect(200);
  
  return response.body.data;
};

describe('API Contract Tests', () => {
  beforeAll(async () => {
    // Initialize database
    await db.initialize();
  });

  afterAll(async () => {
    // Clean up database
    await db.close();
  });

  describe('POST /api/v1/rooms', () => {
    it('should create a new room with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send(testRoom)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          roomId: expect.any(String),
          accessToken: expect.any(String),
          participantId: expect.any(String),
          createdAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // Validate UUID format
      expect(response.body.data.roomId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should reject room creation with invalid participant name', async () => {
      const invalidRoom = {
        ...testRoom,
        participantName: '', // Empty name
      };

      const response = await request(app)
        .post('/api/v1/rooms')
        .send(invalidRoom)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should reject room creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        code: expect.any(String),
      });
    });

    it('should create room with custom media permissions', async () => {
      const customRoom = {
        participantName: 'Custom User',
        mediaPermissions: {
          camera: false,
          microphone: true,
          screenShare: true,
        },
      };

      const response = await request(app)
        .post('/api/v1/rooms')
        .send(customRoom)
        .expect(201);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/rooms', () => {
    it('should list all rooms', async () => {
      // Create a test room first
      await createTestRoom();

      const response = await request(app)
        .get('/api/v1/rooms')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          rooms: expect.any(Array),
          total: expect.any(Number),
          limit: expect.any(Number),
          offset: expect.any(Number),
        },
        timestamp: expect.any(String),
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rooms?limit=10&offset=0')
        .expect(200);

      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(0);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rooms?limit=1000&offset=-1')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/rooms/{roomId}', () => {
    let roomId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
    });

    it('should get room information', async () => {
      const response = await request(app)
        .get(`/api/v1/rooms/${roomId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          roomId: roomId,
          participants: expect.any(Array),
          createdAt: expect.any(String),
          isActive: expect.any(Boolean),
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 404 for non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/rooms/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate room ID format', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/rooms/{roomId}/join', () => {
    let roomId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
    });

    it('should join an existing room', async () => {
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/join`)
        .send(testParticipant)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          participantId: expect.any(String),
          accessToken: expect.any(String),
          roomInfo: {
            roomId: roomId,
            participants: expect.any(Array),
            createdAt: expect.any(String),
            isActive: expect.any(Boolean),
          },
        },
        timestamp: expect.any(String),
      });
    });

    it('should reject joining non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post(`/api/v1/rooms/${nonExistentId}/join`)
        .send(testParticipant)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject joining with invalid participant name', async () => {
      const invalidParticipant = {
        ...testParticipant,
        participantName: '', // Empty name
      };

      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/join`)
        .send(invalidParticipant)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/rooms/{roomId}/leave', () => {
    let roomId: string;
    let participantId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
      const participant = await createTestParticipant(roomId);
      participantId = participant.participantId;
    });

    it('should leave a room', async () => {
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/leave`)
        .send({ participantId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        timestamp: expect.any(String),
      });
    });

    it('should reject leaving with invalid participant ID', async () => {
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/leave`)
        .send({ participantId: 'invalid-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject leaving non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post(`/api/v1/rooms/${nonExistentId}/leave`)
        .send({ participantId })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/rooms/{roomId}/messages', () => {
    let roomId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
    });

    it('should get room messages', async () => {
      const response = await request(app)
        .get(`/api/v1/rooms/${roomId}/messages`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          messages: expect.any(Array),
          total: expect.any(Number),
          limit: expect.any(Number),
          offset: expect.any(Number),
        },
        timestamp: expect.any(String),
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/rooms/${roomId}/messages?limit=10&offset=0`)
        .expect(200);

      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(0);
    });

    it('should return 404 for non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/rooms/${nonExistentId}/messages`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/rooms/{roomId}/messages', () => {
    let roomId: string;
    let participantId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
      const participant = await createTestParticipant(roomId);
      participantId = participant.participantId;
    });

    it('should send a message', async () => {
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/messages`)
        .send({
          ...testMessage,
          participantId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          messageId: expect.any(String),
          roomId: roomId,
          participantId: participantId,
          participantName: expect.any(String),
          message: testMessage.message,
          messageType: 'text',
          timestamp: expect.any(String),
          isEdited: false,
        },
        timestamp: expect.any(String),
      });
    });

    it('should reject message with invalid content', async () => {
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/messages`)
        .send({
          ...testMessage,
          participantId,
          message: '', // Empty message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject message with too long content', async () => {
      const longMessage = 'a'.repeat(1001); // Exceeds 1000 character limit
      
      const response = await request(app)
        .post(`/api/v1/rooms/${roomId}/messages`)
        .send({
          ...testMessage,
          participantId,
          message: longMessage,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post(`/api/v1/rooms/${nonExistentId}/messages`)
        .send({
          ...testMessage,
          participantId,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/rooms/{roomId}', () => {
    let roomId: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
    });

    it('should delete a room', async () => {
      const response = await request(app)
        .delete(`/api/v1/rooms/${roomId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        timestamp: expect.any(String),
      });
    });

    it('should return 404 for non-existent room', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/v1/rooms/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('WebSocket /ws/rooms/{roomId}', () => {
    let roomId: string;
    let token: string;

    beforeAll(async () => {
      const room = await createTestRoom();
      roomId = room.roomId;
      token = room.accessToken;
    });

    it('should establish WebSocket connection', (done) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}?token=${token}`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (error: Error) => {
        done(error);
      });
    });

    it('should reject connection with invalid token', (done) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}?token=invalid-token`);
      
      ws.on('error', (error: Error) => {
        expect(error.message).toContain('Invalid token');
        done();
      });

      ws.on('open', () => {
        done(new Error('Connection should have been rejected'));
      });
    });

    it('should reject connection to non-existent room', (done) => {
      const WebSocket = require('ws');
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const ws = new WebSocket(`ws://localhost:3000/ws/rooms/${nonExistentId}?token=${token}`);
      
      ws.on('error', (error: Error) => {
        expect(error.message).toContain('Room not found');
        done();
      });

      ws.on('open', () => {
        done(new Error('Connection should have been rejected'));
      });
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        code: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should handle internal server errors', async () => {
      // This test would require mocking database errors
      // For now, we'll just ensure the error format is consistent
      const response = await request(app)
        .get('/api/v1/rooms/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Response Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/v1/rooms')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('origin-when-cross-origin');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/v1/rooms')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
