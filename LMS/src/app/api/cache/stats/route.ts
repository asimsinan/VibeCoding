import { NextRequest, NextResponse } from 'next/server';
import { withAuthorization } from '@/lib/middleware';
import { cacheService } from '@/services/caching.service';

/**
 * GET /api/cache/stats - Get cache statistics
 */
export const GET = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const stats = cacheService.getStats();
      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching cache statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cache statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);

/**
 * DELETE /api/cache/stats - Clear cache
 */
export const DELETE = withAuthorization(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const key = searchParams.get('key');

      if (key) {
        // Clear specific key
        const deleted = cacheService.delete(key);
        return NextResponse.json({
          message: deleted ? 'Key deleted successfully' : 'Key not found',
          deleted,
        });
      } else {
        // Clear all cache
        cacheService.clear();
        return NextResponse.json({
          message: 'Cache cleared successfully',
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      return NextResponse.json(
        { error: 'Failed to clear cache' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['ADMIN'] }
);
