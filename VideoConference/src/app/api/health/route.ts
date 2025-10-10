import { NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services using singleton pattern
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    // Initialize services if not already initialized
    await serviceFactory.initialize();
    
    const healthStatus = await serviceFactory.getHealthStatus();
    
    const status = healthStatus.overall ? 200 : 503;
    
    return NextResponse.json({
      success: healthStatus.overall,
      status: healthStatus.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: healthStatus.database ? 'healthy' : 'unhealthy',
          connected: healthStatus.database
        },
        repositories: {
          status: healthStatus.repositories ? 'healthy' : 'unhealthy',
          connected: healthStatus.repositories
        },
        webrtc: {
          status: healthStatus.webrtc ? 'healthy' : 'unhealthy',
          available: healthStatus.webrtc
        },
        websocket: {
          status: healthStatus.websocket ? 'healthy' : 'unhealthy',
          available: healthStatus.websocket
        }
      }
    }, { status });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
