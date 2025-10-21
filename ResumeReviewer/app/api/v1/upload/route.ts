import { NextRequest, NextResponse } from 'next/server';
import { ModelFactory } from '../../../../src/lib/resume-reviewer/models';
import { generateFeedbackViaGemini } from '../../../../src/lib/ai/gemini';
import { analysisRateLimiter, InputValidator, addSecurityHeaders, logSecurityEvent } from '../../../../src/lib/security';
import { z } from 'zod';

// Initialize model factory
const modelFactory = new ModelFactory();

// Request validation schemas
const UploadRequestSchema = z.object({
  file: z.any(), // File will be validated in the handler
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

// Upload endpoint handler
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check - temporarily disabled for testing
    // const rateLimitResponse = analysisRateLimiter.isAllowed(request) ? null : 
    //   NextResponse.json(
    //     { error: 'Rate limit exceeded', retryAfter: 900 },
    //     { status: 429, headers: { 'Retry-After': '900' } }
    //   );
    
    // if (rateLimitResponse) {
    //   logSecurityEvent('RATE_LIMIT_EXCEEDED', request);
    //   return addSecurityHeaders(rateLimitResponse);
    // }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      logSecurityEvent('MISSING_FILE', request);
      return addSecurityHeaders(createErrorResponse('MISSING_FILE', 'File is required'));
    }
    
    // Security validation
    if (!InputValidator.validateFileName(file.name)) {
      logSecurityEvent('INVALID_FILENAME', request, { fileName: file.name });
      return addSecurityHeaders(createErrorResponse('INVALID_FILENAME', 'Invalid file name'));
    }
    
    if (!InputValidator.validateFileType(file.type) && file.type !== 'text/plain') {
      logSecurityEvent('INVALID_FILE_TYPE', request, { fileType: file.type });
      return addSecurityHeaders(createErrorResponse('INVALID_FILE_TYPE', 'Unsupported file type. Please upload PDF, DOC, or DOCX.'));
    }
    
    if (!InputValidator.validateFileSize(file.size)) {
      logSecurityEvent('FILE_TOO_LARGE', request, { fileSize: file.size });
      return addSecurityHeaders(createErrorResponse('FILE_TOO_LARGE', 'File size cannot exceed 10MB'));
    }
    
    // Create upload record
    const uploadModel = modelFactory.getResumeUploadModel();
    const upload = await uploadModel.create({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type as 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    // Generate feedback via Gemini
    const feedbackModel = modelFactory.getFeedbackModel();
    let ai: any = null;
    try {
      // Extract text content based on file type
      let fileContent: string;
   
      
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file:', file.name, 'Size:', file.size);
        const buffer = await file.arrayBuffer();
        console.log('PDF buffer size:', buffer.byteLength);
        
        try {
          // Use pdf-parse for more robust PDF parsing
          const pdfParse = await import('pdf-parse');
          const pdfData = await pdfParse.default(Buffer.from(buffer));
          
          console.log('PDF parsed successfully with pdf-parse');
          console.log('Pages:', pdfData.numpages);
          console.log('Extracted text length:', pdfData.text.length);
          console.log('First 200 chars:', pdfData.text.substring(0, 200));
          
          fileContent = pdfData.text;
          
          if (!fileContent.trim()) {
            throw new Error('This PDF format is not supported by our text extraction engine. Please try converting your PDF to a different format or use a PDF created with standard tools like Microsoft Word, Google Docs, or Adobe Acrobat.');
          }
        } catch (pdfError) {
          console.error('PDF parsing failed:', pdfError);
          
          // Provide specific error messages based on the error type
          if (pdfError instanceof Error) {
            if (pdfError.message.includes('not supported by our text extraction engine')) {
              throw new Error('This PDF format is not supported by our text extraction engine. Please try converting your PDF to a different format or use a PDF created with standard tools like Microsoft Word, Google Docs, or Adobe Acrobat.');
            } else if (pdfError.message.includes('image-based') || pdfError.message.includes('no extractable text')) {
              throw new Error('PDF appears to be image-based or contains no selectable text. Please use a PDF with readable text or convert your scanned document to text using OCR tools.');
            } else if (pdfError.message.includes('corrupted') || pdfError.message.includes('invalid')) {
              throw new Error('PDF file appears to be corrupted or invalid. Please try with a different PDF file.');
            }
          }
          
          throw new Error('Failed to parse PDF file. Please ensure the file contains readable text and is not corrupted.');
        }
      } else {
        fileContent = await file.text();
      }
  
      // Run feedback generation
      console.log('Starting AI analysis...');
      const startTime = Date.now();
      
      ai = await generateFeedbackViaGemini(file.name, fileContent);
      
      const endTime = Date.now();
      console.log(`AI analysis completed in ${endTime - startTime}ms`);
      
      await feedbackModel.create({
        uploadId: upload.id,
        overallScore: ai.scores.overall,
        contentScore: ai.scores.content,
        formattingScore: ai.scores.formatting,
        keywordScore: ai.scores.keywords,
        suggestions: ai.suggestions,
        strengths: ai.strengths,
        improvements: ai.improvements,
        analysis: JSON.stringify(ai.sections),
      });
      await uploadModel.update(upload.id, { status: 'COMPLETED' });

    } catch (e) {
      console.error('Feedback generation or database operation failed:', e);
      // Set ai to null so we can handle it gracefully
      ai = null;
      
      // Update status to ERROR if something failed
      try {
        await uploadModel.update(upload.id, { status: 'ERROR' });
        console.log('Upload status updated to ERROR');
      } catch (updateError) {
        console.error('Failed to update upload status to ERROR:', updateError);
      }
    }
    
    if (!ai) {
      return createErrorResponse('OPENAI_FAILED', 'AI analysis failed. Please try again or check your internet connection.', 502);
    }
    
    const response = createSuccessResponse({
      uploadId: upload.id,
      status: 'completed',
      aiProvider: 'gemini',
      timestamp: upload.createdAt.toISOString(),
      fileInfo: {
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        fileType: upload.fileType,
      },
      feedback: {
        overallScore: ai.scores.overall,
        contentScore: ai.scores.content,
        formattingScore: ai.scores.formatting,
        keywordScore: ai.scores.keywords,
        suggestions: ai.suggestions,
        strengths: ai.strengths,
        improvements: ai.improvements,
        analysis: {
          sections: ai.sections
        },
        metadata: ai.metadata
      }
    });
    const finalResponse = addSecurityHeaders(response);
    return finalResponse;
    
  } catch (error) {
    console.error('Upload Error:', error);
    logSecurityEvent('UPLOAD_ERROR', request, { error: error instanceof Error ? error.message : 'Unknown error' });
    
    // Handle specific error types
    if (error instanceof Error) {
      // Gemini API overloaded (503)
      if (error.message.includes('overloaded') || error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
        return addSecurityHeaders(createErrorResponse(
          'SERVICE_UNAVAILABLE',
          'AI service is temporarily overloaded. Please try again in a few minutes.',
          503
        ));
      }
      
      // Rate limit error from Gemini
      if (error.message.includes('Yavaş. Çok abandınız!') || error.message.includes('rate limit') || error.message.includes('quota')) {
        return addSecurityHeaders(createErrorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Yavaş. Çok abandınız!',
          429
        ));
      }
      
      // Timeout error
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return addSecurityHeaders(createErrorResponse(
          'REQUEST_TIMEOUT',
          'Analysis is taking longer than expected. Please try again.',
          408
        ));
      }
    }
    
    return addSecurityHeaders(createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
}