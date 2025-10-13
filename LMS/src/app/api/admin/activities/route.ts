import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/admin/activities - Get admin activities feed
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      // Only allow admins to access activities
      if (authContext.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const organizationId = authContext.user.organizationId;

      // Get recent activities from various sources
      const activities: Array<{
        id: string;
        type: string;
        action: string;
        title: string;
        description: string;
        timestamp: string;
        user: {
          name: string;
          email: string;
        };
      }> = [];

      // Get recent user registrations
      const recentUsers = await prisma.user.findMany({
        where: {
          organizationId: organizationId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      });

      // Get recent course creations
      const recentCourses = await prisma.course.findMany({
        where: {
          organizationId: organizationId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      });

      // Get recent enrollments
      const recentEnrollments = await prisma.enrollment.findMany({
        where: {
          organizationId: organizationId
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          course: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      });

      // Format user registration activities
      recentUsers.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          action: 'registered',
          title: `New user registered: ${user.name}`,
          description: `${user.name} (${user.email}) joined the organization`,
          timestamp: user.createdAt.toISOString(),
          user: {
            name: user.name || 'Unknown',
            email: user.email
          }
        });
      });

      // Format course creation activities
      recentCourses.forEach(course => {
        activities.push({
          id: `course-${course.id}`,
          type: 'course',
          action: 'created',
          title: `New course created: ${course.title}`,
          description: `Course "${course.title}" was created`,
          timestamp: course.createdAt.toISOString(),
          user: {
            name: authContext.user.name || 'Admin',
            email: authContext.user.email
          }
        });
      });

      // Format enrollment activities
      recentEnrollments.forEach(enrollment => {
        activities.push({
          id: `enrollment-${enrollment.id}`,
          type: 'enrollment',
          action: 'enrolled',
          title: `User enrolled in course`,
          description: `${enrollment.user.name} enrolled in "${enrollment.course.title}"`,
          timestamp: enrollment.enrolledAt.toISOString(),
          user: {
            name: enrollment.user.name || 'Unknown',
            email: enrollment.user.email
          }
        });
      });

      // Sort activities by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const limitedActivities = activities.slice(0, limit);

      return NextResponse.json(limitedActivities);
    } catch (error) {
      console.error('Error fetching admin activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
