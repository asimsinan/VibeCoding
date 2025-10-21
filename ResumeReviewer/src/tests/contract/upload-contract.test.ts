import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../lib/mock-app';
import './test-setup';

describe('Contract Tests - Upload Endpoint', () => {
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
  });
  describe('POST /api/v1/upload', () => {
    it('should accept PDF files', async () => {
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF');
      
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', pdfContent, 'resume.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('uploadId');
      expect(response.body.status).toBe('completed');
    });

    it('should accept DOC files', async () => {
      const docContent = Buffer.from('Microsoft Word Document Content');
      
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', docContent, 'resume.doc')
        .expect(200);

      expect(response.body).toHaveProperty('uploadId');
      expect(response.body.status).toBe('completed');
    });

    it('should accept DOCX files', async () => {
      const docxContent = Buffer.from('Microsoft Word Document Content');
      
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', docxContent, 'resume.docx')
        .expect(200);

      expect(response.body).toHaveProperty('uploadId');
      expect(response.body.status).toBe('completed');
    });

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('text content'), 'resume.txt')
        .expect(400);

      expect(response.body.code).toBe('INVALID_FILE_TYPE');
    });

    it('should enforce 10MB file size limit', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', largeFile, 'large-resume.pdf')
        .expect(413);

      expect(response.body.code).toBe('FILE_TOO_LARGE');
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/upload')
        .attach('file', Buffer.from('content'), 'resume.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
