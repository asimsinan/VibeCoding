import { PrismaClient } from '@prisma/client';
import { UserSessionRepository } from '../../lib/resume-reviewer/repositories/user-session-repository';
import { ResumeUploadRepository } from '../../lib/resume-reviewer/repositories/resume-upload-repository';
import { FeedbackRepository } from '../../lib/resume-reviewer/repositories/feedback-repository';
import './test-setup';

describe('UserSessionRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: UserSessionRepository;
  let uploadRepository: ResumeUploadRepository;
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
    repository = new UserSessionRepository(prisma);
    uploadRepository = new ResumeUploadRepository(prisma);
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
  });

  describe('create', () => {
    it('should create a user session with valid session ID', async () => {
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await repository.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.sessionId).toBe(validData.sessionId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for invalid session ID format', async () => {
      const invalidData = {
        sessionId: 'invalid-uuid',
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for empty session ID', async () => {
      const invalidData = {
        sessionId: '',
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for session ID too long', async () => {
      const invalidData = {
        sessionId: 'a'.repeat(256), // Exceeds reasonable length
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findBySessionId', () => {
    it('should find user session by session ID with uploads and feedback', async () => {
      const session = await repository.create({
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      });

      const upload1 = await uploadRepository.create({
        fileName: 'resume1.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        sessionId: session.sessionId,
      });

      const upload2 = await uploadRepository.create({
        fileName: 'resume2.pdf',
        fileSize: 2048,
        fileType: 'application/pdf',
        sessionId: session.sessionId,
      });

      const feedback1 = await feedbackRepository.create({
        uploadId: upload1.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      });

      const result = await repository.findBySessionId(session.sessionId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(session.id);
      expect(result!.sessionId).toBe(session.sessionId);
    });

    it('should return null for non-existent session ID', async () => {
      const result = await repository.findBySessionId('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user session with valid data', async () => {
      const session = await prisma.userSession.create({
        data: { sessionId: '123e4567-e89b-12d3-a456-426614174000' }
      });

      const updateData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174001', // New session ID
      };

      const result = await repository.update(session.id, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(session.id);
      expect(result.sessionId).toBe(updateData.sessionId);
      expect(result.updatedAt.getTime()).toBeGreaterThan(session.updatedAt.getTime());
    });

    it('should throw error for invalid session ID in update', async () => {
      const session = await prisma.userSession.create({
        data: { sessionId: '123e4567-e89b-12d3-a456-426614174000' }
      });

      const invalidData = {
        sessionId: 'invalid-uuid',
      };

      await expect(repository.update(session.id, invalidData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete user session by ID', async () => {
      const session = await prisma.userSession.create({
        data: { sessionId: '123e4567-e89b-12d3-a456-426614174000' }
      });

      const result = await repository.delete(session.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(session.id);

      // Verify it's deleted
      const deleted = await prisma.userSession.findUnique({
        where: { id: session.id }
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete related uploads and feedback', async () => {
      const session = await repository.create({
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      });

      const upload = await uploadRepository.create({
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

      await repository.delete(session.id);

      // Verify uploads and feedback are also deleted due to cascade
      const deletedUpload = await prisma.resumeUpload.findUnique({
        where: { id: upload.id }
      });
      expect(deletedUpload).toBeNull();

      const deletedFeedback = await prisma.feedback.findUnique({
        where: { id: feedback.id }
      });
      expect(deletedFeedback).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all user sessions with pagination', async () => {
      // Create test data
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const session = await prisma.userSession.create({
          data: { sessionId: `123e4567-e89b-12d3-a456-42661417400${i}` }
        });
        sessions.push(session);
      }

      const result = await repository.findAll({ page: 1, limit: 3 });

      expect(result).toHaveLength(3);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });

    it('should handle pagination correctly', async () => {
      // Create test data
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const session = await prisma.userSession.create({
          data: { sessionId: `123e4567-e89b-12d3-a456-42661417400${i}` }
        });
        sessions.push(session);
      }

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should use default pagination when no options provided', async () => {
      // Create test data
      const sessions = [];
      for (let i = 0; i < 25; i++) {
        const session = await prisma.userSession.create({
          data: { sessionId: `123e4567-e89b-12d3-a456-42661417400${i}` }
        });
        sessions.push(session);
      }

      const result = await repository.findAll();

      expect(result).toHaveLength(20); // Default limit
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });
  });

  describe('findByDateRange', () => {
    it('should find sessions within date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create sessions with different dates
      const session1 = await prisma.userSession.create({
        data: { sessionId: '123e4567-e89b-12d3-a456-426614174000' }
      });

      // Update created date to yesterday
      await prisma.userSession.update({
        where: { id: session1.id },
        data: { createdAt: yesterday }
      });

      const session2 = await prisma.userSession.create({
        data: { sessionId: '123e4567-e89b-12d3-a456-426614174001' }
      });

      const result = await repository.findByDateRange(yesterday, tomorrow);

      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toContain(session1.id);
      expect(result.map(s => s.id)).toContain(session2.id);
    });

    it('should return empty array for date range with no sessions', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const farFutureDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years from now

      const result = await repository.findByDateRange(futureDate, farFutureDate);
      expect(result).toEqual([]);
    });
  });

  describe('business rules', () => {
    it('should enforce unique session IDs', async () => {
      const sessionData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Create first session
      await repository.create(sessionData);

      // Try to create second session with same session ID
      await expect(repository.create(sessionData)).rejects.toThrow();
    });

    it('should handle session ID case sensitivity', async () => {
      const sessionData1 = {
        sessionId: '123E4567-E89B-12D3-A456-426614174000', // Uppercase
      };

      const sessionData2 = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000', // Lowercase
      };

      // Both should be treated as different sessions
      const result1 = await repository.create(sessionData1);
      const result2 = await repository.create(sessionData2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle concurrent session creation', async () => {
      const sessionData1 = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const sessionData2 = {
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const create1 = repository.create(sessionData1);
      const create2 = repository.create(sessionData2);

      const results = await Promise.all([create1, create2]);

      expect(results).toHaveLength(2);
      expect(results[0].sessionId).toBe(sessionData1.sessionId);
      expect(results[1].sessionId).toBe(sessionData2.sessionId);
    });
  });
});
