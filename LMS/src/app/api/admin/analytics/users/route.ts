import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');

      // Get all users with their enrollment data
      const users = await prisma.user.findMany({
        include: {
          enrollments: {
            select: {
              id: true,
              completedAt: true,
              enrolledAt: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: limit
      }).catch(error => {
        console.error('Error fetching users:', error);
        return [];
      });

      // Transform user data with analytics
      const userAnalytics = users.map((user: any) => {
        const enrollments = user.enrollments || [];
        const coursesEnrolled = enrollments.length;
        const coursesCompleted = enrollments.filter(
          (enrollment: any) => enrollment.completedAt !== null
        ).length;

        // Find most recent activity
        const lastActivity = enrollments.length > 0
          ? Math.max(...enrollments.map((e: any) => new Date(e.enrolledAt).getTime()))
          : new Date(user.updatedAt).getTime();

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: user.role,
          coursesEnrolled,
          coursesCompleted,
          lastActivity: new Date(lastActivity).toISOString()
        };
      });

      return NextResponse.json(userAnalytics);
    } catch (error) {
      console.error('Error fetching admin user analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
