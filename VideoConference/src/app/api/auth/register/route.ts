import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth.service';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize auth service
const databaseService = DatabaseService.getInstance();
const authService = new AuthService(databaseService);

// POST /api/auth/register - Register a new user
export async function POST(_request: NextRequest) {
  try {
    await authService.initialize();

    const body = await _request.json();
    const { email, name, password } = body;

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Email, name, and password are required'
        },
        { status: 400 }
      );
    }

    // Register user
    const result = await authService.register({
      email,
      name,
      password
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isActive: result.user.isActive,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
          lastLogin: result.user.lastLogin
        },
        tokens: result.tokens
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already exists',
            message: 'An account with this email already exists'
          },
          { status: 409 }
        );
      }

      if (error.message.includes('Valid email is required')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Please provide a valid email address'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Password must be at least 8 characters')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Password must be at least 8 characters long'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
