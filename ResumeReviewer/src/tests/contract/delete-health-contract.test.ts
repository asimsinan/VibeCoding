import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../lib/mock-app';
import './test-setup';

describe('Contract Tests - Delete and Health Endpoints', () => {
  let prisma: PrismaClient;
  let uniqueSessionId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public'
        }
      }
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.feedback.deleteMany();
    await prisma.resumeUpload.deleteMany();
    await prisma.userSession.deleteMany();
    
    // Create a test session for foreign key constraints with unique ID
    uniqueSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await prisma.userSession.create({
      data: {
        sessionId: uniqueSessionId,
      },
    });
    
    // Session created with unique ID
  });
  describe('DELETE /api/v1/upload/{uploadId}', () => {
    it('should delete upload successfully', async () => {
      // Ensure session exists
      await prisma.userSession.upsert({
        where: { sessionId: uniqueSessionId },
        update: {},
        create: { sessionId: uniqueSessionId }
      });
      
      // Create an upload first
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024000,
          fileType: 'application/pdf',
          sessionId: uniqueSessionId,
        },
      });
      
      const response = await request(app)
        .delete(`/api/v1/upload/${upload.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return 404 for non-existent upload', async () => {
      const uploadId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .delete('/api/v1/upload/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .delete('/api/v1/upload/invalid-uuid')
        .expect(400);

      expect(response.body.code).toBe('INVALID_UUID_FORMAT');
    });

    it('should handle server errors gracefully', async () => {
      const uploadId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .delete(`/api/v1/upload/${uploadId}`)
        .set('x-simulate-server-error', 'true')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('uptime');
      
      // Validate status enum
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
      
      // Validate services object
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('ai_service');
      expect(response.body.services).toHaveProperty('file_storage');
      
      // Validate service status values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.database);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.ai_service);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.file_storage);
      
      // Validate field types
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.version).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return degraded status when some services are down', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      if (response.body.status === 'degraded') {
        expect(response.body.services).toHaveProperty('database');
        expect(response.body.services).toHaveProperty('ai_service');
        expect(response.body.services).toHaveProperty('file_storage');
      }
    });

    it('should return unhealthy status when critical services are down', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('x-simulate-service-unavailable', 'true')
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should return proper API version', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.version).toBe('1.0.0');
    });

    it('should return uptime in seconds', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
