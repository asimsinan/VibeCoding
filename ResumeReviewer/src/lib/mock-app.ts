import express from 'express';
import multer from 'multer';
import { ModelFactory } from './resume-reviewer/models';

const modelFactory = new ModelFactory();
const app = express();
app.use(express.json({
  verify: (req, res: any, buf, encoding) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST_FORMAT',
        message: 'Invalid JSON format',
        timestamp: new Date().toISOString()
      });
      return;
    }
  }
}));
function createErrorResponse(res: any, code: string, message: string, status: number = 400, details?: any) {
  return res.status(status).json({
    error: true,
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}
// Success response helper
function createSuccessResponse(res: any, data: any, status: number = 200) {
  return res.status(status).json(data);
}

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }
});

// POST /api/v1/upload
app.post('/api/v1/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return createErrorResponse(res, 'MISSING_FILE', 'File is required', 400);
    }

    // Simulate file size limit error
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse(res, 'FILE_TOO_LARGE', 'File size cannot exceed 10MB', 413);
    }

    // Simulate rate limiting (for testing purposes)
    if (req.headers['x-simulate-rate-limit'] === 'true') {
      return createErrorResponse(res, 'TOO_MANY_REQUESTS', 'Too many requests', 429);
    }

    // Simulate server error
    if (req.headers['x-simulate-server-error'] === 'true') {
      return createErrorResponse(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }

    // Simulate request timeout
    if (req.headers['x-simulate-timeout'] === 'true') {
      return createErrorResponse(res, 'REQUEST_TIMEOUT', 'Request timeout', 408);
    }

    const uploadModel = modelFactory.getResumeUploadModel();
    const feedbackModel = modelFactory.getFeedbackModel();
    const sessionModel = modelFactory.getUserSessionModel();

    // Ensure a user session exists to satisfy foreign key constraints
    const providedSessionId = (req.headers['x-session-id'] as string) ||
      (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : '123e4567-e89b-12d3-a456-426614174000');
    try {
      // Try to create; if unique constraint, ignore
      await sessionModel.create({ sessionId: providedSessionId });
    } catch (e) {
      // Ignore duplicate session creation errors
    }

    const newUpload = await uploadModel.create({
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype as any,
      sessionId: providedSessionId,
    });

    // Check if this should be a processing upload (for testing)
    if (req.headers['x-simulate-processing'] === 'true') {
      // Keep status as PROCESSING, don't create feedback
      return res.status(200).json({
        uploadId: newUpload.id,
        status: 'processing',
        timestamp: newUpload.createdAt.toISOString(),
        fileInfo: {
          fileName: newUpload.fileName,
          fileSize: newUpload.fileSize,
          fileType: newUpload.fileType,
        },
      });
    }

    await feedbackModel.create({
      uploadId: newUpload.id,
      overallScore: Math.floor(Math.random() * 30) + 70,
      contentScore: Math.floor(Math.random() * 30) + 70,
      formattingScore: Math.floor(Math.random() * 30) + 70,
      keywordScore: Math.floor(Math.random() * 30) + 70,
      suggestions: [{
        id: 'mock-suggestion-1',
        text: 'Mock suggestion 1',
        evidence: 'Mock evidence',
        example: 'Mock example',
        impact: 'medium' as const
      }],
      strengths: [{
        id: 'mock-strength-1',
        text: 'Mock strength 1',
        evidence: 'Mock evidence',
        category: 'technical' as const
      }],
      improvements: [{
        id: 'mock-improvement-1',
        text: 'Mock improvement 1',
        evidence: 'Mock evidence',
        example: 'Mock example',
        severity: 'medium' as const
      }],
    });

    await uploadModel.update(newUpload.id, { status: 'COMPLETED' });

    res.status(200).json({
      uploadId: newUpload.id,
      status: 'completed',
      timestamp: newUpload.createdAt.toISOString(),
      fileInfo: {
        fileName: newUpload.fileName,
        fileSize: newUpload.fileSize,
        fileType: newUpload.fileType,
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ error: true, code: 'INVALID_FILE_TYPE', message: 'Unsupported file type. Please upload PDF, DOC, or DOCX.' });
    }
    console.error('Mock Upload Error:', error);
    res.status(500).json({ error: true, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error', details: error.message });
  }
});

