import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: userId } = await params;
      const organizationId = authContext.user.organizationId;

      console.log('Admin get user request:');
      console.log('User:', authContext.user);
      console.log('UserId:', userId);
      console.log('OrganizationId:', organizationId);

      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: organizationId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.log('User found:', user);

      return NextResponse.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: userId } = await params;
      const organizationId = authContext.user.organizationId;
      const body = await request.json();

      console.log('Admin update user request:');
      console.log('User:', authContext.user);
      console.log('UserId:', userId);
      console.log('OrganizationId:', organizationId);
      console.log('Update data:', body);

      // Check if user exists and belongs to the same organization
      const existingUser = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: organizationId
        }
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Update user - handle both firstName/lastName and name formats
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
          email: body.email,
          role: body.role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('User updated:', updatedUser);

      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: userId } = await params;
      const organizationId = authContext.user.organizationId;

      console.log('Admin delete user request:');
      console.log('User:', authContext.user);
      console.log('UserId:', userId);
      console.log('OrganizationId:', organizationId);

      // Check if user exists and belongs to the same organization
      const existingUser = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: organizationId
        }
      });

      if (!existingUser) {
        console.log('User not found:', userId);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.log('User found, deleting:', existingUser.email);

      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });

      console.log('User deleted successfully');

      return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  })(request);
}
