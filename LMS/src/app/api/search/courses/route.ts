import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { SearchService } from '@/services/search.service';
import { DataValidationService } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const searchService = new SearchService(prisma);

/**
 * GET /api/search/courses - Search courses
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      const status = searchParams.get('status');
      const tags = searchParams.get('tags')?.split(',');
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const sortBy = searchParams.get('sortBy') as any || 'relevance';
      const sortOrder = searchParams.get('sortOrder') as any || 'desc';
      const includeHighlights = searchParams.get('includeHighlights') === 'true';

      // Validate pagination parameters
      const { page: validPage, pageSize: validPageSize } = DataValidationService.validatePagination(page, pageSize);

      const filters = {
        status: status || undefined,
        tags,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        organizationId: user.organizationId,
      };

      const options = {
        page: validPage,
        pageSize: validPageSize,
        sortBy,
        sortOrder,
        includeHighlights,
      };

      const results = await searchService.searchCourses(
        query,
        user.organizationId,
        filters,
        options
      );

      return NextResponse.json(results);
    } catch (error) {
      console.error('Error searching courses:', error);
      return NextResponse.json(
        { error: 'Failed to search courses' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
);