// GET /api/v1/feedback/:uploadId
app.get('/api/v1/feedback/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    if (!uploadId) {
      return createErrorResponse(res, 'MISSING_UPLOAD_ID', 'Upload ID is required');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uploadId)) {
      return createErrorResponse(res, 'INVALID_UUID_FORMAT', 'Invalid UUID format for uploadId');
    }
    
    // Get upload record
    const uploadModel = modelFactory.getResumeUploadModel();
    const upload = await uploadModel.findById(uploadId);
    
    if (!upload) {
      return createErrorResponse(res, 'NOT_FOUND', 'Upload ID not found', 404);
    }
    
    // Simulate server error for feedback
    if (req.headers['x-simulate-server-error'] === 'true') {
      return createErrorResponse(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
    
    // Check if processing is complete
    if (upload.status === 'PROCESSING') {
      return createSuccessResponse(res, {
        uploadId,
        status: 'processing',
        message: 'Resume is currently being processed. Please check back later.',
        estimatedTime: '2-3 minutes',
      }, 202);
    }
    
    if (upload.status === 'ERROR') {
      return createErrorResponse(res, 'PROCESSING_ERROR', 'Resume processing failed', 500);
    }
    
    // Get feedback
    const feedbackModel = modelFactory.getFeedbackModel();
    const feedback = await feedbackModel.findByUploadId(uploadId);
    
    if (!feedback) {
      return createErrorResponse(res, 'FEEDBACK_NOT_FOUND', 'Feedback not found for this upload', 404);
    }
    
    return createSuccessResponse(res, {
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
      res,
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
});

// DELETE /api/v1/upload/:uploadId
app.delete('/api/v1/upload/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    if (!uploadId) {
      return createErrorResponse(res, 'MISSING_UPLOAD_ID', 'Upload ID is required');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uploadId)) {
      return createErrorResponse(res, 'INVALID_UUID_FORMAT', 'Invalid UUID format for uploadId');
    }
    
    // Simulate server error for delete
    if (req.headers['x-simulate-server-error'] === 'true') {
      return createErrorResponse(res, 'INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
    
    // Check if upload exists
    const uploadModel = modelFactory.getResumeUploadModel();
    const upload = await uploadModel.findById(uploadId);
    
    if (!upload) {
      return createErrorResponse(res, 'NOT_FOUND', 'Upload ID not found', 404);
    }
    
    // Delete upload and associated feedback
    await uploadModel.delete(uploadId);
    
    return createSuccessResponse(res, {
      success: true,
      message: 'Upload and associated data deleted successfully.',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Delete Error:', error);
    return createErrorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
});

// GET /api/v1/health
app.get('/api/v1/health', async (req, res) => {
  try {
    // Simulate service unavailable
    if (req.headers['x-simulate-service-unavailable'] === 'true') {
      return createErrorResponse(res, 'SERVICE_UNAVAILABLE', 'One or more critical services are unavailable', 503);
    }
    
    // Check database
    const prisma = modelFactory.getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    
    let services: any = {
      database: 'healthy',
      ai_service: 'healthy',
      file_storage: 'healthy'
    };
    
    // Simulate degraded/unhealthy states based on headers for testing
    if (req.headers['x-simulate-db-unhealthy'] === 'true') {
      services.database = 'unhealthy';
    }
    if (req.headers['x-simulate-ai-degraded'] === 'true') {
      services.ai_service = 'degraded';
    }
    if (req.headers['x-simulate-storage-unhealthy'] === 'true') {
      services.file_storage = 'unhealthy';
    }
    
    // Determine overall status
    const overallStatus = Object.values(services).every(status => status === 'healthy')
      ? 'healthy'
      : Object.values(services).some(status => status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';
    
    // Return 503 if any service is unhealthy
    if (overallStatus === 'unhealthy') {
      return createErrorResponse(res, 'SERVICE_UNAVAILABLE', 'One or more critical services are unavailable', 503);
    }
    
    return createSuccessResponse(res, {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services,
    });
    
  } catch (error) {
    console.error('Health Check Error:', error);
    return createErrorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
});

// Error handling middleware for multer (must be after routes)
app.use((error: any, req: any, res: any, next: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: true, 
      code: 'FILE_TOO_LARGE', 
      message: 'File size cannot exceed 10MB',
      timestamp: new Date().toISOString()
    });
  }
  if (error.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ 
      error: true, 
      code: 'INVALID_FILE_TYPE', 
      message: 'Unsupported file type. Please upload PDF, DOC, or DOCX.',
      timestamp: new Date().toISOString()
    });
  }
  next(error);
});

export default app;
