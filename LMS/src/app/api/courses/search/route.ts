import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const SearchCoursesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/courses/search - Search courses
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = SearchCoursesSchema.parse(Object.fromEntries(searchParams));

      const { query, page, pageSize } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      const courses = await courseService.searchCourses(query, organizationId, authContext.user.id, page, pageSize);
      return NextResponse.json(courses);
    } catch (error: any) {
      console.error('Error searching courses:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to search courses' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);