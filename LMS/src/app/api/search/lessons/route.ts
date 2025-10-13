import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { SearchService } from '@/services/search.service';
import { DataValidationService } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const searchService = new SearchService(prisma);

/**
 * GET /api/search/lessons - Search lessons
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      const type = searchParams.get('type');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const sortBy = searchParams.get('sortBy') as any || 'relevance';
      const sortOrder = searchParams.get('sortOrder') as any || 'desc';
      const includeHighlights = searchParams.get('includeHighlights') === 'true';

      // Validate pagination parameters
      const { page: validPage, pageSize: validPageSize } = DataValidationService.validatePagination(page, pageSize);

      const filters = {
        type: type as any || undefined,
        organizationId: user.organizationId,
      };

      const options = {
        page: validPage,
        pageSize: validPageSize,
        sortBy,
        sortOrder,
        includeHighlights,
      };

      const results = await searchService.searchLessons(
        query,
        user.organizationId,
        filters,
        options
      );

      return NextResponse.json(results);
    } catch (error) {
      console.error('Error searching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to search lessons' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
);
