import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole, CourseStatus } from '@/generated/prisma';
import { z } from 'zod';

const GetCoursesSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
  status: z.nativeEnum(CourseStatus).optional(),
});

// GET /api/courses - Get all courses in organization
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetCoursesSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize, status } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      const courses = await courseService.getCoursesByOrganization(organizationId, authContext.user.id, page, pageSize, status);
      return NextResponse.json(courses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch courses' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/courses - Create course
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const organizationId = authContext.user.organizationId as string;
      const course = await courseService.createCourse({ ...body, organizationId }, authContext.user.id);
      return NextResponse.json(course, { status: 201 });
    } catch (error: any) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create course' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);