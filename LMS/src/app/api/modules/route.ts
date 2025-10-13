import { NextRequest, NextResponse } from 'next/server';
import { moduleLessonService } from '@/services/module-lesson.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetModulesSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

// GET /api/modules - Get modules for a course
// TODO: Implement getModulesByCourseId method in ModuleLessonService
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetModulesSchema.parse(Object.fromEntries(searchParams));

      const { courseId } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      // For now, return empty array until getModulesByCourseId is implemented
      const modules: any[] = [];
      return NextResponse.json(modules);
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch modules' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/modules - Create module
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const organizationId = authContext.user.organizationId as string;
      const module = await moduleLessonService.createModule({ ...body, organizationId }, authContext.user.id);
      return NextResponse.json(module, { status: 201 });
    } catch (error: any) {
      console.error('Error creating module:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create module' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);