import { NextRequest, NextResponse } from 'next/server';
import { moduleLessonService } from '@/services/module-lesson.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/lessons/[id] - Get lesson by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const organizationId = authContext.user.organizationId as string;
        const lesson = await moduleLessonService.getLessonById(id, organizationId);
        return NextResponse.json(lesson);
      } catch (error: any) {
        console.error('Error fetching lesson:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch lesson' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/lessons/[id] - Update lesson
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const body = await req.json();
        const organizationId = authContext.user.organizationId as string;
        const lesson = await moduleLessonService.updateLesson(id, body, authContext.user.id);
        return NextResponse.json(lesson);
      } catch (error: any) {
        console.error('Error updating lesson:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update lesson' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/lessons/[id] - Delete lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const organizationId = authContext.user.organizationId as string;
        const result = await moduleLessonService.deleteLesson(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete lesson' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}