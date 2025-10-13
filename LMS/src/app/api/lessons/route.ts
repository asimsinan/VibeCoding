import { NextRequest, NextResponse } from 'next/server';
import { moduleLessonService } from '@/services/module-lesson.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetLessonsSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
});

// GET /api/lessons - Get lessons for a module
// TODO: Implement getLessonsByModuleId method in ModuleLessonService
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetLessonsSchema.parse(Object.fromEntries(searchParams));

      const { moduleId } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      // For now, return empty array until getLessonsByModuleId is implemented
      const lessons: any[] = [];
      return NextResponse.json(lessons);
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch lessons' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/lessons - Create lesson
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const organizationId = authContext.user.organizationId as string;
      const lesson = await moduleLessonService.createLesson({ ...body, organizationId }, authContext.user.id);
      return NextResponse.json(lesson, { status: 201 });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create lesson' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);