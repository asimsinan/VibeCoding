import { NextRequest } from 'next/server';
import { DeleteController } from '../../../lib/resume-reviewer/controllers/delete-controller';
import { ModelFactory } from '../../../lib/resume-reviewer/models';

// Mock the models
jest.mock('../../../lib/resume-reviewer/models');

describe('DeleteController', () => {
  let controller: DeleteController;
  let mockModelFactory: jest.Mocked<typeof ModelFactory>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModelFactory = ModelFactory as jest.Mocked<typeof ModelFactory>;
    
    controller = new DeleteController();
  });

  describe('DELETE /api/v1/upload/{uploadId}', () => {
    it('should delete upload and associated feedback successfully', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      const mockUpload = {
        id: uploadId,
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockFeedback = {
        id: 'feedback-123',
        uploadId: uploadId,
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload),
        delete: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback),
        deleteByUploadId: jest.fn().mockResolvedValue(true)
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        message: 'Upload and associated feedback deleted successfully',
        uploadId: uploadId,
        deletedAt: expect.any(String)
      });
    });

    it('should return 404 for non-existent upload', async () => {
      const uploadId = 'non-existent-upload';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/non-existent-upload',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(null)
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'NOT_FOUND',
        message: 'Upload not found'
      });
    });

    it('should return 400 for invalid upload ID format', async () => {
      const uploadId = 'invalid-id-format';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/invalid-id-format',
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_UPLOAD_ID',
        message: 'Invalid upload ID format'
      });
    });

    it('should handle upload deletion without feedback', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      const mockUpload = {
        id: uploadId,
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'PROCESSING',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload),
        delete: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(null),
        deleteByUploadId: jest.fn().mockResolvedValue(false)
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        message: 'Upload deleted successfully',
        uploadId: uploadId,
        deletedAt: expect.any(String)
      });
    });

    it('should handle database errors during upload retrieval', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve upload information'
      });
    });

    it('should handle database errors during upload deletion', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      const mockUpload = {
        id: uploadId,
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload),
        delete: jest.fn().mockRejectedValue(new Error('Database deletion failed'))
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(null),
        deleteByUploadId: jest.fn().mockResolvedValue(false)
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'DELETION_FAILED',
        message: 'Failed to delete upload'
      });
    });

    it('should handle feedback deletion errors gracefully', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      const mockUpload = {
        id: uploadId,
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockFeedback = {
        id: 'feedback-123',
        uploadId: uploadId,
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload),
        delete: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback),
        deleteByUploadId: jest.fn().mockRejectedValue(new Error('Feedback deletion failed'))
      } as any);

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'FEEDBACK_DELETION_FAILED',
        message: 'Failed to delete associated feedback'
      });
    });

    it('should validate upload ID format', async () => {
      const invalidUploadIds = ['', '123', 'invalid-format', 'too-long-id-that-exceeds-maximum-length'];

      for (const uploadId of invalidUploadIds) {
        const mockRequest = {
          url: `https://example.com/api/v1/upload/${uploadId}`,
          headers: new Headers()
        } as unknown as NextRequest;

        // Mock ModelFactory to prevent database calls
        mockModelFactory.getResumeUploadModel.mockReturnValue({
          findById: jest.fn().mockResolvedValue(null)
        } as any);

        const response = await controller.deleteUpload(mockRequest);

        expect(response.status).toBe(400);
        const responseData = await response.json();
        
        // Empty string should be MISSING_UPLOAD_ID, others should be INVALID_UPLOAD_ID
        if (uploadId === '') {
          expect(responseData).toMatchObject({
            error: true,
            code: 'MISSING_UPLOAD_ID',
            message: 'Upload ID is required'
          });
        } else {
          expect(responseData).toMatchObject({
            error: true,
            code: 'INVALID_UPLOAD_ID',
            message: 'Invalid upload ID format'
          });
        }
      }
    });

    it('should handle concurrent deletion requests', async () => {
      const uploadId = 'upload-123';
      const mockUpload = {
        id: uploadId,
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock ModelFactory to simulate concurrent deletion behavior
      let callCount = 0;
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockImplementation(() => {
          callCount++;
          // First call finds the upload, subsequent calls return null (already deleted)
          return callCount === 1 ? Promise.resolve(mockUpload) : Promise.resolve(null);
        }),
        delete: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(null),
        deleteByUploadId: jest.fn().mockResolvedValue(false)
      } as any);

      // Simulate concurrent deletion requests
      const promises = Array.from({ length: 3 }, () => {
        const mockRequest = {
          url: 'https://example.com/api/v1/upload/upload-123',
          headers: new Headers()
        } as unknown as NextRequest;
        return controller.deleteUpload(mockRequest);
      });

      const responses = await Promise.all(promises);

      // All requests should succeed (first one deletes, others return 404)
      responses.forEach((response, index) => {
        if (index === 0) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(404);
        }
      });
    });

    it('should handle missing params in request', async () => {
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/',
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'MISSING_UPLOAD_ID',
        message: 'Upload ID is required'
      });
    });

    it('should handle undefined params in request', async () => {
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/',
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'MISSING_UPLOAD_ID',
        message: 'Upload ID is required'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      // Mock an unexpected error
      mockModelFactory.getResumeUploadModel.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/upload/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockImplementation(() => {
        throw new Error('Test error');
      });

      await controller.deleteUpload(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Delete upload error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousUploadId = "'; DROP TABLE uploads; --";
      const mockRequest = {
        url: `https://example.com/api/v1/upload/${encodeURIComponent(maliciousUploadId)}`,
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_UPLOAD_ID',
        message: 'Invalid upload ID format'
      });
    });

    it('should handle path traversal attempts', async () => {
      const maliciousUploadId = '../../../etc/passwd';
      const mockRequest = {
        url: `https://example.com/api/v1/upload/${encodeURIComponent(maliciousUploadId)}`,
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.deleteUpload(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_UPLOAD_ID',
        message: 'Invalid upload ID format'
      });
    });
  });
});
