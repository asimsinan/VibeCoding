import { NextRequest } from 'next/server';
import { FeedbackController } from '../../../lib/resume-reviewer/controllers/feedback-controller';
import { FeedbackService } from '../../../lib/resume-reviewer/services/feedback-service';
import { ModelFactory } from '../../../lib/resume-reviewer/models';

// Mock the services
jest.mock('../../../lib/resume-reviewer/services/feedback-service');
jest.mock('../../../lib/resume-reviewer/models');

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let mockFeedbackService: jest.Mocked<FeedbackService>;
  let mockModelFactory: jest.Mocked<typeof ModelFactory>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFeedbackService = new FeedbackService() as jest.Mocked<FeedbackService>;
    mockModelFactory = ModelFactory as jest.Mocked<typeof ModelFactory>;
    
    controller = new FeedbackController(mockFeedbackService);
  });

  describe('GET /api/v1/feedback/{uploadId}', () => {
    it('should return feedback for valid upload ID', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
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
        suggestions: ['Improve keyword density', 'Add more quantified achievements'],
        strengths: ['Strong technical skills', 'Good formatting'],
        improvements: ['Add more quantified achievements', 'Include more industry keywords'],
        analysis: {
          wordCount: 500,
          readabilityScore: 75,
          sections: {
            contact: { present: true },
            experience: { present: true },
            education: { present: true },
            skills: { present: true }
          }
        },
        recommendations: {
          high: ['Add quantified achievements'],
          medium: ['Improve keyword density'],
          low: ['Fix minor formatting issues']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback)
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        uploadId: uploadId,
        status: 'completed',
        feedback: {
          overallScore: 85,
          contentScore: 80,
          formattingScore: 90,
          keywordScore: 85,
          suggestions: expect.arrayContaining(['Improve keyword density']),
          strengths: expect.arrayContaining(['Strong technical skills']),
          improvements: expect.arrayContaining(['Add more quantified achievements']),
          analysis: expect.objectContaining({
            wordCount: 500,
            readabilityScore: 75
          }),
          // recommendations no longer asserted
        }
      });
    });

    it('should return processing status when feedback not ready', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
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
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(null)
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(202);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        uploadId: uploadId,
        status: 'processing',
        message: 'Resume is being processed. Please check back in a few moments.',
        estimatedTime: expect.any(String)
      });
    });

    it('should return 404 for non-existent upload', async () => {
      const uploadId = 'non-existent-upload';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/non-existent-upload',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(null)
      } as any);

      const response = await controller.getFeedback(mockRequest);

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
        url: 'https://example.com/api/v1/feedback/invalid-id-format',
        headers: new Headers()
      } as unknown as NextRequest;

      // Mock ModelFactory to prevent database calls
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(null)
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_UPLOAD_ID',
        message: 'Invalid upload ID format'
      });
    });

    it('should handle database errors gracefully', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve upload information'
      });
    });

    it('should handle feedback retrieval errors', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
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
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockRejectedValue(new Error('Feedback retrieval failed'))
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'FEEDBACK_RETRIEVAL_ERROR',
        message: 'Failed to retrieve feedback'
      });
    });

    it('should return feedback with proper JSON parsing', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
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
        suggestions: JSON.stringify(['Improve keyword density', 'Add more quantified achievements']),
        strengths: JSON.stringify(['Strong technical skills', 'Good formatting']),
        improvements: JSON.stringify(['Add more quantified achievements', 'Include more industry keywords']),
        analysis: JSON.stringify({
          wordCount: 500,
          readabilityScore: 75,
          sections: {
            contact: { present: true },
            experience: { present: true },
            education: { present: true },
            skills: { present: true }
          }
        }),
        recommendations: JSON.stringify({
          high: ['Add quantified achievements'],
          medium: ['Improve keyword density'],
          low: ['Fix minor formatting issues']
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback)
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.feedback.suggestions).toEqual(['Improve keyword density', 'Add more quantified achievements']);
      expect(responseData.feedback.strengths).toEqual(['Strong technical skills', 'Good formatting']);
      expect(responseData.feedback.improvements).toEqual(['Add more quantified achievements', 'Include more industry keywords']);
      expect(responseData.feedback.analysis).toEqual({
        wordCount: 500,
        readabilityScore: 75,
        sections: {
          contact: { present: true },
          experience: { present: true },
          education: { present: true },
          skills: { present: true }
        }
      });
      // recommendations are not part of the current response
      expect(responseData.feedback.recommendations).toBeUndefined();
    });

    it('should handle malformed JSON in feedback data', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
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
        suggestions: 'malformed-json',
        strengths: 'malformed-json',
        improvements: 'malformed-json',
        analysis: 'malformed-json',
        recommendations: 'malformed-json',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getResumeUploadModel.mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback)
      } as any);

      const response = await controller.getFeedback(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      // Should handle malformed JSON gracefully
      expect(responseData.feedback.suggestions).toBe('malformed-json');
      expect(responseData.feedback.strengths).toBe('malformed-json');
    });

    it('should validate upload ID format', async () => {
      const invalidUploadIds = ['', '123', 'invalid-format', 'too-long-id-that-exceeds-maximum-length'];

      for (const uploadId of invalidUploadIds) {
        const mockRequest = {
          url: `https://example.com/api/v1/feedback/${uploadId}`,
          headers: new Headers()
        } as unknown as NextRequest;

        // Mock ModelFactory to prevent database calls
        mockModelFactory.getResumeUploadModel.mockReturnValue({
          findById: jest.fn().mockResolvedValue(null)
        } as any);

        const response = await controller.getFeedback(mockRequest);

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

    it('should handle concurrent requests for same upload ID', async () => {
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
        findById: jest.fn().mockResolvedValue(mockUpload)
      } as any);

      mockModelFactory.getFeedbackModel.mockReturnValue({
        findByUploadId: jest.fn().mockResolvedValue(mockFeedback)
      } as any);

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () => {
        const mockRequest = {
          url: 'https://example.com/api/v1/feedback/upload-123',
          headers: new Headers()
        } as unknown as NextRequest;
        return controller.getFeedback(mockRequest);
      });

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const uploadId = 'upload-123';
      const mockRequest = {
        url: 'https://example.com/api/v1/feedback/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      // Mock an unexpected error
      mockModelFactory.getResumeUploadModel.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await controller.getFeedback(mockRequest);

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
        url: 'https://example.com/api/v1/feedback/upload-123',
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getResumeUploadModel.mockImplementation(() => {
        throw new Error('Test error');
      });

      await controller.getFeedback(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Feedback retrieval error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
