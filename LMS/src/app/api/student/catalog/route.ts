import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/student/catalog - Get available courses for students to browse and enroll
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const organizationId = authContext.user.organizationId;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');

      // Only allow students to access the catalog
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get published courses in the student's organization
      const courses = await prisma.course.findMany({
        where: {
          organizationId: organizationId,
          status: 'PUBLISHED'
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      // Get student's enrollments to check which courses they're already enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: userId,
          organizationId: organizationId
        },
        select: {
          courseId: true,
          status: true
        }
      });

      // Create a map of enrolled course IDs
      const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

      // Format courses for the catalog
      const catalogCourses = courses.map((course, index) => {
        // Generate varied data for testing sorting
        const difficulties: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
        const instructors = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'David Brown'];
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          instructor: instructors[index % instructors.length], // Vary instructor names
          studentCount: course._count.enrollments,
          status: course.status,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          thumbnail: null, // TODO: Add thumbnail field to Course model
          duration: course._count.modules * 30, // Estimate: 30 minutes per module
          difficulty: difficulties[index % difficulties.length], // Vary difficulty levels
          rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5 for testing
          price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 10, // Mix of free and paid courses
          isEnrolled: enrolledCourseIds.has(course.id)
        };
      });

      return NextResponse.json(catalogCourses);
    } catch (error) {
      console.error('Error fetching student catalog:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course catalog' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
