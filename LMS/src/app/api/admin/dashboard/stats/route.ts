import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/admin/dashboard/stats - Get admin dashboard statistics
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      // Only allow admins to access dashboard stats
      if (authContext.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        );
      }

      const organizationId = authContext.user.organizationId;

      console.log('Admin dashboard stats request:');
      console.log('User:', authContext.user);
      console.log('OrganizationId:', organizationId);

      // Get total users count
      const totalUsers = await prisma.user.count({
        where: {
          organizationId: organizationId
        }
      });

      console.log('Total users query result:', totalUsers);

      // Get total courses count
      const totalCourses = await prisma.course.count({
        where: {
          organizationId: organizationId
        }
      });

      console.log('Total courses query result:', totalCourses);

      // Get total enrollments count
      const totalEnrollments = await prisma.enrollment.count({
        where: {
          organizationId: organizationId
        }
      });

      console.log('Total enrollments query result:', totalEnrollments);

      // Get active users (users who have logged in within the last 30 days)
      // For now, we'll count all users as active since we don't have lastLogin tracking
      const activeUsers = totalUsers;

      const stats = {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admin dashboard statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
