import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/login - Login user
export async function POST(_request: NextRequest) {
  try {
    
    // Import services dynamically
    const { AuthService } = await import('@/lib/auth/auth.service');
    const { DatabaseService } = await import('@/lib/video-conferencing/services/database.service');
    
    // Initialize services inside the function
    let databaseService;
    let authService;
    
    try {
      databaseService = DatabaseService.getInstance();
      
      authService = new AuthService(databaseService);
    } catch (initError) {
      console.error('Service initialization failed:', initError);
      throw initError;
    }
    
    try {
      await authService.initialize();
    } catch (initError) {
      console.error('Auth service initialization failed:', initError);
      throw initError;
    }

    const body = await _request.json();
    const { email, password } = body;

    // Debug logging (remove in production)

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    // Login user
    const result = await authService.login({
      email,
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
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication failed',
            message: 'Invalid email or password'
          },
          { status: 401 }
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
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
