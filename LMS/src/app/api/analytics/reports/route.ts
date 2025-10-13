import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AnalyticsService } from '@/services/analytics.service';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService(prisma);

/**
 * POST /api/analytics/reports - Generate custom report
 */
export const POST = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { reportType, filters = {}, period = '30d' } = body;

      if (!reportType) {
        return NextResponse.json(
          { error: 'Report type is required' },
          { status: 400 }
        );
      }

      const report = await analyticsService.generateReport(
        user.organizationId,
        reportType,
        filters,
        period
      );

      return NextResponse.json(report);
    } catch (error) {
      console.error('Error generating report:', error);
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
);
