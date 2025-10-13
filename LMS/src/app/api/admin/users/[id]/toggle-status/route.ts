import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: userId } = await params;
      const organizationId = authContext.user.organizationId;



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


      // Return user data (toggle status not supported in current schema)
      const userData = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        organizationId: existingUser.organizationId,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt
      };

 

      return NextResponse.json(userData);
    } catch (error) {
      console.error('Error toggling user status:', error);
      return NextResponse.json(
        { error: 'Failed to toggle user status' },
        { status: 500 }
      );
    }
  })(request);
}
