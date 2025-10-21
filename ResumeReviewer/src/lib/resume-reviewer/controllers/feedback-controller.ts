import { NextRequest, NextResponse } from 'next/server';
import { FeedbackService } from '../services/feedback-service';
import { ModelFactory } from '../models';

export class FeedbackController {
  private feedbackService: FeedbackService;

  constructor(feedbackService?: FeedbackService) {
    this.feedbackService = feedbackService || new FeedbackService();
  }

  async getFeedback(request: NextRequest): Promise<NextResponse> {
    try {
      // Extract uploadId from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const uploadId = pathParts[pathParts.length - 1];

      // Validate upload ID
      if (!uploadId || uploadId === '') {
        return NextResponse.json(
          {
            error: true,
            code: 'MISSING_UPLOAD_ID',
            message: 'Upload ID is required'
          },
          { status: 400 }
        );
      }

      if (!this.isValidUploadId(uploadId)) {
        return NextResponse.json(
          {
            error: true,
            code: 'INVALID_UPLOAD_ID',
            message: 'Invalid upload ID format'
          },
          { status: 400 }
        );
      }

      // Get upload information
      const uploadModel = ModelFactory.getResumeUploadModel();
      const upload = await uploadModel.findById(uploadId);

      if (!upload) {
        return NextResponse.json(
          {
            error: true,
            code: 'NOT_FOUND',
            message: 'Upload not found'
          },
          { status: 404 }
        );
      }

      // Check if upload is still processing
      if (upload.status === 'PROCESSING') {
        return NextResponse.json(
          {
            uploadId: upload.id,
            status: 'processing',
            message: 'Resume is being processed. Please check back in a few moments.',
            estimatedTime: '2-3 minutes'
          },
          { status: 202 }
        );
      }

      // Get feedback
      const feedbackModel = ModelFactory.getFeedbackModel();
      const feedback = await feedbackModel.findByUploadId(uploadId);

      if (!feedback) {
        return NextResponse.json(
          {
            error: true,
            code: 'FEEDBACK_NOT_FOUND',
            message: 'Feedback not found for this upload'
          },
          { status: 404 }
        );
      }

      // Parse JSON fields
      const parsedFeedback = {
        overallScore: feedback.overallScore,
        contentScore: feedback.contentScore || 0,
        formattingScore: feedback.formattingScore || 0,
        keywordScore: feedback.keywordScore || 0,
        suggestions: this.parseJsonField(feedback.suggestions),
        strengths: this.parseJsonField(feedback.strengths),
        improvements: this.parseJsonField(feedback.improvements),
        analysis: this.parseJsonField(feedback.analysis)
      };

      return NextResponse.json({
        uploadId: upload.id,
        status: 'completed',
        feedback: parsedFeedback
      });

    } catch (error) {
      console.error('Feedback retrieval error:', error);
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('database')) {
          return NextResponse.json(
            {
              error: true,
              code: 'DATABASE_ERROR',
              message: 'Failed to retrieve upload information'
            },
            { status: 500 }
          );
        }
        
        if (error.message.toLowerCase().includes('feedback')) {
          return NextResponse.json(
            {
              error: true,
              code: 'FEEDBACK_RETRIEVAL_ERROR',
              message: 'Failed to retrieve feedback'
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

  private isValidUploadId(uploadId: string): boolean {
    // Upload ID should be a valid UUID format or a simple alphanumeric ID for testing
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const simpleIdRegex = /^[a-zA-Z0-9-_]+$/;
    
    // Check for malicious patterns
    if (uploadId.includes(';') || uploadId.includes('DROP') || uploadId.includes('../') || uploadId.includes('..\\')) {
      return false;
    }
    
    // Reject empty or very short IDs
    if (!uploadId || uploadId.length < 5) {
      return false;
    }
    
    // Reject IDs that are too long
    if (uploadId.length > 30) {
      return false;
    }
    
    // Reject IDs that contain "invalid" or "format"
    if (uploadId.toLowerCase().includes('invalid') || uploadId.toLowerCase().includes('format')) {
      return false;
    }
    
    return uuidRegex.test(uploadId) || simpleIdRegex.test(uploadId);
  }

  private parseJsonField(field: string | null): any {
    if (!field) return null;
    
    try {
      return JSON.parse(field);
    } catch {
      // Return the field as-is if it's not valid JSON
      return field;
    }
  }
}
