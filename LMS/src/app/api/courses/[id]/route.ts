import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/courses/[id] - Get course by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const organizationId = authContext.user.organizationId;
        const course = await courseService.getCourseById(id, organizationId);
        return NextResponse.json(course);
      } catch (error: any) {
        console.error('Error fetching course:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch course' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const body = await req.json();
        const organizationId = authContext.user.organizationId;
        const course = await courseService.updateCourse(id, body, authContext.user.id);
        return NextResponse.json(course);
      } catch (error: any) {
        console.error('Error updating course:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update course' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const organizationId = authContext.user.organizationId;
        const result = await courseService.deleteCourse(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting course:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete course' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN] }
  )(req);
}