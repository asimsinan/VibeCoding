import { NextRequest, NextResponse } from 'next/server';
import { quizGradingService } from '@/services/quiz-grading.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/quiz-attempts/[id] - Get quiz attempt by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const attempt = await quizGradingService.getQuizAttemptById(id, authContext.user.id);
        return NextResponse.json(attempt);
      } catch (error: any) {
        console.error('Error fetching quiz attempt:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch quiz attempt' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}