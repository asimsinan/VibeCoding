import { NextRequest, NextResponse } from 'next/server';
import { organizationService } from '@/services/organization.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';

// GET /api/organizations/[id] - Get organization by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const organization = await organizationService.getOrganizationById(id, authContext.user.id);
        return NextResponse.json(organization);
      } catch (error: any) {
        console.error('Error fetching organization:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch organization' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT] }
  )(req);
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const body = await req.json();
        const { id } = await params;
        const organization = await organizationService.updateOrganization(id, body, authContext.user.id);
        return NextResponse.json(organization);
      } catch (error: any) {
        console.error('Error updating organization:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update organization' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN] }
  )(req);
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    async (req: NextRequest, authContext) => {
      try {
        const { id } = await params;
        const result = await organizationService.deleteOrganization(id, authContext.user.id);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete organization' },
          { status: error.statusCode || 500 }
        );
      }
    },
    { requiredRoles: [UserRole.ADMIN] }
  )(req);
}