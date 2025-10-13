import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * POST /api/student/courses/[id]/enroll - Enroll student in a course
 * DELETE /api/student/courses/[id]/enroll - Unenroll student from a course
 */
export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const courseId = pathname.split('/')[4]; // Extract course ID from path

      console.log('Enrollment attempt:', { userId, courseId, organizationId: authContext.user.organizationId });

      if (!courseId) {
        console.log('Missing course ID');
        return NextResponse.json(
          { error: 'Course ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to enroll themselves
      if (authContext.user.role !== UserRole.STUDENT) {
        console.log('Invalid role:', authContext.user.role);
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Check if student is already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId
          }
        }
      });

      if (existingEnrollment) {
        console.log('Already enrolled:', existingEnrollment);
        return NextResponse.json(
          { error: 'You are already enrolled in this course' },
          { status: 400 }
        );
      }

      // Get the course to verify it exists and is published
      const course = await prisma.course.findUnique({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log('Course found:', course ? { id: course.id, title: course.title, status: course.status, organizationId: course.organizationId } : 'Not found');

      if (!course) {
        console.log('Course not found or organization mismatch');
        return NextResponse.json(
          { error: 'Course not found or access denied' },
          { status: 404 }
        );
      }

      if (course.status !== 'PUBLISHED') {
        console.log('Course not published:', course.status);
        return NextResponse.json(
          { error: 'Cannot enroll in unpublished course' },
          { status: 400 }
        );
      }

      // Create the enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: userId,
          courseId: courseId,
          organizationId: authContext.user.organizationId,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Enrollment created successfully:', enrollment.id);

      return NextResponse.json({
        id: enrollment.id,
        courseId: enrollment.courseId,
        userId: enrollment.userId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        course: enrollment.course,
        user: enrollment.user,
        message: 'Successfully enrolled in course'
      });
    } catch (error) {
      console.error('Error enrolling student in course:', error);
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);

export const DELETE = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const courseId = pathname.split('/')[4]; // Extract course ID from path

      if (!courseId) {
        return NextResponse.json(
          { error: 'Course ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to unenroll themselves
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Find the enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId
          }
        },
        include: {
          course: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 404 }
        );
      }

      // Delete the enrollment
      await prisma.enrollment.delete({
        where: {
          id: enrollment.id
        }
      });

      return NextResponse.json({
        message: 'Successfully unenrolled from course',
        courseId: courseId,
        courseTitle: enrollment.course.title
      });
    } catch (error) {
      console.error('Error unenrolling student from course:', error);
      return NextResponse.json(
        { error: 'Failed to unenroll from course' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
