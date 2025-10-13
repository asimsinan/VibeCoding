import { NextRequest, NextResponse } from 'next/server';
import { progressService } from '@/services/progress.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const RecordCompletionSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

const GetProgressSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/progress - Get progress records
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const courseId = searchParams.get('courseId');
      const userId = searchParams.get('userId');
      const validatedParams = GetProgressSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;

      if (courseId && userId) {
        const progress = await progressService.getCourseProgress(
          courseId,
          userId,
          authContext.user.id
        );
        return NextResponse.json(progress);
      } else if (userId) {
        const progress = await progressService.getUserProgress(
          userId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(progress);
      } else {
        if (authContext.user.role === UserRole.STUDENT) {
          const progress = await progressService.getUserProgress(
            authContext.user.id,
            authContext.user.id,
            page,
            pageSize
          );
          return NextResponse.json(progress);
        } else {
          return NextResponse.json(
            { error: 'Course ID and User ID, or User ID is required' },
            { status: 400 }
          );
        }
      }
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch progress' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/progress - Record lesson completion
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = RecordCompletionSchema.parse(body);

      const progress = await progressService.recordLessonCompletion(
        validatedData.lessonId,
        validatedData.userId,
        authContext.user.id
      );

      return NextResponse.json(progress, { status: 201 });
    } catch (error: any) {
      console.error('Error recording lesson completion:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to record lesson completion' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);