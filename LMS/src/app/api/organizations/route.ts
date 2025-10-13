import { NextRequest, NextResponse } from 'next/server';
import { organizationService } from '@/services/organization.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const GetOrganizationsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/organizations - Get all organizations
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const validatedParams = GetOrganizationsSchema.parse(Object.fromEntries(searchParams));

      const { page, pageSize } = validatedParams;

      const organizations = await organizationService.getAllOrganizations(authContext.user.id, page, pageSize);
      return NextResponse.json(organizations);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch organizations' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);

// POST /api/organizations - Create organization
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      const organization = await organizationService.createOrganization(body, authContext.user.id);
      return NextResponse.json(organization, { status: 201 });
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create organization' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);