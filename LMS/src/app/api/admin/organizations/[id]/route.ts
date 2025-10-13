import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: organizationId } = await params;
      const userOrganizationId = authContext.user.organizationId;

      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          courses: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              users: true,
              courses: true
            }
          }
        }
      });

      if (!organization) {
        console.log('Organization not found:', organizationId);
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      console.log('Organization found:', organization.name);

      // Transform the data to match the expected interface
      const transformedOrganization = {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        usersCount: organization._count.users,
        coursesCount: organization._count.courses,
        settings: organization.settings,
        users: organization.users,
        courses: organization.courses
      };

      return NextResponse.json(transformedOrganization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: organizationId } = await params;
      const body = await request.json();

      console.log('Admin update organization request:');
      console.log('User:', authContext.user);
      console.log('OrganizationId:', organizationId);
      console.log('Update data:', body);

      // Check if organization exists
      const existingOrganization = await prisma.organization.findFirst({
        where: {
          id: organizationId
        }
      });

      if (!existingOrganization) {
        console.log('Organization not found:', organizationId);
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      console.log('Organization found, updating:', existingOrganization.name);

      // Update organization
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          name: body.name,
          domain: body.domain || null
        },
        include: {
          _count: {
            select: {
              users: true,
              courses: true
            }
          }
        }
      });

      console.log('Organization updated successfully:', updatedOrganization.name);

      // Transform the data to match the expected interface
      const transformedOrganization = {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        domain: updatedOrganization.domain,
        createdAt: updatedOrganization.createdAt.toISOString(),
        updatedAt: updatedOrganization.updatedAt.toISOString(),
        usersCount: updatedOrganization._count.users,
        coursesCount: updatedOrganization._count.courses,
        settings: updatedOrganization.settings
      };

      return NextResponse.json(transformedOrganization);
    } catch (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }
  })(request);
}
