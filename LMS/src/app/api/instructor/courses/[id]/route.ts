import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/instructor/courses/[id] - Get a specific course
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/');
      const courseId = pathSegments[pathSegments.length - 1];
      console.log('API Route: Fetching course', courseId, 'for user', authContext.user.id);

      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          enrollments: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          modules: {
            include: {
              lessons: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        console.log('API Route: Course not found', courseId);
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      console.log('API Route: Course found', course.title);

      // Transform the data to match the expected format
      const transformedCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        organizationId: course.organizationId,
        organizationName: course.organization?.name || 'Unknown Organization',
        studentCount: course.enrollments.length,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        modules: course.modules.map(module => ({
          id: module.id,
          title: module.title,
          order: module.order,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
          })),
        })),
        enrollments: course.enrollments.map(enrollment => ({
          id: enrollment.id,
          student: enrollment.user,
        })),
      };

      return NextResponse.json(transformedCourse);
    } catch (error) {
      console.error('API Route: Error fetching course:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);

// PUT /api/instructor/courses/[id] - Update a course
export const PUT = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/');
      const courseId = pathSegments[pathSegments.length - 1];
      const body = await request.json();

      // Verify the course belongs to the instructor's organization
      const existingCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId,
        },
      });

      if (!existingCourse) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Update the course with only the fields that exist in the schema
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          title: body.title,
          description: body.description,
          status: body.status,
          updatedAt: new Date(),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Transform the response
      const transformedCourse = {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        status: updatedCourse.status,
        organizationId: updatedCourse.organizationId,
        organizationName: updatedCourse.organization?.name || 'Unknown Organization',
        createdAt: updatedCourse.createdAt.toISOString(),
        updatedAt: updatedCourse.updatedAt.toISOString(),
      };

      return NextResponse.json(transformedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);

// DELETE /api/instructor/courses/[id] - Delete a course
export const DELETE = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/');
      const courseId = pathSegments[pathSegments.length - 1];
      console.log('API Route: Deleting course', courseId, 'for user', authContext.user.id);

      // Verify the course belongs to the instructor's organization
      const existingCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId,
        },
        include: {
          modules: {
            include: {
              lessons: true
            }
          },
          enrollments: true
        }
      });

      if (!existingCourse) {
        console.log('API Route: Course not found for deletion', courseId);
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      console.log('API Route: Course found for deletion:', {
        id: existingCourse.id,
        title: existingCourse.title,
        modulesCount: existingCourse.modules.length,
        enrollmentsCount: existingCourse.enrollments.length
      });

      // Delete the course (this will cascade delete related records)
      await prisma.course.delete({
        where: { id: courseId },
      });

      console.log('API Route: Course deleted successfully', courseId);
      return NextResponse.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error('API Route: Error deleting course:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete course', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);
