import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// JWT Secret - you'll need to set this in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Get user profile endpoint
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return user data
    return NextResponse.json(
      {
        success: true,
        ...user
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
