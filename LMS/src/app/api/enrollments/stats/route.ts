import { NextRequest, NextResponse } from 'next/server';
import { enrollmentService } from '@/services/enrollment.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/enrollments/stats - Get enrollment statistics
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const organizationId = searchParams.get('organizationId');

      const stats = await enrollmentService.getEnrollmentStats(
        organizationId || undefined,
        authContext.user.id
      );

      return NextResponse.json(stats);
    } catch (error: any) {
      console.error('Error fetching enrollment statistics:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch enrollment statistics' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);