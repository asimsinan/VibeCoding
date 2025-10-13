import { NextRequest, NextResponse } from 'next/server';
import { organizationService } from '@/services/organization.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/organizations/stats - Get organization statistics
// TODO: Implement getOrganizationStats method in OrganizationService
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      // For now, return empty stats until getOrganizationStats is implemented
      const stats = {
        totalOrganizations: 0,
        activeOrganizations: 0,
        totalUsers: 0,
        totalCourses: 0,
      };
      return NextResponse.json(stats);
    } catch (error: any) {
      console.error('Error fetching organization statistics:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch organization statistics' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);