import { NextRequest, NextResponse } from 'next/server';
import { moduleLessonService } from '@/services/module-lesson.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/modules/[id] - Get module by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const organizationId = authContext.user.organizationId as string;
        const { id } = await params;
        const module = await moduleLessonService.getModuleById(id, organizationId);
        return NextResponse.json(module);
      } catch (error: any) {
        console.error('Error fetching module:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch module' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/modules/[id] - Update module
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        const organizationId = authContext.user.organizationId as string;
        const { id } = await params;
        const module = await moduleLessonService.updateModule(id, body, authContext.user.id);
        return NextResponse.json(module);
      } catch (error: any) {
        console.error('Error updating module:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update module' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/modules/[id] - Delete module
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const organizationId = authContext.user.organizationId as string;
        const { id } = await params;
        const result = await moduleLessonService.deleteModule(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting module:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete module' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}