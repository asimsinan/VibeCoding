import { NextRequest, NextResponse } from 'next/server';
import { quizService } from '@/services/quiz.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const UpdateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),
  explanation: z.string().optional(),
  order: z.number().min(1).optional(),
});

// GET /api/questions/[id] - Get question by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const question = await quizService.getQuestionById(id, authContext.user.id);
        return NextResponse.json(question);
      } catch (error: any) {
        console.error('Error fetching question:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch question' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/questions/[id] - Update question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        const validatedData = UpdateQuestionSchema.parse(body);

        const { id } = await params;
        const question = await quizService.updateQuestion(
          id,
          validatedData,
          authContext.user.id
        );

        return NextResponse.json(question);
      } catch (error: any) {
        console.error('Error updating question:', error);
        
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: error.message || 'Failed to update question' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/questions/[id] - Delete question
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const result = await quizService.deleteQuestion(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete question' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}
