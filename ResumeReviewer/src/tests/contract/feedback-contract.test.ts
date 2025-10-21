import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../lib/mock-app';
import './test-setup';

describe('Contract Tests - Feedback Endpoint', () => {
  let prisma: PrismaClient;

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
    
    // Session created with unique ID
  });
  describe('GET /api/v1/feedback/{uploadId}', () => {
    it('should return feedback for valid upload ID', async () => {
      // First create an upload through the API
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF');
      
      const uploadResponse = await request(app)
        .post('/api/v1/upload')
        .attach('file', pdfContent, 'test.pdf')
        .expect(200);
      
      const uploadId = uploadResponse.body.uploadId;
      
      const response = await request(app)
        .get(`/api/v1/feedback/${uploadId}`)
        .expect(200);

      expect(response.body).toHaveProperty('uploadId', uploadId);
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body.feedback).toHaveProperty('overallScore');
      expect(response.body.feedback).toHaveProperty('suggestions');
      expect(response.body.feedback).toHaveProperty('strengths');
      expect(response.body.feedback).toHaveProperty('improvements');
    });

    it('should return processing status when feedback not ready', async () => {
      // First create a processing upload through the API
      const uploadResponse = await request(app)
        .post('/api/v1/upload')
        .set('x-simulate-processing', 'true')
        .attach('file', Buffer.from('PDF content'), 'processing.pdf')
        .expect(200);
      
      const uploadId = uploadResponse.body.uploadId;
      
      const response = await request(app)
        .get(`/api/v1/feedback/${uploadId}`)
        .expect(202);

      expect(response.body).toHaveProperty('uploadId', uploadId);
      expect(response.body).toHaveProperty('status', 'processing');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent upload', async () => {
      const uploadId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/v1/feedback/${uploadId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/feedback/invalid-uuid')
        .expect(400);

      expect(response.body.code).toBe('INVALID_UUID_FORMAT');
    });

    it('should return proper feedback scores', async () => {
      // First create an upload through the API
      const uploadResponse = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('PDF content'), 'test-scores.pdf')
        .expect(200);
      
      const uploadId = uploadResponse.body.uploadId;
      
      const response = await request(app)
        .get(`/api/v1/feedback/${uploadId}`)
        .expect(200);

      const feedback = response.body.feedback;
      expect(feedback.overallScore).toBeGreaterThanOrEqual(0);
      expect(feedback.overallScore).toBeLessThanOrEqual(100);
      expect(feedback.contentScore).toBeGreaterThanOrEqual(0);
      expect(feedback.contentScore).toBeLessThanOrEqual(100);
      expect(feedback.formattingScore).toBeGreaterThanOrEqual(0);
      expect(feedback.formattingScore).toBeLessThanOrEqual(100);
      expect(feedback.keywordScore).toBeGreaterThanOrEqual(0);
      expect(feedback.keywordScore).toBeLessThanOrEqual(100);
    });

    it('should return arrays for suggestions, strengths, and improvements', async () => {
      // First create an upload through the API
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF');
      
      const uploadResponse = await request(app)
        .post('/api/v1/upload')
        .attach('file', pdfContent, 'test-arrays.pdf')
        .expect(200);
      
      const uploadId = uploadResponse.body.uploadId;
      
      const response = await request(app)
        .get(`/api/v1/feedback/${uploadId}`)
        .expect(200);

      const feedback = response.body.feedback;
      expect(Array.isArray(feedback.suggestions)).toBe(true);
      expect(Array.isArray(feedback.strengths)).toBe(true);
      expect(Array.isArray(feedback.improvements)).toBe(true);
      
      // Each array should contain strings
      feedback.suggestions.forEach((suggestion: string) => {
        expect(typeof suggestion).toBe('string');
      });
      feedback.strengths.forEach((strength: string) => {
        expect(typeof strength).toBe('string');
      });
      feedback.improvements.forEach((improvement: string) => {
        expect(typeof improvement).toBe('string');
      });
    });
  });
});
