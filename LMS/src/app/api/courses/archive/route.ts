import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const ArchiveCourseSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
});

// POST /api/courses/archive - Archive course
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = ArchiveCourseSchema.parse(body);
      const organizationId = authContext.user.organizationId as string;
      const course = await courseService.archiveCourse(validatedData.id, organizationId);
      return NextResponse.json(course);
    } catch (error: any) {
      console.error('Error archiving course:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to archive course' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);