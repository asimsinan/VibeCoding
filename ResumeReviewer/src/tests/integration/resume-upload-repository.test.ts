import { PrismaClient } from '@prisma/client';
import { ResumeUploadRepository } from '../../lib/resume-reviewer/repositories/resume-upload-repository';
import { FeedbackRepository } from '../../lib/resume-reviewer/repositories/feedback-repository';
import { UserSessionRepository } from '../../lib/resume-reviewer/repositories/user-session-repository';
import { HealthLogRepository } from '../../lib/resume-reviewer/repositories/health-log-repository';
import './test-setup';

describe('ResumeUploadRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: ResumeUploadRepository;
  let sessionRepository: UserSessionRepository;
  let feedbackRepository: FeedbackRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public'
        }
      }
    });
    await prisma.$connect();
    repository = new ResumeUploadRepository(prisma);
    sessionRepository = new UserSessionRepository(prisma);
    feedbackRepository = new FeedbackRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.feedback.deleteMany();
    await prisma.resumeUpload.deleteMany();
    await prisma.userSession.deleteMany();
    
    // Create a test session for foreign key constraints
    await prisma.userSession.create({
      data: {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      },
    });
  });

  describe('create', () => {
    it('should create a resume upload with valid data', async () => {
      const validData = {
        fileName: 'test-resume.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf' as const,
        fileUrl: 'https://example.com/resume.pdf',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await repository.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.fileName).toBe(validData.fileName);
      expect(result.fileSize).toBe(validData.fileSize);
      expect(result.fileType).toBe(validData.fileType);
      expect(result.fileUrl).toBe(validData.fileUrl);
      expect(result.sessionId).toBe(validData.sessionId);
      expect(result.status).toBe('PROCESSING');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a resume upload without optional fields', async () => {
      const minimalData = {
        fileName: 'minimal-resume.pdf',
        fileSize: 512000,
        fileType: 'application/pdf' as const,
      };

      const result = await repository.create(minimalData);

      expect(result).toBeDefined();
      expect(result.fileName).toBe(minimalData.fileName);
      expect(result.fileSize).toBe(minimalData.fileSize);
      expect(result.fileType).toBe(minimalData.fileType);
      expect(result.fileUrl).toBeNull();
      expect(result.sessionId).toBeNull();
      expect(result.status).toBe('PROCESSING');
    });

    it('should throw error for invalid file size', async () => {
      const invalidData = {
        fileName: 'test-resume.pdf',
        fileSize: 11 * 1024 * 1024, // 11MB - exceeds limit
        fileType: 'application/pdf' as const,
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid file type', async () => {
      const invalidData = {
        fileName: 'test-resume.txt',
        fileSize: 1024,
        fileType: 'text/plain' as any,
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find resume upload by ID with relationships', async () => {
      // Create test data using repositories
      const session = await sessionRepository.create({
        sessionId: '123e4567-e89b-12d3-a456-426614174001'
      });

      const upload = await repository.create({
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        sessionId: session.sessionId,
      });

      const feedback = await feedbackRepository.create({
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      });

      const result = await repository.findById(upload.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(upload.id);
      expect(result!.fileName).toBe('test-resume.pdf');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update resume upload with valid data', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      });

      const updateData = {
        status: 'COMPLETED' as const,
        fileUrl: 'https://example.com/updated-resume.pdf',
      };

      const result = await repository.update(upload.id, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(upload.id);
      expect(result.status).toBe('COMPLETED');
      expect(result.fileUrl).toBe('https://example.com/updated-resume.pdf');
      expect(result.updatedAt.getTime()).toBeGreaterThan(upload.updatedAt.getTime());
    });

    it('should throw error for invalid status', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      });

      const invalidData = {
        status: 'INVALID_STATUS' as any,
      };

      await expect(repository.update(upload.id, invalidData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete resume upload by ID', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      });

      const result = await repository.delete(upload.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(upload.id);

      // Verify it's deleted
      const deleted = await prisma.resumeUpload.findUnique({
        where: { id: upload.id }
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete related feedback', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      });

      const feedback = await prisma.feedback.create({
        data: {
          uploadId: upload.id,
          overallScore: 85,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 88,
          suggestions: JSON.stringify(['Improve action verbs']),
          strengths: JSON.stringify(['Clear objective']),
          improvements: JSON.stringify(['Add more metrics']),
        }
      });

      await repository.delete(upload.id);

      // Verify feedback is also deleted due to cascade
      const deletedFeedback = await prisma.feedback.findUnique({
        where: { id: feedback.id }
      });
      expect(deletedFeedback).toBeNull();
    });
  });

  describe('findBySessionId', () => {
    it('should find resume uploads by session ID', async () => {
      const session = await sessionRepository.create({
        sessionId: '123e4567-e89b-12d3-a456-426614174002'
      });

      const upload1 = await repository.create({
        fileName: 'resume1.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        sessionId: session.sessionId,
      });

      const upload2 = await repository.create({
        fileName: 'resume2.pdf',
        fileSize: 2048,
        fileType: 'application/pdf',
        sessionId: session.sessionId,
      });

      const result = await repository.findBySessionId(session.sessionId);

      expect(result).toHaveLength(2);
      expect(result.map(u => u.id)).toContain(upload1.id);
      expect(result.map(u => u.id)).toContain(upload2.id);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });

    it('should return empty array for non-existent session ID', async () => {
      const result = await repository.findBySessionId('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should find all resume uploads with pagination', async () => {
      // Create test data
      const uploads = [];
      for (let i = 0; i < 5; i++) {
        const upload = await prisma.resumeUpload.create({
          data: {
            fileName: `resume${i}.pdf`,
            fileSize: 1024,
            fileType: 'application/pdf',
          }
        });
        uploads.push(upload);
      }

      const result = await repository.findAll({ page: 1, limit: 3 });

      expect(result).toHaveLength(3);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });

    it('should handle pagination correctly', async () => {
      // Create test data
      const uploads = [];
      for (let i = 0; i < 5; i++) {
        const upload = await prisma.resumeUpload.create({
          data: {
            fileName: `resume${i}.pdf`,
            fileSize: 1024,
            fileType: 'application/pdf',
          }
        });
        uploads.push(upload);
      }

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('business rules', () => {
    it('should enforce file size limits', async () => {
      const largeFileData = {
        fileName: 'large-resume.pdf',
        fileSize: 15 * 1024 * 1024, // 15MB - exceeds limit
        fileType: 'application/pdf' as const,
      };

      await expect(repository.create(largeFileData)).rejects.toThrow();
    });

    it('should enforce file type restrictions', async () => {
      const invalidFileData = {
        fileName: 'malicious.exe',
        fileSize: 1024,
        fileType: 'application/x-executable' as any,
      };

      await expect(repository.create(invalidFileData)).rejects.toThrow();
    });

    it('should handle concurrent updates', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }
      });

      const update1 = repository.update(upload.id, { status: 'PROCESSING' as const });
      const update2 = repository.update(upload.id, { status: 'COMPLETED' as const });

      await Promise.all([update1, update2]);

      const result = await repository.findById(upload.id);
      expect(result!.status).toBeDefined();
    });
  });
});
