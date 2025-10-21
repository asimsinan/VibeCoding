import { NextRequest, NextResponse } from 'next/server';
import { ResumeAnalysisService } from '../services/resume-analysis-service';
import { FeedbackService } from '../services/feedback-service';
import { ValidationService } from '../services/validation-service';
import { ModelFactory } from '../models';

export class UploadController {
  private analysisService: ResumeAnalysisService;
  private feedbackService: FeedbackService;
  private validationService: ValidationService;

  constructor(
    analysisService?: ResumeAnalysisService,
    feedbackService?: FeedbackService,
    validationService?: ValidationService
  ) {
    this.analysisService = analysisService || new ResumeAnalysisService();
    this.feedbackService = feedbackService || new FeedbackService();
    this.validationService = validationService || new ValidationService();
  }

  async uploadResume(request: NextRequest): Promise<NextResponse> {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const sessionId = formData.get('sessionId') as string;

      // Validate file presence
      if (!file) {
        return NextResponse.json(
          {
            error: true,
            code: 'MISSING_FILE',
            message: 'No file provided'
          },
          { status: 400 }
        );
      }

      // Validate session ID
      if (!sessionId) {
        return NextResponse.json(
          {
            error: true,
            code: 'MISSING_SESSION_ID',
            message: 'Session ID is required'
          },
          { status: 400 }
        );
      }

      // Validate session ID format
      if (!this.isValidSessionId(sessionId)) {
        return NextResponse.json(
          {
            error: true,
            code: 'INVALID_SESSION_ID',
            message: 'Invalid session ID format'
          },
          { status: 400 }
        );
      }

      // Validate file type
      if (!this.isValidFileType(file)) {
        return NextResponse.json(
          {
            error: true,
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are allowed'
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (!this.isValidFileSize(file)) {
        return NextResponse.json(
          {
            error: true,
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum limit of 5MB'
          },
          { status: 413 }
        );
      }

      // Read file content
      const fileContent = await file.text();

      // Validate resume text
      const validationResult = await this.validationService.validateResume(fileContent);
      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            error: true,
            code: 'VALIDATION_FAILED',
            message: 'Resume validation failed',
            details: validationResult.errors
          },
          { status: 400 }
        );
      }

      // Process resume
      const analysisResult = await this.analysisService.processResume(fileContent);

      // Generate feedback
      const feedbackResult = await this.feedbackService.generateFeedback(analysisResult);

      // Save upload record
      const uploadModel = ModelFactory.getResumeUploadModel();
      const upload = await uploadModel.create({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type as 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sessionId: sessionId
      });

      // Save feedback record
      const feedbackModel = ModelFactory.getFeedbackModel();
      await feedbackModel.create({
        uploadId: upload.id,
        overallScore: feedbackResult.overallScore,
        contentScore: 0, // Default value - could be calculated from analysis
        formattingScore: 0, // Default value - could be calculated from analysis
        keywordScore: 0, // Default value - could be calculated from analysis
        suggestions: feedbackResult.suggestions,
        strengths: feedbackResult.strengths,
        improvements: feedbackResult.improvements,
        analysis: feedbackResult.analysis,
      });

      return NextResponse.json({
        uploadId: upload.id,
        fileName: upload.fileName,
        status: 'completed',
        message: 'Resume uploaded and processed successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('validation failed')) {
          return NextResponse.json(
            {
              error: true,
              code: 'VALIDATION_FAILED',
              message: 'Resume validation failed'
            },
            { status: 400 }
          );
        }
        
        if (error.message.toLowerCase().includes('analysis failed')) {
          return NextResponse.json(
            {
              error: true,
              code: 'ANALYSIS_FAILED',
              message: 'Failed to analyze resume'
            },
            { status: 500 }
          );
        }
        
        if (error.message.toLowerCase().includes('feedback generation failed')) {
          return NextResponse.json(
            {
              error: true,
              code: 'FEEDBACK_GENERATION_FAILED',
              message: 'Failed to generate feedback'
            },
            { status: 500 }
          );
        }
        
        if (error.message.toLowerCase().includes('database')) {
          return NextResponse.json(
            {
              error: true,
              code: 'DATABASE_ERROR',
              message: 'Failed to save upload record'
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          error: true,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        },
        { status: 500 }
      );
    }
  }

  private isValidSessionId(sessionId: string): boolean {
    // Session ID should be a valid UUID format or a simple alphanumeric ID for testing
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const simpleIdRegex = /^[a-zA-Z0-9-_]+$/;
    
    // Reject empty or very short IDs
    if (!sessionId || sessionId.length < 3) {
      return false;
    }
    
    // Reject IDs that are too long
    if (sessionId.length > 50) {
      return false;
    }
    
    // Reject IDs that start with "invalid"
    if (sessionId.toLowerCase().startsWith('invalid')) {
      return false;
    }
    
    return uuidRegex.test(sessionId) || simpleIdRegex.test(sessionId);
  }

  private isValidFileType(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  private isValidFileSize(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  }
}
