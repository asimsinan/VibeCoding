import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AuditLoggingService } from '@/services/audit-logging.service';
import { DataValidationService } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const auditService = new AuditLoggingService(prisma);

/**
 * GET /api/audit-logs - Get audit logs for the organization
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const action = searchParams.get('action') as any;
      const resource = searchParams.get('resource') as any;
      const userId = searchParams.get('userId');
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

      // Validate pagination parameters
      const { page: validPage, pageSize: validPageSize } = DataValidationService.validatePagination(page, pageSize);

      const filters = {
        action,
        resource,
        userId: userId || undefined,
        startDate,
        endDate,
      };

      const result = await auditService.getOrganizationAuditLogs(
        user.organizationId,
        validPage,
        validPageSize,
        filters
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);

/**
 * POST /api/audit-logs/export - Export audit logs to CSV
 */
export const POST = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { startDate, endDate } = body;

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const csvContent = await auditService.exportAuditLogs(
        user.organizationId,
        start,
        end
      );

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${user.organizationId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to export audit logs' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);
