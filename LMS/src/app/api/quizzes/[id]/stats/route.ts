import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/quizzes/[id]/stats - Get quiz statistics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const stats = await quizService.getQuizStats(id, authContext.user.id);
        return NextResponse.json(stats);
      } catch (error: any) {
        console.error('Error fetching quiz statistics:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch quiz statistics' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}