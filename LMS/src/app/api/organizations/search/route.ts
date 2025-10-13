import { NextRequest, NextResponse } from 'next/server';
import { organizationService } from '@/services/organization.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const SearchOrganizationsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/organizations/search - Search organizations
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = SearchOrganizationsSchema.parse(Object.fromEntries(searchParams));

      const { query, page, pageSize } = validatedParams;

      const organizations = await organizationService.searchOrganizations(query, authContext.user.id, page, pageSize);
      return NextResponse.json(organizations);
    } catch (error: any) {
      console.error('Error searching organizations:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to search organizations' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);