import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AnalyticsService } from '@/services/analytics.service';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService(prisma);

/**
 * GET /api/analytics/dashboard - Get dashboard analytics data
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';

      const dashboardData = await analyticsService.getDashboardData(
        user.organizationId,
        period
      );

      return NextResponse.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
);
