import { NextRequest, NextResponse } from 'next/server';
import { fileUploadService } from '@/services/file-upload.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/files/stats/[organizationId] - Get file statistics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { organizationId } = await params;
        const stats = await fileUploadService.getFileStats(organizationId, authContext.user.id);
        return NextResponse.json(stats);
      } catch (error: any) {
        console.error('Error fetching file statistics:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch file statistics' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}