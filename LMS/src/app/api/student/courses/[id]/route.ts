import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/student/courses/[id] - Get course details for a student
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const courseId = pathname.split('/').pop();

      if (!courseId) {
        return NextResponse.json(
          { error: 'Course ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to access course details
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Check if student is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: 'ACTIVE'
        }
      });

      // Get course statistics
      const studentCount = await prisma.enrollment.count({
        where: {
          courseId: courseId,
          status: 'ACTIVE'
        }
      });

      const courseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        isEnrolled: !!enrollment,
        studentCount: studentCount,
        instructor: 'Unknown Instructor', // TODO: Get actual instructor name
        duration: 0, // TODO: Calculate course duration
        difficulty: 'BEGINNER' as const, // Default difficulty
        rating: 0, // TODO: Get actual rating
        price: 0 // TODO: Get actual price
      };

      return NextResponse.json(courseData);
    } catch (error) {
      console.error('Error fetching course details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course details' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
