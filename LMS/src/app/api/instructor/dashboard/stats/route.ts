import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/instructor/dashboard/stats - Get instructor dashboard statistics
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      console.log('Instructor dashboard stats API called');
      console.log('Auth context:', authContext);
      
      const instructorId = authContext.user.id;
      const organizationId = authContext.user.organizationId;

      console.log('Instructor ID:', instructorId);
      console.log('Organization ID:', organizationId);

      // Only allow instructors and admins to access instructor stats
      if (!['INSTRUCTOR', 'ADMIN'].includes(authContext.user.role)) {
        console.log('Access denied - invalid role:', authContext.user.role);
        return NextResponse.json(
          { error: 'Access denied. Instructor or Admin role required.' },
          { status: 403 }
        );
      }

      // Get total courses created by instructor
      const totalCourses = await prisma.course.count({
        where: {
          organizationId: organizationId
          // TODO: Add instructorId field to Course model when available
        }
      });

      // Get total students enrolled in instructor's courses
      const totalStudents = await prisma.enrollment.count({
        where: {
          organizationId: organizationId,
          course: {
            // TODO: Add instructorId filter when available
          }
        }
      });

      // Get total quizzes created by instructor
      const totalQuizzes = await prisma.quiz.count({
        where: {
          lesson: {
            module: {
              course: {
                organizationId: organizationId
                // TODO: Add instructorId filter when available
              }
            }
          }
        }
      });

      // Calculate average rating (placeholder - would need rating system)
      const averageRating = 4.5; // TODO: Implement actual rating calculation

      const stats = {
        totalCourses,
        totalStudents,
        totalQuizzes,
        averageRating
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching instructor dashboard stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instructor dashboard statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);