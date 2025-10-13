import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/student/quiz-attempts - Get student's quiz attempts
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Only allow students to access their own quiz attempts
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get quiz attempts with quiz and course details
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: userId
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              lesson: {
                select: {
                  module: {
                    select: {
                      course: {
                        select: {
                          id: true,
                          title: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: limit
      });

      const attempts = quizAttempts.map(attempt => ({
        id: attempt.id,
        quizTitle: attempt.quiz.title,
        courseTitle: attempt.quiz.lesson.module.course.title,
        score: attempt.score,
        maxScore: 100, // TODO: Calculate actual max score from questions
        status: attempt.score >= 70 ? 'PASSED' : 'FAILED' as 'PASSED' | 'FAILED',
        attemptedAt: attempt.submittedAt.toISOString()
      }));

      return NextResponse.json(attempts);
    } catch (error) {
      console.error('Error fetching student quiz attempts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student quiz attempts' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
