import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/instructor/courses - Get instructor's courses
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const instructorId = authContext.user.id;
      const organizationId = authContext.user.organizationId;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Only allow instructors and admins to access courses
      if (!['INSTRUCTOR', 'ADMIN'].includes(authContext.user.role)) {
        return NextResponse.json(
          { error: 'Access denied. Instructor or Admin role required.' },
          { status: 403 }
        );
      }

      // Get courses with enrollment counts
      const courses = await prisma.course.findMany({
        where: {
          organizationId: organizationId
          // TODO: Add instructorId filter when instructorId field is added to Course model
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

      const formattedCourses = courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        organizationId: course.organizationId,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        enrollmentsCount: course._count.enrollments,
        modulesCount: course._count.modules
      }));

      return NextResponse.json(formattedCourses);
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instructor courses' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);

/**
 * POST /api/instructor/courses - Create a new course
 */
export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const instructorId = authContext.user.id;
      const organizationId = authContext.user.organizationId;

      // Only allow instructors and admins to create courses
      if (!['INSTRUCTOR', 'ADMIN'].includes(authContext.user.role)) {
        return NextResponse.json(
          { error: 'Access denied. Instructor or Admin role required.' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { title, description, status = 'DRAFT' } = body;

      if (!title) {
        return NextResponse.json(
          { error: 'Course title is required' },
          { status: 400 }
        );
      }

      const course = await prisma.course.create({
        data: {
          title,
          description: description || '',
          status,
          organizationId
          // TODO: Add instructorId when field is added to Course model
        }
      });

      return NextResponse.json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);
