import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const ReorderQuestionsSchema = z.object({
  questionOrders: z.array(z.string()).min(1, 'Question orders are required'),
});

// POST /api/questions/reorder - Reorder questions
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const { quizId, questionOrders } = body;

      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID is required' },
          { status: 400 }
        );
      }

      const validatedData = ReorderQuestionsSchema.parse({ questionOrders });

      const result = await quizService.reorderQuestions(
        quizId,
        validatedData.questionOrders,
        authContext.user.id
      );

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error reordering questions:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to reorder questions' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);