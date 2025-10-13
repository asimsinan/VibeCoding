import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { SearchService } from '@/services/search.service';
import { DataValidationService } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const searchService = new SearchService(prisma);

/**
 * GET /api/search - Search across all content types
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      const type = searchParams.get('type') as any;
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const level = searchParams.get('level');
      const tags = searchParams.get('tags')?.split(',');
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const sortBy = searchParams.get('sortBy') as any || 'relevance';
      const sortOrder = searchParams.get('sortOrder') as any || 'desc';
      const includeHighlights = searchParams.get('includeHighlights') === 'true';
      const fuzzySearch = searchParams.get('fuzzySearch') === 'true';

      // Validate search query
      if (!query.trim()) {
        return NextResponse.json(
          { error: 'Search query is required' },
          { status: 400 }
        );
      }

      // Validate pagination parameters
      const { page: validPage, pageSize: validPageSize } = DataValidationService.validatePagination(page, pageSize);

      const filters = {
        type,
        status: status || undefined,
        category: category || undefined,
        level: level || undefined,
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
        fuzzySearch,
      };

      const results = await searchService.searchAll(
        query,
        user.organizationId,
        filters,
        options
      );

      return NextResponse.json(results);
    } catch (error) {
      console.error('Error performing search:', error);
      return NextResponse.json(
        { error: 'Failed to perform search' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
);

/**
 * GET /api/search/suggestions - Get search suggestions
 */
export const POST = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { query } = body;

      if (!query || query.length < 2) {
        return NextResponse.json({ suggestions: [] });
      }

      const suggestions = await searchService.getSuggestions(query, user.organizationId);

      return NextResponse.json({ suggestions });
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to get search suggestions' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
);
