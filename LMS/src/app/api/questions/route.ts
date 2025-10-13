import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const CreateQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),
  explanation: z.string().optional(),
  order: z.number().min(1).optional(),
  quizId: z.string().min(1, 'Quiz ID is required'),
});

// GET /api/questions - Get all questions for a quiz
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const quizId = searchParams.get('quizId');

      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID is required' },
          { status: 400 }
        );
      }

      // Get quiz to verify access
      const quiz = await require('@/lib/database').default.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: { organizationId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (
        authContext.user.role !== UserRole.ADMIN &&
        authContext.user.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const questions = await require('@/lib/database').default.question.findMany({
        where: { quizId },
        orderBy: { order: 'asc' },
      });

      return NextResponse.json(questions);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/questions - Create a new question
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = CreateQuestionSchema.parse(body);

      const question = await quizService.createQuestion(
        {
          text: validatedData.text,
          type: validatedData.type,
          options: validatedData.options,
          correctAnswer: validatedData.correctAnswer,
          order: validatedData.order || 1,
          quiz: {
            connect: { id: validatedData.quizId },
          },
        },
        authContext.user.id
      );

      return NextResponse.json(question, { status: 201 });
    } catch (error: any) {
      console.error('Error creating question:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create question' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);
