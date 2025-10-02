// Users API - Profile
// API routes for user profile operations

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Validation schema for profile update
const UpdateProfileSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long').optional(),
  email: z.string().email('Invalid email format').optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken: any;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: {
        profile: true,
        preferences: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('[API] Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken: any;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check if at least one field is provided
    if (!updateData.username && !updateData.email) {
      return NextResponse.json(
        { error: 'At least username or email is required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const prisma = new PrismaClient();
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: decodedToken.userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        );
      }
    }

    // Check if username is already taken by another user
    if (updateData.username) {
      const prisma = new PrismaClient();
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          id: { not: decodedToken.userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken by another user' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const prisma = new PrismaClient();
    const updatedUser = await prisma.user.update({
      where: { id: decodedToken.userId },
      data: {
        ...(updateData.username && { username: updateData.username }),
        ...(updateData.email && { email: updateData.email }),
      },
      include: {
        profile: true,
        preferences: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences
      }
    });

  } catch (error) {
    console.error('[API] Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}