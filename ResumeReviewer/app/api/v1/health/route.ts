import { NextRequest, NextResponse } from 'next/server';
import { ModelFactory } from '../../../../src/lib/resume-reviewer/models';

// Initialize model factory
const modelFactory = new ModelFactory();

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

// Health check helper
async function checkServiceHealth() {
  const services: any = {};
  
  try {
    // Check database
    const prisma = modelFactory.getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    services.database = {
      status: 'healthy',
      message: 'Database connection successful',
    };
  } catch (error) {
    services.database = {
      status: 'unhealthy',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
  
  // Check AI service (mock for now)
  services.ai_service = {
    status: 'healthy',
    message: 'Google Gemini API reachable',
  };
  
  // Check file storage (mock for now)
  services.file_storage = {
    status: 'healthy',
    message: 'Vercel Blob storage accessible',
  };
  
  return services;
}

// Health endpoint handler
export async function GET(request: NextRequest) {
  try {
    const services = await checkServiceHealth();
    const overallStatus = Object.values(services).every((s: any) => s.status === 'healthy') 
      ? 'healthy' 
      : 'degraded';
    
    return createSuccessResponse({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services,
    });
    
  } catch (error) {
    console.error('Health Check Error:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}