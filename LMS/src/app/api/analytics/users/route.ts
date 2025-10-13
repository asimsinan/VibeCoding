import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AnalyticsService } from '@/services/analytics.service';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService(prisma);

/**
 * GET /api/analytics/users - Get user analytics
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';

      const userAnalytics = await analyticsService.getUserAnalytics(
        user.organizationId,
        period
      );

      return NextResponse.json(userAnalytics);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
);
