import { NextRequest, NextResponse } from 'next/server';
import { enrollmentService } from '@/services/enrollment.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const EnrollStudentSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

const GetEnrollmentsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/enrollments - Get enrollments
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const courseId = searchParams.get('courseId');
      const studentId = searchParams.get('studentId');
      const validatedParams = GetEnrollmentsSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;

      if (courseId) {
        const enrollments = await enrollmentService.getCourseEnrollments(
          courseId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(enrollments);
      } else if (studentId) {
        const enrollments = await enrollmentService.getStudentEnrollments(
          studentId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(enrollments);
      } else {
        if (authContext.user.role === UserRole.STUDENT) {
          const enrollments = await enrollmentService.getStudentEnrollments(
            authContext.user.id,
            authContext.user.id,
            page,
            pageSize
          );
          return NextResponse.json(enrollments);
        } else {
          return NextResponse.json(
            { error: 'Course ID or Student ID is required' },
            { status: 400 }
          );
        }
      }
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch enrollments' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/enrollments - Enroll student
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = EnrollStudentSchema.parse(body);

      const enrollment = await enrollmentService.enrollStudent(
        validatedData.courseId,
        validatedData.studentId,
        authContext.user.id
      );

      return NextResponse.json(enrollment, { status: 201 });
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to enroll student' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);