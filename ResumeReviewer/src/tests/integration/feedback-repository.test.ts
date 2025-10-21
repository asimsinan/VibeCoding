import { PrismaClient } from '@prisma/client';
import { FeedbackRepository } from '../../lib/resume-reviewer/repositories/feedback-repository';
import './test-setup';

describe('FeedbackRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: FeedbackRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public'
        }
      }
    });
    await prisma.$connect();
    repository = new FeedbackRepository(prisma);
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
        sessionId: 'test-session-integration',
      },
    });
  });

  describe('create', () => {
    it('should create feedback with valid data', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const validData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs', 'Add more metrics'],
        strengths: ['Clear objective', 'Relevant experience'],
        improvements: ['Quantify achievements', 'Tailor to job description'],
        analysis: {
          sections: [
            { name: 'Experience', score: 90, details: 'Strong work history' },
            { name: 'Education', score: 85, details: 'Relevant degree' },
          ],
        },
      };

      const result = await repository.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.uploadId).toBe(upload.id);
      expect(result.overallScore).toBe(85);
      expect(result.contentScore).toBe(90);
      expect(result.formattingScore).toBe(80);
      expect(result.keywordScore).toBe(88);
      expect(result.suggestions).toBe(JSON.stringify(validData.suggestions));
      expect(result.strengths).toBe(JSON.stringify(validData.strengths));
      expect(result.improvements).toBe(JSON.stringify(validData.improvements));
      expect(result.analysis).toBe(JSON.stringify(validData.analysis));
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create feedback without analysis', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const validData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Quantify achievements'],
      };

      const result = await repository.create(validData);

      expect(result).toBeDefined();
      expect(result.uploadId).toBe(upload.id);
      expect(result.overallScore).toBe(85);
      expect(result.analysis).toBeNull();
    });

    it('should throw error for invalid score range', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const invalidData = {
        uploadId: upload.id,
        overallScore: 150, // Invalid score > 100
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Test'],
        strengths: ['Test'],
        improvements: ['Test'],
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for negative score', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const invalidData = {
        uploadId: upload.id,
        overallScore: -10, // Invalid negative score
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Test'],
        strengths: ['Test'],
        improvements: ['Test'],
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for non-existent upload ID', async () => {
      const invalidData = {
        uploadId: 'non-existent-id',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Test'],
        strengths: ['Test'],
        improvements: ['Test'],
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findByUploadId', () => {
    it('should find feedback by upload ID and parse JSON fields', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const feedback = await prisma.feedback.create({
        data: {
          uploadId: upload.id,
          overallScore: 85,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 88,
          suggestions: JSON.stringify(['Improve action verbs', 'Add more metrics']),
          strengths: JSON.stringify(['Clear objective', 'Relevant experience']),
          improvements: JSON.stringify(['Quantify achievements', 'Tailor to job description']),
          analysis: JSON.stringify({
            sections: [
              { name: 'Experience', score: 90, details: 'Strong work history' },
              { name: 'Education', score: 85, details: 'Relevant degree' },
            ],
          }),
        },
      });

      const result = await repository.findByUploadId(upload.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(feedback.id);
      expect(result!.uploadId).toBe(upload.id);
      expect(result!.overallScore).toBe(85);
      expect(result!.suggestions).toEqual(['Improve action verbs', 'Add more metrics']);
      expect(result!.strengths).toEqual(['Clear objective', 'Relevant experience']);
      expect(result!.improvements).toEqual(['Quantify achievements', 'Tailor to job description']);
      expect(result!.analysis).toEqual({
        sections: [
          { name: 'Experience', score: 90, details: 'Strong work history' },
          { name: 'Education', score: 85, details: 'Relevant degree' },
        ],
      });
    });

    it('should return null for non-existent upload ID', async () => {
      const result = await repository.findByUploadId('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle feedback without analysis', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const feedback = await prisma.feedback.create({
        data: {
          uploadId: upload.id,
          overallScore: 85,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 88,
          suggestions: JSON.stringify(['Test']),
          strengths: JSON.stringify(['Test']),
          improvements: JSON.stringify(['Test']),
        },
      });

      const result = await repository.findByUploadId(upload.id);

      expect(result).toBeDefined();
      expect(result!.analysis).toBeUndefined();
    });
  });

  describe('deleteByUploadId', () => {
    it('should delete feedback by upload ID', async () => {
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const feedback = await prisma.feedback.create({
        data: {
          uploadId: upload.id,
          overallScore: 85,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 88,
          suggestions: JSON.stringify(['Test']),
          strengths: JSON.stringify(['Test']),
          improvements: JSON.stringify(['Test']),
        },
      });

      const result = await repository.deleteByUploadId(upload.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(feedback.id);

      // Verify feedback was deleted
      const deletedFeedback = await repository.findByUploadId(upload.id);
      expect(deletedFeedback).toBeNull();
    });

    it('should return null for non-existent upload ID', async () => {
      const result = await repository.deleteByUploadId('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all feedback with pagination', async () => {
      const uploads = [];
      for (let i = 0; i < 5; i++) {
        const upload = await prisma.resumeUpload.create({
          data: {
            fileName: `resume${i}.pdf`,
            fileSize: 1024,
            fileType: 'application/pdf',
            sessionId: 'test-session-integration',
          }
        });
        uploads.push(upload);

        const feedback = await prisma.feedback.create({
          data: {
            uploadId: upload.id,
            overallScore: 80 + i,
            contentScore: 85 + i,
            formattingScore: 75 + i,
            keywordScore: 70 + i,
            suggestions: JSON.stringify(['Test']),
            strengths: JSON.stringify(['Test']),
            improvements: JSON.stringify(['Test']),
          },
        });
      }

      const result = await repository.findAll({ page: 1, limit: 3 });

      expect(result).toHaveLength(3);
      expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
    });

    it('should filter by score range', async () => {
      const upload1 = await prisma.resumeUpload.create({
        data: {
          fileName: 'resume1.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const upload2 = await prisma.resumeUpload.create({
        data: {
          fileName: 'resume2.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      await prisma.feedback.create({
        data: {
          uploadId: upload1.id,
          overallScore: 95,
          contentScore: 90,
          formattingScore: 80,
          keywordScore: 88,
          suggestions: JSON.stringify(['Test']),
          strengths: JSON.stringify(['Test']),
          improvements: JSON.stringify(['Test']),
        },
      });

      await prisma.feedback.create({
        data: {
          uploadId: upload2.id,
          overallScore: 75,
          contentScore: 70,
          formattingScore: 80,
          keywordScore: 78,
          suggestions: JSON.stringify(['Test']),
          strengths: JSON.stringify(['Test']),
          improvements: JSON.stringify(['Test']),
        },
      });

      const highScoreResults = await repository.findAll({ minScore: 90 });
      const lowScoreResults = await repository.findAll({ maxScore: 80 });

      expect(highScoreResults).toHaveLength(1);
      expect(lowScoreResults).toHaveLength(1);
    });
  });

  describe('business rules', () => {
    it('should enforce unique feedback per upload', async () => {
      // Ensure session exists
      await prisma.userSession.upsert({
        where: { sessionId: 'test-session-integration' },
        update: {},
        create: { sessionId: 'test-session-integration' }
      });
      
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const feedbackData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Test'],
        strengths: ['Test'],
        improvements: ['Test'],
      };

      // Create first feedback
      await repository.create(feedbackData);

      // Try to create second feedback for same upload
      await expect(repository.create(feedbackData)).rejects.toThrow();
    });

    it('should handle score consistency validation', async () => {
      // Ensure session exists
      await prisma.userSession.upsert({
        where: { sessionId: 'test-session-integration' },
        update: {},
        create: { sessionId: 'test-session-integration' }
      });
      
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const validData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Test'],
        strengths: ['Test'],
        improvements: ['Test'],
      };

      const result = await repository.create(validData);

      expect(result.overallScore).toBe(85);
      expect(result.contentScore).toBe(90);
      expect(result.formattingScore).toBe(80);
      expect(result.keywordScore).toBe(88);
    });

    it('should handle empty arrays for suggestions, strengths, and improvements', async () => {
      // Ensure session exists
      await prisma.userSession.upsert({
        where: { sessionId: 'test-session-integration' },
        update: {},
        create: { sessionId: 'test-session-integration' }
      });
      
      const upload = await prisma.resumeUpload.create({
        data: {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          sessionId: 'test-session-integration',
        }
      });

      const validData = {
        uploadId: upload.id,
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: [],
        strengths: [],
        improvements: [],
      };

      const result = await repository.create(validData);

      expect(result.suggestions).toBe(JSON.stringify([]));
      expect(result.strengths).toBe(JSON.stringify([]));
      expect(result.improvements).toBe(JSON.stringify([]));
    });
  });
});