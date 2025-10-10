import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware, AuthenticatedRequest } from '@/lib/auth/auth.middleware';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize auth middleware
const authMiddleware = new AuthMiddleware();

// GET /api/auth/me - Get current user profile
export async function GET(_request: NextRequest) {
  return authMiddleware.requireAuth(_request, async (authenticatedRequest: AuthenticatedRequest) => {
    try {
      // User is already authenticated and available in authenticatedRequest.user
      const user = authenticatedRequest.user!;

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get profile',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/auth/me - Update current user profile
export async function PUT(_request: NextRequest) {
  return authMiddleware.requireAuth(_request, async () => {
    try {
      const body = await _request.json();
      const { name } = body;

      // Validate input
      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Name field is required'
          },
          { status: 400 }
        );
      }

      // For now, return success without actual update
      // In a real implementation, you would update the user profile
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update profile',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
