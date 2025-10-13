import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/users/[id] - Get user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const user = await userService.getUserById(id, authContext.user.id);
        
        // Ensure user belongs to the same organization or is an admin
        if (authContext.user.role !== UserRole.ADMIN && user.organizationId !== authContext.user.organizationId) {
          return NextResponse.json(
            { error: 'Access denied to user from another organization' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(user);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch user' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        
        // Allow user to update their own profile, or admin to update any user
        const { id } = await params;
        if (authContext.user.id !== id && authContext.user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { error: 'Access denied to update other users' },
            { status: 403 }
          );
        }
        
        const user = await userService.updateUser(id, body, authContext.user.id);
        return NextResponse.json(user);
      } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update user' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const userToDelete = await userService.getUserById(id, authContext.user.id);
        if (userToDelete.organizationId !== authContext.user.organizationId) {
          return NextResponse.json(
            { error: 'Cannot delete user from another organization' },
            { status: 403 }
          );
        }
        
        const result = await userService.deleteUser(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete user' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN] }
  )(req);
}