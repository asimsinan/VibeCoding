import { NextRequest, NextResponse } from 'next/server';
import { fileUploadService } from '@/services/file-upload.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetFilesSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/files - Get files
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const courseId = searchParams.get('courseId');
      const lessonId = searchParams.get('lessonId');
      const validatedParams = GetFilesSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;

      if (courseId) {
        const files = await fileUploadService.getCourseFiles(
          courseId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(files);
      } else if (lessonId) {
        const files = await fileUploadService.getLessonFiles(
          lessonId,
          authContext.user.id,
          page,
          pageSize
        );
        return NextResponse.json(files);
      } else {
        return NextResponse.json(
          { error: 'Course ID or Lesson ID is required' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Error fetching files:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch files' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
);

// POST /api/files - Upload file
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const organizationId = formData.get('organizationId') as string;
      const courseId = formData.get('courseId') as string;
      const lessonId = formData.get('lessonId') as string;
      const description = formData.get('description') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      // Convert File to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await fileUploadService.uploadFile(
        {
          buffer,
          originalname: file.name,
          mimetype: file.type,
          size: file.size,
        },
        authContext.user.id,
        organizationId,
        {
          courseId: courseId || undefined,
          lessonId: lessonId || undefined,
          description: description || undefined,
        }
      );

      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to upload file' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);