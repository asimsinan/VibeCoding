import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth.service';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize auth service
const databaseService = DatabaseService.getInstance();
const authService = new AuthService(databaseService);

// POST /api/auth/refresh - Refresh access token
export async function POST(_request: NextRequest) {
  try {
    await authService.initialize();

    const body = await _request.json();
    const { refreshToken } = body;

    // Validate required fields
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Refresh token is required'
        },
        { status: 400 }
      );
    }

    // Refresh token
    const tokens = await authService.refreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Invalid token type') || 
          error.message.includes('Token verification failed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid token',
            message: 'The refresh token is invalid or expired'
          },
          { status: 401 }
        );
      }

      if (error.message.includes('User not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found',
            message: 'The user associated with this token no longer exists'
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
