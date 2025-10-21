import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../lib/mock-app';
import './test-setup';

// Test data
const testResumeUpload = {
  fileName: 'test-resume.pdf',
  fileSize: 1024000,
  fileType: 'application/pdf',
  sessionId: 'test-session-123',
};

const testFeedback = {
  uploadId: 'test-upload-123',
  overallScore: 85,
  contentScore: 90,
  formattingScore: 80,
  keywordScore: 75,
  suggestions: JSON.stringify(['Add more quantifiable achievements', 'Include relevant keywords']),
  strengths: JSON.stringify(['Clear professional summary', 'Strong work experience']),
  improvements: JSON.stringify(['Add more specific metrics', 'Improve formatting']),
  analysis: JSON.stringify({ wordCount: 450, sections: ['summary', 'experience', 'education'] }),
};

const testHealthLog = {
  status: 'healthy',
  services: JSON.stringify({ database: 'up', ai: 'up', storage: 'up' }),
  uptime: 86400,
};

describe('API Contract Tests - Resume Reviewer API', () => {
  let prisma: PrismaClient;
  let testUploadId: string;
  let testFeedbackId: string;

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
    const uniqueSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await prisma.userSession.create({
      data: {
        sessionId: uniqueSessionId,
      },
    });
    
    // Update test data to use the unique session ID
    testResumeUpload.sessionId = uniqueSessionId;
  });

  describe('POST /api/v1/upload', () => {
    it('should upload resume file successfully', async () => {
      // Create a mock PDF content (PDF header + minimal content)
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF');
      
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', pdfContent, 'test-resume.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('uploadId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('completed');
    });

    it('should reject invalid file format', async () => {
      // Expected: 400 response with error message
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('test file content'), 'test-resume.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject file too large', async () => {
      // Expected: 413 response with error message
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', largeFile, 'large-resume.pdf')
        .expect(413);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle rate limiting', async () => {
      // Expected: 429 response with rate limit error
      const response = await request(app)
        .post('/api/v1/upload')
        .set('x-simulate-rate-limit', 'true')
        .attach('file', Buffer.from('test file content'), 'test-resume.pdf')
        .expect(429);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('TOO_MANY_REQUESTS');
    });

    it('should handle server errors', async () => {
      // Expected: 500 response with error message
      const response = await request(app)
        .post('/api/v1/upload')
        .set('x-simulate-server-error', 'true')
        .attach('file', Buffer.from('test file content'), 'test-resume.pdf')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/v1/feedback/{uploadId}', () => {
    beforeEach(async () => {
      // Create test data
      const upload = await prisma.resumeUpload.create({
        data: {
          ...testResumeUpload,
          status: 'COMPLETED',
        },
      });
      testUploadId = upload.id;

      const feedback = await prisma.feedback.create({
        data: {
          ...testFeedback,
          uploadId: testUploadId,
        },
      });
      testFeedbackId = feedback.id;
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.feedback.deleteMany();
      await prisma.resumeUpload.deleteMany();
    });

    it('should retrieve feedback successfully', async () => {
      // Expected: 200 response with complete feedback data
      const response = await request(app)
        .get(`/api/v1/feedback/${testUploadId}`)
        .expect(200);

      expect(response.body).toHaveProperty('uploadId', testUploadId);
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body.feedback).toHaveProperty('overallScore');
      expect(response.body.feedback).toHaveProperty('contentScore');
      expect(response.body.feedback).toHaveProperty('formattingScore');
      expect(response.body.feedback).toHaveProperty('keywordScore');
      expect(response.body.feedback).toHaveProperty('suggestions');
      expect(response.body.feedback).toHaveProperty('strengths');
      expect(response.body.feedback).toHaveProperty('improvements');
    });

    it('should return processing status when feedback not ready', async () => {
      // Create upload without feedback
      const upload = await prisma.resumeUpload.create({
        data: { ...testResumeUpload, status: 'PROCESSING' },
      });

      // Expected: 202 response with processing status
      const response = await request(app)
        .get(`/api/v1/feedback/${upload.id}`)
        .expect(202);

      expect(response.body).toHaveProperty('uploadId', upload.id);
      expect(response.body).toHaveProperty('status', 'processing');
      expect(response.body).toHaveProperty('estimatedTime');
    });

    it('should return 404 for non-existent upload', async () => {
      // Expected: 404 response with error message
      const response = await request(app)
        .get('/api/v1/feedback/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should handle server errors', async () => {
      // Expected: 500 response with error message
      const response = await request(app)
        .get(`/api/v1/feedback/${testUploadId}`)
        .set('x-simulate-server-error', 'true')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('DELETE /api/v1/upload/{uploadId}', () => {
    beforeEach(async () => {
      // Create test data
      const upload = await prisma.resumeUpload.create({
        data: testResumeUpload,
      });
      testUploadId = upload.id;
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.feedback.deleteMany();
      await prisma.resumeUpload.deleteMany();
    });

    it('should delete upload successfully', async () => {
      // Expected: 200 response with success message
      const response = await request(app)
        .delete(`/api/v1/upload/${testUploadId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent upload', async () => {
      // Expected: 404 response with error message
      const response = await request(app)
        .delete('/api/v1/upload/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should handle server errors', async () => {
      // Expected: 500 response with error message
      const response = await request(app)
        .delete(`/api/v1/upload/${testUploadId}`)
        .set('x-simulate-server-error', 'true')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return healthy status', async () => {
      // Expected: 200 response with health status
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('uptime');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    it('should return service status details', async () => {
      // Expected: 200 response with detailed service status
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('ai_service');
      expect(response.body.services).toHaveProperty('file_storage');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.database);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.ai_service);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.services.file_storage);
    });

    it('should handle service unavailable', async () => {
      // Expected: 503 response when services are down
      const response = await request(app)
        .get('/api/v1/health')
        .set('x-simulate-service-unavailable', 'true')
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('API Response Schema Validation', () => {
    it('should validate UploadResponse schema', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('test file content'), 'test-resume.pdf')
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('uploadId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      
      // Validate field types
      expect(typeof response.body.uploadId).toBe('string');
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      
      // Validate enum values
      expect(['processing', 'completed', 'error']).toContain(response.body.status);
    });

    it('should validate FeedbackResponse schema', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          ...testResumeUpload,
          status: 'COMPLETED',
        },
      });
      
      await prisma.feedback.create({
        data: {
          ...testFeedback,
          uploadId: upload.id,
        },
      });

      const response = await request(app)
        .get(`/api/v1/feedback/${upload.id}`)
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('uploadId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('feedback');
      
      // Validate feedback object
      expect(response.body.feedback).toHaveProperty('overallScore');
      expect(response.body.feedback).toHaveProperty('contentScore');
      expect(response.body.feedback).toHaveProperty('formattingScore');
      expect(response.body.feedback).toHaveProperty('keywordScore');
      expect(response.body.feedback).toHaveProperty('suggestions');
      expect(response.body.feedback).toHaveProperty('strengths');
      expect(response.body.feedback).toHaveProperty('improvements');
      
      // Validate field types
      expect(typeof response.body.feedback.overallScore).toBe('number');
      expect(typeof response.body.feedback.contentScore).toBe('number');
      expect(typeof response.body.feedback.formattingScore).toBe('number');
      expect(typeof response.body.feedback.keywordScore).toBe('number');
      expect(Array.isArray(response.body.feedback.suggestions)).toBe(true);
      expect(Array.isArray(response.body.feedback.strengths)).toBe(true);
      expect(Array.isArray(response.body.feedback.improvements)).toBe(true);
    });

    it('should validate ErrorResponse schema', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('test file content'), 'test-resume.txt')
        .expect(400);

      // Validate required fields
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      
      // Validate field types
      expect(typeof response.body.error).toBe('boolean');
      expect(typeof response.body.code).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should validate HealthResponse schema', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('uptime');
      
      // Validate field types
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.version).toBe('string');
      expect(typeof response.body.services).toBe('object');
      expect(typeof response.body.uptime).toBe('number');
      
      // Validate enum values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });
  });

  describe('API Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_REQUEST_FORMAT');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('MISSING_FILE');
    });

    it('should handle invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/feedback/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_UUID_FORMAT');
    });

    it('should handle request timeout', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .set('x-simulate-timeout', 'true')
        .attach('file', Buffer.from('test file content'), 'test-resume.pdf')
        .expect(408);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('REQUEST_TIMEOUT');
    });
  });
});
