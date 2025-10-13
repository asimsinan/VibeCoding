import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/users/stats - Get user statistics
// TODO: Implement organization-wide user statistics
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const organizationId = authContext.user.organizationId as string;
      // For now, return empty stats until organization-wide user stats are implemented
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        instructorUsers: 0,
        studentUsers: 0,
      };
      return NextResponse.json(stats);
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch user statistics' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);