import { NextRequest } from 'next/server';
import { UploadController } from '../../../lib/resume-reviewer/controllers/upload-controller';
import { ResumeAnalysisService } from '../../../lib/resume-reviewer/services/resume-analysis-service';
import { FeedbackService } from '../../../lib/resume-reviewer/services/feedback-service';
import { ValidationService } from '../../../lib/resume-reviewer/services/validation-service';
import { ModelFactory } from '../../../lib/resume-reviewer/models';

// Mock the services
jest.mock('../../../lib/resume-reviewer/services/resume-analysis-service');
jest.mock('../../../lib/resume-reviewer/services/feedback-service');
jest.mock('../../../lib/resume-reviewer/services/validation-service');
jest.mock('../../../lib/resume-reviewer/models');

describe('UploadController', () => {
  let controller: UploadController;
  let mockAnalysisService: jest.Mocked<ResumeAnalysisService>;
  let mockFeedbackService: jest.Mocked<FeedbackService>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockModelFactory: jest.Mocked<typeof ModelFactory>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAnalysisService = new ResumeAnalysisService() as jest.Mocked<ResumeAnalysisService>;
    mockFeedbackService = new FeedbackService() as jest.Mocked<FeedbackService>;
    mockValidationService = new ValidationService() as jest.Mocked<ValidationService>;
    mockModelFactory = ModelFactory as jest.Mocked<typeof ModelFactory>;
    
    controller = new UploadController(
      mockAnalysisService,
      mockFeedbackService,
      mockValidationService
    );
  });

  describe('POST /api/v1/upload', () => {
    it('should upload and process a valid resume file', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const mockAnalysisResult = {
        sections: { contact: { present: true }, experience: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { email: 'test@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const mockFeedbackResult = {
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] }
      };

      const mockUpload = {
        id: 'upload-123',
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockResolvedValue(mockAnalysisResult);
      mockFeedbackService.generateFeedback.mockResolvedValue(mockFeedbackResult);
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockUpload)
      } as any);
      mockModelFactory.getFeedbackModel.mockReturnValue({
        create: jest.fn().mockResolvedValue({ id: 'feedback-123' })
      } as any);

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        uploadId: 'upload-123',
        fileName: 'resume.pdf',
        status: 'completed',
        message: 'Resume uploaded and processed successfully'
      });
    });

    it('should handle missing file error', async () => {
      const formData = new FormData();
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'MISSING_FILE',
        message: 'No file provided'
      });
    });

    it('should handle invalid file type error', async () => {
      const mockFile = new File(['content'], 'document.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_FILE_TYPE',
        message: 'Only PDF files are allowed'
      });
    });

    it('should handle file size limit error', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const mockFile = new File([largeContent], 'large-resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(413);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum limit of 5MB'
      });
    });

    it('should handle validation errors', async () => {
      const mockFile = new File(['invalid resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      mockValidationService.validateResume.mockResolvedValue({
        isValid: false,
        errors: ['Missing contact information', 'No work experience'],
        warnings: [],
        score: 30,
        suggestions: []
      });

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'VALIDATION_FAILED',
        message: 'Resume validation failed'
      });
    });

    it('should handle analysis service errors', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockRejectedValue(new Error('Analysis failed'));

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze resume'
      });
    });

    it('should handle feedback generation errors', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const mockAnalysisResult = {
        sections: { contact: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { email: 'test@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockResolvedValue(mockAnalysisResult);
      mockFeedbackService.generateFeedback.mockRejectedValue(new Error('Feedback generation failed'));

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'FEEDBACK_GENERATION_FAILED',
        message: 'Failed to generate feedback'
      });
    });

    it('should handle database errors', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const mockAnalysisResult = {
        sections: { contact: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { email: 'test@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const mockFeedbackResult = {
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] }
      };

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockResolvedValue(mockAnalysisResult);
      mockFeedbackService.generateFeedback.mockResolvedValue(mockFeedbackResult);
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        create: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);
      mockModelFactory.getFeedbackModel.mockReturnValue({
        create: jest.fn().mockResolvedValue({ id: 'feedback-123' })
      } as any);

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'DATABASE_ERROR',
        message: 'Failed to save upload record'
      });
    });

    it('should handle missing session ID', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'MISSING_SESSION_ID',
        message: 'Session ID is required'
      });
    });

    it('should handle invalid session ID format', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'invalid-session-id');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: true,
        code: 'INVALID_SESSION_ID',
        message: 'Invalid session ID format'
      });
    });

    it('should handle concurrent uploads for same session', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers()
      } as unknown as NextRequest;

      const mockAnalysisResult = {
        sections: { contact: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { email: 'test@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const mockFeedbackResult = {
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] }
      };

      const mockUpload = {
        id: 'upload-123',
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockResolvedValue(mockAnalysisResult);
      mockFeedbackService.generateFeedback.mockResolvedValue(mockFeedbackResult);
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockUpload)
      } as any);
      mockModelFactory.getFeedbackModel.mockReturnValue({
        create: jest.fn().mockResolvedValue({ id: 'feedback-123' })
      } as any);

      // Simulate concurrent requests
      const promises = [
        controller.uploadResume(mockRequest),
        controller.uploadResume(mockRequest),
        controller.uploadResume(mockRequest)
      ];

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const mockRequest = {
        formData: jest.fn().mockRejectedValue(new Error('Unexpected error')),
        headers: new Headers()
      } as unknown as NextRequest;

      const response = await controller.uploadResume(mockRequest);

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
      
      const mockRequest = {
        formData: jest.fn().mockRejectedValue(new Error('Test error')),
        headers: new Headers()
      } as unknown as NextRequest;

      await controller.uploadResume(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Upload error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request Validation', () => {
    it('should validate request headers', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('sessionId', 'test-session-123');

      const mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
        headers: new Headers({
          'content-type': 'multipart/form-data',
          'user-agent': 'test-agent'
        })
      } as unknown as NextRequest;

      const mockAnalysisResult = {
        sections: { contact: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { email: 'test@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const mockFeedbackResult = {
        overallScore: 85,
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 85,
        suggestions: ['Improve keyword density'],
        strengths: ['Strong technical skills'],
        improvements: ['Add more quantified achievements'],
        analysis: { wordCount: 500 },
        recommendations: { high: [], medium: [], low: [] }
      };

      const mockUpload = {
        id: 'upload-123',
        fileName: 'resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        status: 'COMPLETED',
        sessionId: 'test-session-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockValidationService.validateResume.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 90,
        suggestions: []
      });

      mockAnalysisService.processResume.mockResolvedValue(mockAnalysisResult);
      mockFeedbackService.generateFeedback.mockResolvedValue(mockFeedbackResult);
      mockModelFactory.getResumeUploadModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockUpload)
      } as any);
      mockModelFactory.getFeedbackModel.mockReturnValue({
        create: jest.fn().mockResolvedValue({ id: 'feedback-123' })
      } as any);

      const response = await controller.uploadResume(mockRequest);

      expect(response.status).toBe(200);
    });
  });
});
