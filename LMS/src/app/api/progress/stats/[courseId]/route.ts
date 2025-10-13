import { NextRequest, NextResponse } from 'next/server';
import { progressService } from '@/services/progress.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const ResetProgressSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// GET /api/progress/stats/[courseId] - Get course progress statistics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { courseId } = await params;
        const stats = await progressService.getCourseProgressStats(courseId, authContext.user.id);
        return NextResponse.json(stats);
      } catch (error: any) {
        console.error('Error fetching course progress statistics:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch course progress statistics' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// POST /api/progress/stats/[courseId]/reset - Reset lesson progress
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        const validatedData = ResetProgressSchema.parse(body);

        const result = await progressService.resetLessonProgress(
          validatedData.lessonId,
          validatedData.userId,
          authContext.user.id
        );

        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error resetting lesson progress:', error);
        
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: error.message || 'Failed to reset lesson progress' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}