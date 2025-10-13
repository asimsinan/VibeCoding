import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/courses/stats - Get course statistics
// TODO: Implement organization-wide course statistics
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      // For now, return empty stats until organization-wide stats are implemented
      const stats = {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        archivedCourses: 0,
        totalEnrollments: 0,
        averageProgress: 0,
      };
      return NextResponse.json(stats);
    } catch (error: any) {
      console.error('Error fetching course statistics:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch course statistics' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);