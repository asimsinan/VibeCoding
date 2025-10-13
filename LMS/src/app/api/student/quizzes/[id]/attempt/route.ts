import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/student/quizzes/[id]/attempt - Get current attempt for a quiz
 * POST /api/student/quizzes/[id]/attempt - Create new attempt for a quiz
 */
export const GET = withAuth(
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

      // Only allow students to access quiz attempts
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get the most recent incomplete attempt (where score is null AND submittedAt is null)
      console.log('GET attempt - searching for active attempt:', { quizId, userId });
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quizId,
          userId: userId,
          score: null,
          submittedAt: null
        },
        orderBy: {
          id: 'desc'
        }
      });

      console.log('GET attempt query result:', attempt);

      if (!attempt) {
        console.log('No active attempt found, returning 404');
        return NextResponse.json(
          { error: 'No active attempt found' },
          { status: 404 }
        );
      }

      const attemptData = {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        answers: attempt.answers as any[],
        submittedAt: attempt.submittedAt?.toISOString()
      };

      return NextResponse.json(attemptData);
    } catch (error) {
      console.error('Error fetching quiz attempt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz attempt' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);

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

      // Only allow students to create quiz attempts
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Check if student is enrolled in the course containing this quiz
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                enrollments: {
                  some: {
                    userId: userId,
                    status: 'ACTIVE'
                  }
                }
              }
            }
          }
        }
      });

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        );
      }

      // Create new attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quizId,
          userId: userId,
          answers: {},
          score: null,
          submittedAt: undefined
        }
      });

      const attemptData = {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        answers: attempt.answers as any[],
        submittedAt: attempt.submittedAt?.toISOString() || null
      };

      return NextResponse.json(attemptData);
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      return NextResponse.json(
        { error: 'Failed to create quiz attempt' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
