import { NextRequest, NextResponse } from 'next/server';
import { fileUploadService } from '@/services/file-upload.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/files/[id] - Get file by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const file = await fileUploadService.getFileById(id, authContext.user.id);
        return NextResponse.json(file);
      } catch (error: any) {
        console.error('Error fetching file:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch file' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// DELETE /api/files/[id] - Delete file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const result = await fileUploadService.deleteFile(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete file' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}