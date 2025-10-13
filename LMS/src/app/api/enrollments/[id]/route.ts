import { NextRequest, NextResponse } from 'next/server';
import { enrollmentService } from '@/services/enrollment.service';
import { withAuth } from '@/lib/middleware';
import { UserRole, EnrollmentStatus } from '@/generated/prisma';
import { z } from 'zod';

const UpdateEnrollmentStatusSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus),
});

// GET /api/enrollments/[id] - Get enrollment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const enrollment = await enrollmentService.getEnrollmentById(id, authContext.user.id);
        return NextResponse.json(enrollment);
      } catch (error: any) {
        console.error('Error fetching enrollment:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch enrollment' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/enrollments/[id] - Update enrollment status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const body = await req.json();
        const validatedData = UpdateEnrollmentStatusSchema.parse(body);

        const enrollment = await enrollmentService.updateEnrollmentStatus(
          id,
          validatedData.status,
          authContext.user.id
        );

        return NextResponse.json(enrollment);
      } catch (error: any) {
        console.error('Error updating enrollment:', error);
        
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: error.message || 'Failed to update enrollment' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
  )(req);
}

// DELETE /api/enrollments/[id] - Cancel enrollment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const result = await enrollmentService.cancelEnrollment(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error cancelling enrollment:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to cancel enrollment' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}