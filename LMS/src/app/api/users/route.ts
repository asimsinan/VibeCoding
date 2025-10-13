import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetUsersSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/users - Get all users in organization
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetUsersSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      const users = await userService.getUsersByOrganization(organizationId, authContext.user.id, page, pageSize);
      return NextResponse.json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch users' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);

// POST /api/users - Create user
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const user = await userService.createUser(body, authContext.user.id);
      return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);