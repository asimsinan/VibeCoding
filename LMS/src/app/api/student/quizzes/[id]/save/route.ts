import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * POST /api/student/quizzes/[id]/save - Save quiz progress
 */
export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const quizId = pathname.split('/')[4]; // Extract quiz ID from path

      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to save quiz progress
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { answers, attemptId } = body;

      console.log('Save progress request:', { quizId, userId, attemptId, answers });

      if (!answers || !attemptId) {
        return NextResponse.json(
          { error: 'Answers and attempt ID are required' },
          { status: 400 }
        );
      }

      // Update the attempt with current answers (don't submit yet)
      const updatedAttempt = await prisma.quizAttempt.update({
        where: {
          id: attemptId,
          userId: userId,
          quizId: quizId
        },
        data: {
          answers: answers
        }
      });

      return NextResponse.json({
        id: updatedAttempt.id,
        message: 'Progress saved successfully'
      });
    } catch (error) {
      console.error('Error saving quiz progress:', error);
      return NextResponse.json(
        { error: 'Failed to save quiz progress' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
