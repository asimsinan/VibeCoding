import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const PublishCourseSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
});

// POST /api/courses/publish - Publish course
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = PublishCourseSchema.parse(body);
      const organizationId = authContext.user.organizationId as string;
      const course = await courseService.publishCourse(validatedData.id, organizationId);
      return NextResponse.json(course);
    } catch (error: any) {
      console.error('Error publishing course:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to publish course' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);