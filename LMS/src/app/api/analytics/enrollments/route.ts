import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AnalyticsService } from '@/services/analytics.service';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService(prisma);

/**
 * GET /api/analytics/enrollments - Get enrollment analytics
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';

      const enrollmentAnalytics = await analyticsService.getEnrollmentAnalytics(
        user.organizationId,
        period
      );

      return NextResponse.json(enrollmentAnalytics);
    } catch (error) {
      console.error('Error fetching enrollment analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollment analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
);
