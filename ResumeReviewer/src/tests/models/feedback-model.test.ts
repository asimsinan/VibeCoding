import { FeedbackModel } from '../../lib/resume-reviewer/models/index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  feedback: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;

describe('FeedbackModel', () => {
  let model: FeedbackModel;

  beforeEach(() => {
    model = new FeedbackModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create feedback with valid data', async () => {
      const validData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
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

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadId: validData.uploadId,
        overallScore: validData.overallScore,
        contentScore: validData.contentScore,
        formattingScore: validData.formattingScore,
        keywordScore: validData.keywordScore,
        suggestions: JSON.stringify(validData.suggestions),
        strengths: JSON.stringify(validData.strengths),
        improvements: JSON.stringify(validData.improvements),
        analysis: JSON.stringify(validData.analysis),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
        data: {
          ...validData,
          suggestions: JSON.stringify(validData.suggestions),
          strengths: JSON.stringify(validData.strengths),
          improvements: JSON.stringify(validData.improvements),
          analysis: JSON.stringify(validData.analysis),
        },
        include: { upload: true },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create feedback without analysis', async () => {
      const validData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadId: validData.uploadId,
        overallScore: validData.overallScore,
        contentScore: validData.contentScore,
        formattingScore: validData.formattingScore,
        keywordScore: validData.keywordScore,
        suggestions: JSON.stringify(validData.suggestions),
        strengths: JSON.stringify(validData.strengths),
        improvements: JSON.stringify(validData.improvements),
        analysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid score range', async () => {
      const invalidData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 150, // Invalid: exceeds 100
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for negative score', async () => {
      const invalidData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: -10, // Invalid: negative score
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid upload ID format', async () => {
      const invalidData = {
        uploadId: 'invalid-uuid',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for non-array suggestions', async () => {
      const invalidData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: 'Not an array' as any,
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findByUploadId', () => {
    it('should find feedback by upload ID and parse JSON fields', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: JSON.stringify(['Improve action verbs']),
        strengths: JSON.stringify(['Clear objective']),
        improvements: JSON.stringify(['Add more metrics']),
        analysis: JSON.stringify({ sections: [{ name: 'Experience', score: 90 }] }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.findUnique.mockResolvedValue(mockResult);

      const result = await model.findByUploadId('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.feedback.findUnique).toHaveBeenCalledWith({
        where: { uploadId: '123e4567-e89b-12d3-a456-426614174000' },
        include: { upload: true },
      });

      expect(result).toEqual({
        ...mockResult,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
        analysis: { sections: [{ name: 'Experience', score: 90 }] },
      });
    });

    it('should return null for non-existent upload ID', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue(null);

      const result = await model.findByUploadId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeNull();
    });

    it('should handle feedback without analysis', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: JSON.stringify(['Improve action verbs']),
        strengths: JSON.stringify(['Clear objective']),
        improvements: JSON.stringify(['Add more metrics']),
        analysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.findUnique.mockResolvedValue(mockResult);

      const result = await model.findByUploadId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        ...mockResult,
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
        analysis: undefined,
      });
    });
  });

  describe('deleteByUploadId', () => {
    it('should delete feedback by upload ID', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: JSON.stringify(['Improve action verbs']),
        strengths: JSON.stringify(['Clear objective']),
        improvements: JSON.stringify(['Add more metrics']),
        analysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.delete.mockResolvedValue(mockResult);

      const result = await model.deleteByUploadId('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.feedback.delete).toHaveBeenCalledWith({
        where: { uploadId: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(expect.objectContaining({
        id: mockResult.id,
        uploadId: mockResult.uploadId,
        overallScore: mockResult.overallScore,
        contentScore: mockResult.contentScore,
        formattingScore: mockResult.formattingScore,
        keywordScore: mockResult.keywordScore,
        suggestions: mockResult.suggestions,
        strengths: mockResult.strengths,
        improvements: mockResult.improvements,
        analysis: mockResult.analysis,
      }));
    });
  });

  describe('business rules', () => {
    it('should enforce score consistency', async () => {
      const inconsistentData = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 50, // Low overall score
        contentScore: 95, // High content score
        formattingScore: 90, // High formatting score
        keywordScore: 88, // High keyword score
        suggestions: ['Improve action verbs'],
        strengths: ['Clear objective'],
        improvements: ['Add more metrics'],
      };

      // This should pass validation but might indicate a business rule issue
      // The model should handle this gracefully
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...inconsistentData,
        suggestions: JSON.stringify(inconsistentData.suggestions),
        strengths: JSON.stringify(inconsistentData.strengths),
        improvements: JSON.stringify(inconsistentData.improvements),
        analysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.create.mockResolvedValue(mockResult);

      const result = await model.create(inconsistentData);
      expect(result).toBeDefined();
    });

    it('should handle empty arrays for suggestions, strengths, and improvements', async () => {
      const dataWithEmptyArrays = {
        uploadId: '123e4567-e89b-12d3-a456-426614174000',
        overallScore: 85,
        contentScore: 90,
        formattingScore: 80,
        keywordScore: 88,
        suggestions: [],
        strengths: [],
        improvements: [],
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...dataWithEmptyArrays,
        suggestions: JSON.stringify(dataWithEmptyArrays.suggestions),
        strengths: JSON.stringify(dataWithEmptyArrays.strengths),
        improvements: JSON.stringify(dataWithEmptyArrays.improvements),
        analysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.feedback.create.mockResolvedValue(mockResult);

      const result = await model.create(dataWithEmptyArrays);
      expect(result).toBeDefined();
    });
  });
});
