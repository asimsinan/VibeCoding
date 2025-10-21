import { NextRequest, NextResponse } from 'next/server';
import { ModelFactory } from '../../../../../src/lib/resume-reviewer/models';
import { z } from 'zod';

// Initialize model factory
const modelFactory = new ModelFactory();

// Request validation schemas
const FeedbackRequestSchema = z.object({
  uploadId: z.string().uuid('Invalid UUID format'),
});

// Error response helper
function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: true,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// Success response helper
function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// Feedback endpoint handler
export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const uploadId = pathname.split('/').pop();
    
    if (!uploadId) {
      return createErrorResponse('MISSING_UPLOAD_ID', 'Upload ID is required');
    }
    
    // Validate UUID format
    const validation = FeedbackRequestSchema.safeParse({ uploadId });
    if (!validation.success) {
      return createErrorResponse('INVALID_UUID_FORMAT', 'Invalid UUID format for uploadId');
    }
    
    // Get upload record
    const uploadModel = modelFactory.getResumeUploadModel();
    const upload = await uploadModel.findById(uploadId);
    
    if (!upload) {
      return createErrorResponse('NOT_FOUND', 'Upload ID not found', 404);
    }
    
    // Check if processing is complete
    if (upload.status === 'PROCESSING') {
      return createSuccessResponse({
        uploadId,
        status: 'processing',
        message: 'Resume is currently being processed. Please check back later.',
      }, 202);
    }
    
    if (upload.status === 'ERROR') {
      return createErrorResponse('PROCESSING_ERROR', 'Resume processing failed', 500);
    }
    
    // Get feedback
    const feedbackModel = modelFactory.getFeedbackModel();
    const feedback = await feedbackModel.findByUploadId(uploadId);
    
    if (!feedback) {
      return createErrorResponse('FEEDBACK_NOT_FOUND', 'Feedback not found for this upload', 404);
    }
    
    return createSuccessResponse({
      uploadId,
      status: 'completed',
      timestamp: feedback.createdAt.toISOString(),
      feedback: {
        overallScore: feedback.overallScore,
        contentScore: feedback.contentScore,
        formattingScore: feedback.formattingScore,
        keywordScore: feedback.keywordScore,
        suggestions: typeof feedback.suggestions === 'string' ? JSON.parse(feedback.suggestions) : feedback.suggestions,
        strengths: typeof feedback.strengths === 'string' ? JSON.parse(feedback.strengths) : feedback.strengths,
        improvements: typeof feedback.improvements === 'string' ? JSON.parse(feedback.improvements) : feedback.improvements,
        analysis: feedback.analysis ? (typeof feedback.analysis === 'string' ? JSON.parse(feedback.analysis) : feedback.analysis) : null,
      },
    });
    
  } catch (error) {
    console.error('Feedback Error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}