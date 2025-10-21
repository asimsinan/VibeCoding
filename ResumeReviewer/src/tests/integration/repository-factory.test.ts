import { PrismaClient } from '@prisma/client';
import { RepositoryFactory } from '../../lib/resume-reviewer/repositories/repository-factory';
import { ResumeUploadRepository } from '../../lib/resume-reviewer/repositories/resume-upload-repository';
import { FeedbackRepository } from '../../lib/resume-reviewer/repositories/feedback-repository';
import { UserSessionRepository } from '../../lib/resume-reviewer/repositories/user-session-repository';
import { HealthLogRepository } from '../../lib/resume-reviewer/repositories/health-log-repository';
import './test-setup';

describe('RepositoryFactory Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public';
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
    await prisma.healthLog.deleteMany();
    
    // Create a test session for foreign key constraints
    await prisma.userSession.create({
      data: {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      },
    });
  });

  describe('getResumeUploadRepository', () => {
    it('should create ResumeUploadRepository instance', () => {
      const repository = RepositoryFactory.getResumeUploadRepository(prisma);
      
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(ResumeUploadRepository);
    });

    it('should create new instance each time', () => {
      const repository1 = RepositoryFactory.getResumeUploadRepository(prisma);
      const repository2 = RepositoryFactory.getResumeUploadRepository(prisma);
      
      expect(repository1).not.toBe(repository2);
    });

    it('should work with actual database operations', async () => {
      const repository = RepositoryFactory.getResumeUploadRepository(prisma);
      
      const validData = {
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf' as const,
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await repository.create(validData);
      
      expect(result).toBeDefined();
      expect(result.fileName).toBe(validData.fileName);
    });
  });

  describe('getFeedbackRepository', () => {
    it('should create FeedbackRepository instance', () => {
      const repository = RepositoryFactory.getFeedbackRepository(prisma);
      const resumeRepository = RepositoryFactory.getResumeUploadRepository(prisma);
      
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(FeedbackRepository);
    });

    it('should create new instance each time', () => {
      const repository1 = RepositoryFactory.getFeedbackRepository(prisma);
      const repository2 = RepositoryFactory.getFeedbackRepository(prisma);
      
      expect(repository1).not.toBe(repository2);
    });

    it('should work with actual database operations', async () => {
      const repository = RepositoryFactory.getFeedbackRepository(prisma);
      const resumeRepository = RepositoryFactory.getResumeUploadRepository(prisma);
      
      // Create upload first via repository to match model validation
      const upload = await resumeRepository.create({
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const validData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      const result = await repository.create(validData);
      
      expect(result).toBeDefined();
      expect(result.uploadId).toBe(upload.id);
    });
  });

  describe('getUserSessionRepository', () => {
    it('should create UserSessionRepository instance', () => {
      const repository = RepositoryFactory.getUserSessionRepository(prisma);
      
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(UserSessionRepository);
    });

    it('should create new instance each time', () => {
      const repository1 = RepositoryFactory.getUserSessionRepository(prisma);
      const repository2 = RepositoryFactory.getUserSessionRepository(prisma);
      
      expect(repository1).not.toBe(repository2);
    });

    it('should work with actual database operations', async () => {
      const repository = RepositoryFactory.getUserSessionRepository(prisma);
      
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = await repository.create(validData);
      
      expect(result).toBeDefined();
      expect(result.sessionId).toBe(validData.sessionId);
    });
  });

  describe('getHealthLogRepository', () => {
    it('should create HealthLogRepository instance', () => {
      const repository = RepositoryFactory.getHealthLogRepository(prisma);
      
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(HealthLogRepository);
    });

    it('should create new instance each time', () => {
      const repository1 = RepositoryFactory.getHealthLogRepository(prisma);
      const repository2 = RepositoryFactory.getHealthLogRepository(prisma);
      
      expect(repository1).not.toBe(repository2);
    });

    it('should work with actual database operations', async () => {
      const repository = RepositoryFactory.getHealthLogRepository(prisma);
      
      const validData = {
        status: 'healthy' as const,
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: 3600,
      };

      const result = await repository.create(validData);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
    });
  });

  describe('getPrismaClient', () => {
    it('should create PrismaClient instance', () => {
      const client = RepositoryFactory.getPrismaClient();
      
      expect(client).toBeDefined();
      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
    });

    it('should create new instance each time', () => {
      const client1 = RepositoryFactory.getPrismaClient();
      const client2 = RepositoryFactory.getPrismaClient();
      
      expect(client1).not.toBe(client2);
    });

    it('should have proper configuration', () => {
      const client = RepositoryFactory.getPrismaClient();
      
      // Verify client has expected methods
      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
      expect(typeof client.resumeUpload).toBe('object');
      expect(typeof client.feedback).toBe('object');
      expect(typeof client.userSession).toBe('object');
      expect(typeof client.healthLog).toBe('object');
    });

    it('should handle Prisma client lifecycle', async () => {
      const client = RepositoryFactory.getPrismaClient();
      
      // Should be able to connect and disconnect
      await expect(client.$connect()).resolves.not.toThrow();
      await expect(client.$disconnect()).resolves.not.toThrow();
    });
  });

  describe('integration', () => {
    it('should create all repositories with same Prisma client', () => {
      const prisma = RepositoryFactory.getPrismaClient();
      
      const resumeRepository = RepositoryFactory.getResumeUploadRepository(prisma);
      const feedbackRepository = RepositoryFactory.getFeedbackRepository(prisma);
      const userSessionRepository = RepositoryFactory.getUserSessionRepository(prisma);
      const healthLogRepository = RepositoryFactory.getHealthLogRepository(prisma);

      // Ensure all repositories use the same Prisma client instance
      expect((resumeRepository as any).model.prisma).toBe(prisma);
      expect((feedbackRepository as any).model.prisma).toBe(prisma);
      expect((userSessionRepository as any).model.prisma).toBe(prisma);
      expect((healthLogRepository as any).model.prisma).toBe(prisma);
    });

    it('should handle cross-repository operations', async () => {
      const resumeRepository = RepositoryFactory.getResumeUploadRepository(prisma);
      const feedbackRepository = RepositoryFactory.getFeedbackRepository(prisma);
      const userSessionRepository = RepositoryFactory.getUserSessionRepository(prisma);

      // Use existing session created in beforeEach
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Create upload with session
      const upload = await resumeRepository.create({
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        sessionId,
      });

      // Create feedback for upload
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

      // Verify relationships
      const foundUpload = await resumeRepository.findById(upload.id);
      expect(foundUpload).toBeDefined();
      expect(foundUpload!.sessionId).toBe(sessionId);

      const foundFeedback = await feedbackRepository.findByUploadId(upload.id);
      expect(foundFeedback).toBeDefined();
      expect(foundFeedback!.uploadId).toBe(upload.id);
    });

    it('should handle transaction operations', async () => {
      const resumeRepository = RepositoryFactory.getResumeUploadRepository(prisma);
      const feedbackRepository = RepositoryFactory.getFeedbackRepository(prisma);

      // Test transaction rollback
      await expect(async () => {
        await prisma.$transaction(async (tx) => {
          const upload = await tx.resumeUpload.create({
            data: {
              fileName: 'test-resume.pdf',
              fileSize: 1024,
              fileType: 'application/pdf',
              sessionId: '123e4567-e89b-12d3-a456-426614174000',
            }
          });

          await tx.feedback.create({
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

          // Force rollback
          throw new Error('Test rollback');
        });
      }).rejects.toThrow('Test rollback');

      // Verify no data was persisted
      const uploads = await prisma.resumeUpload.findMany();
      const feedbacks = await prisma.feedback.findMany();
      expect(uploads).toHaveLength(0);
      expect(feedbacks).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle null Prisma client gracefully', () => {
      const repository = RepositoryFactory.getResumeUploadRepository(null as any);
      expect(repository).toBeInstanceOf(ResumeUploadRepository);
    });

    it('should handle undefined Prisma client gracefully', () => {
      const repository = RepositoryFactory.getResumeUploadRepository(undefined as any);
      expect(repository).toBeInstanceOf(ResumeUploadRepository);
    });

    it('should handle database connection errors', async () => {
      const invalidPrisma = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://invalid:invalid@localhost:9999/invalid'
          }
        }
      });

      const repository = RepositoryFactory.getResumeUploadRepository(invalidPrisma);
      
      await expect(repository.create({
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf'
      })).rejects.toThrow();

      await invalidPrisma.$disconnect();
    });
  });
});
