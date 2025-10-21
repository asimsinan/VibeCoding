import { ResumeUploadModel, ResumeUploadCreateSchema, ResumeUploadUpdateSchema } from '../../lib/resume-reviewer/models/index';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Mock Prisma Client
const mockPrisma = {
  resumeUpload: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userSession: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;

describe('ResumeUploadModel', () => {
  let model: ResumeUploadModel;

  beforeEach(() => {
    model = new ResumeUploadModel(mockPrisma);
    jest.clearAllMocks();
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

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validData,
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.resumeUpload.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(mockPrisma.resumeUpload.create).toHaveBeenCalledWith({ data: validData });
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid file size', async () => {
      const invalidData = {
        fileName: 'test-resume.pdf',
        fileSize: 11 * 1024 * 1024, // 11MB - exceeds limit
        fileType: 'application/pdf' as const,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid file type', async () => {
      const invalidData = {
        fileName: 'test-resume.txt',
        fileSize: 1024,
        fileType: 'text/plain' as any,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for empty file name', async () => {
      const invalidData = {
        fileName: '',
        fileSize: 1024,
        fileType: 'application/pdf' as const,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for file name too long', async () => {
      const invalidData = {
        fileName: 'a'.repeat(256), // Exceeds 255 char limit
        fileSize: 1024,
        fileType: 'application/pdf' as const,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid session ID format', async () => {
      const invalidData = {
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf' as const,
        sessionId: 'invalid-uuid',
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find resume upload by valid ID', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.resumeUpload.findUnique.mockResolvedValue(mockResult);

      const result = await model.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.resumeUpload.findUnique).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        include: { feedback: true, session: true },
      });
      expect(result).toEqual(mockResult);
    });

    it('should return null for non-existent ID', async () => {
      mockPrisma.resumeUpload.findUnique.mockResolvedValue(null);

      const result = await model.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update resume upload with valid data', async () => {
      const updateData = {
        status: 'COMPLETED' as const,
        fileUrl: 'https://example.com/updated-resume.pdf',
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.resumeUpload.update.mockResolvedValue(mockResult);

      const result = await model.update('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(mockPrisma.resumeUpload.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: updateData,
        include: { feedback: true, session: true },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid status', async () => {
      const invalidData = {
        status: 'INVALID_STATUS' as any,
      };

      await expect(model.update('123e4567-e89b-12d3-a456-426614174000', invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid file size in update', async () => {
      const invalidData = {
        fileSize: 11 * 1024 * 1024, // 11MB - exceeds limit
      };

      await expect(model.update('123e4567-e89b-12d3-a456-426614174000', invalidData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete resume upload by ID', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileName: 'test-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.resumeUpload.delete.mockResolvedValue(mockResult);

      const result = await model.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.resumeUpload.delete).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findBySessionId', () => {
    it('should find resume uploads by session ID', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          status: 'COMPLETED',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.resumeUpload.findMany.mockResolvedValue(mockResults);

      const result = await model.findBySessionId('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.resumeUpload.findMany).toHaveBeenCalledWith({
        where: { sessionId: '123e4567-e89b-12d3-a456-426614174000' },
        include: { feedback: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should return empty array for non-existent session ID', async () => {
      mockPrisma.resumeUpload.findMany.mockResolvedValue([]);

      const result = await model.findBySessionId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual([]);
    });
  });

  describe('validation schemas', () => {
    describe('ResumeUploadCreateSchema', () => {
      it('should validate valid create data', () => {
        const validData = {
          fileName: 'test-resume.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          fileUrl: 'https://example.com/resume.pdf',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
        };

        expect(() => ResumeUploadCreateSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid file types', () => {
        const invalidData = {
          fileName: 'test-resume.txt',
          fileSize: 1024,
          fileType: 'text/plain',
        };

        expect(() => ResumeUploadCreateSchema.parse(invalidData)).toThrow();
      });

      it('should reject file size exceeding limit', () => {
        const invalidData = {
          fileName: 'test-resume.pdf',
          fileSize: 11 * 1024 * 1024,
          fileType: 'application/pdf',
        };

        expect(() => ResumeUploadCreateSchema.parse(invalidData)).toThrow();
      });
    });

    describe('ResumeUploadUpdateSchema', () => {
      it('should validate valid update data', () => {
        const validData = {
          status: 'COMPLETED',
          fileUrl: 'https://example.com/updated-resume.pdf',
        };

        expect(() => ResumeUploadUpdateSchema.parse(validData)).not.toThrow();
      });

      it('should reject invalid status', () => {
        const invalidData = {
          status: 'INVALID_STATUS',
        };

        expect(() => ResumeUploadUpdateSchema.parse(invalidData)).toThrow();
      });
    });
  });
});
