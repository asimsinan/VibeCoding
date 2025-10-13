import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { AuditLoggingService } from '@/services/audit-logging.service';
import { DataValidationService } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const auditService = new AuditLoggingService(prisma);

/**
 * GET /api/audit-logs/stats - Get audit log statistics
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

      const stats = await auditService.getAuditLogStatistics(
        user.organizationId,
        startDate,
        endDate
      );

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching audit log statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit log statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);

/**
 * DELETE /api/audit-logs/stats - Clean up old audit logs
 */
export const DELETE = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const olderThanDays = parseInt(searchParams.get('olderThanDays') || '365');

      const deletedCount = await auditService.cleanupOldLogs(
        user.organizationId,
        olderThanDays
      );

      return NextResponse.json({
        message: `Cleaned up ${deletedCount} old audit logs`,
        deletedCount,
      });
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to clean up audit logs' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);
