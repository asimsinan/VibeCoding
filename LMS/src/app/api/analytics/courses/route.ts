import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AnalyticsService } from '@/services/analytics.service';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService(prisma);

/**
 * GET /api/analytics/courses - Get course analytics
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';

      const courseAnalytics = await analyticsService.getCourseAnalytics(
        user.organizationId,
        period
      );

      return NextResponse.json(courseAnalytics);
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
);
