import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/quizzes/[id] - Get quiz by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const quiz = await quizService.getQuizById(id, authContext.user.id);
        return NextResponse.json(quiz);
      } catch (error: any) {
        console.error('Error fetching quiz:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch quiz' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/quizzes/[id] - Update quiz
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        const { id } = await params;
        const quiz = await quizService.updateQuiz(id, body, authContext.user.id);
        return NextResponse.json(quiz);
      } catch (error: any) {
        console.error('Error updating quiz:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update quiz' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/quizzes/[id] - Delete quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const result = await quizService.deleteQuiz(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting quiz:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete quiz' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}