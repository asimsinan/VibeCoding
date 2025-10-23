import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// JWT Secret - you'll need to set this in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

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

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
