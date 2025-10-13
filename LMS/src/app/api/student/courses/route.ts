import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/student/courses - Get student's enrolled courses
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      console.log('Student courses request:');
      console.log('User:', authContext.user);
      console.log('UserId:', userId);

      // Only allow students to access their own courses
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get enrolled courses with course details
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: userId,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        take: limit
      });

      console.log('Enrollments query result:', enrollments.length, 'enrollments found');

      const courses = enrollments.map(enrollment => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        status: enrollment.course.status,
        createdAt: enrollment.course.createdAt.toISOString(),
        updatedAt: enrollment.course.updatedAt.toISOString(),
        enrolledAt: enrollment.enrolledAt.toISOString(),
        enrollmentDate: enrollment.enrolledAt.toISOString(), // Add enrollmentDate for compatibility
        lastAccessed: enrollment.enrolledAt.toISOString(), // Use enrollment date as last accessed for now
        progress: 0, // TODO: Calculate actual progress
        instructor: 'Unknown Instructor', // TODO: Get actual instructor name
        studentCount: 0, // TODO: Get actual student count
        duration: 0, // TODO: Calculate course duration
        difficulty: 'BEGINNER' as const, // Default difficulty
        rating: 0, // TODO: Get actual rating
        price: 0 // TODO: Get actual price
      }));

      return NextResponse.json(courses);
    } catch (error) {
      console.error('Error fetching student courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student courses' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
