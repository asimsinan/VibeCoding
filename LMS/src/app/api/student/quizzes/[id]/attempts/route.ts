import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/student/quizzes/[id]/attempts - Get quiz attempts for a student
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const pathParts = pathname.split('/');
      const quizId = pathParts[pathParts.length - 2]; // quiz ID is 2nd from end

      console.log('Fetching quiz attempts:', { userId, quizId, pathname, pathParts });

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

      // Get quiz attempts for this student and quiz
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: userId,
          quizId: quizId
        },
        orderBy: {
          id: 'desc' // Most recent first (using ID since it's auto-incrementing)
        },
        select: {
          id: true,
          quizId: true,
          userId: true,
          score: true,
          submittedAt: true
        }
      });

      return NextResponse.json(attempts);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz attempts' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
