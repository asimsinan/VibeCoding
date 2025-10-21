import { NextRequest, NextResponse } from 'next/server';
import { ModelFactory } from '../../../../../src/lib/resume-reviewer/models';
import { z } from 'zod';

// Initialize model factory
const modelFactory = new ModelFactory();

// Request validation schemas
const DeleteRequestSchema = z.object({
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

// Delete endpoint handler
export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const uploadId = pathname.split('/').pop();
    
    if (!uploadId) {
      return createErrorResponse('MISSING_UPLOAD_ID', 'Upload ID is required');
    }
    
    // Validate UUID format
    const validation = DeleteRequestSchema.safeParse({ uploadId });
    if (!validation.success) {
      return createErrorResponse('INVALID_UUID_FORMAT', 'Invalid UUID format for uploadId');
    }
    
    // Check if upload exists
    const uploadModel = modelFactory.getResumeUploadModel();
    const upload = await uploadModel.findById(uploadId);
    
    if (!upload) {
      return createErrorResponse('NOT_FOUND', 'Upload ID not found', 404);
    }
    
    // Delete upload and associated feedback
    await uploadModel.delete(uploadId);
    
    return createSuccessResponse({
      success: true,
      message: 'Upload and associated data deleted successfully.',
    });
    
  } catch (error) {
    console.error('Delete Error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}