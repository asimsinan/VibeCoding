import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetQuizzesSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
});

// GET /api/quizzes - Get quiz for a lesson
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetQuizzesSchema.parse(Object.fromEntries(searchParams));

      const { lessonId } = validatedParams;
      const organizationId = authContext.user.organizationId as string;

      // Get lesson to verify access
      const lesson = await require('@/lib/database').default.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                select: { organizationId: true },
              },
            },
          },
        },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (
        authContext.user.role !== UserRole.ADMIN &&
        authContext.user.organizationId !== lesson.module.course.organizationId
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const quiz = await require('@/lib/database').default.quiz.findUnique({
        where: { lessonId },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });

      return NextResponse.json(quiz);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch quiz' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/quizzes - Create quiz
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const quiz = await quizService.createQuiz(body, authContext.user.id);
      return NextResponse.json(quiz, { status: 201 });
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create quiz' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);