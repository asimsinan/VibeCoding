import { NextRequest, NextResponse } from 'next/server';
import { quizGradingService } from '@/services/quiz-grading.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const QuizSubmissionSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.union([z.string(), z.boolean(), z.array(z.string())]),
});

const SubmitQuizSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  submissions: z.array(QuizSubmissionSchema).min(1, 'At least one submission is required'),
});

const GetAttemptsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/quiz-attempts - Get quiz attempts
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const quizId = searchParams.get('quizId');
      const userId = searchParams.get('userId');
      const validatedParams = GetAttemptsSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;

      if (quizId) {
        const attempts = await quizGradingService.getQuizAttempts(
          quizId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(attempts);
      } else if (userId) {
        const attempts = await quizGradingService.getUserQuizAttempts(
          userId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(attempts);
      } else {
        if (authContext.user.role === UserRole.STUDENT) {
          const attempts = await quizGradingService.getUserQuizAttempts(
            authContext.user.id,
            authContext.user.id,
            page,
            pageSize
          );
          return NextResponse.json(attempts);
        } else {
          return NextResponse.json(
            { error: 'Quiz ID or User ID is required' },
            { status: 400 }
          );
        }
      }
    } catch (error: any) {
      console.error('Error fetching quiz attempts:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quiz attempts' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/quiz-attempts - Submit quiz attempt
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const validatedData = SubmitQuizSchema.parse(body);

      const result = await quizGradingService.submitQuizAttempt(
        validatedData.quizId,
        validatedData.userId,
        validatedData.submissions,
        authContext.user.id
      );

      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      console.error('Error submitting quiz attempt:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to submit quiz attempt' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);