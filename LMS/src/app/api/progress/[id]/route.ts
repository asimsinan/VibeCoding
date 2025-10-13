import { NextRequest, NextResponse } from 'next/server';
import { progressService } from '@/services/progress.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/progress/[id] - Get progress by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const progress = await progressService.getProgressById(id, authContext.user.id);
        return NextResponse.json(progress);
      } catch (error: any) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch progress' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}