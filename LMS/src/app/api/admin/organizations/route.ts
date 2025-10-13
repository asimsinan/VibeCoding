import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');

      console.log('Admin organizations request:');
      console.log('User:', authContext.user);
      console.log('OrganizationId:', authContext.user.organizationId);

      // Get all organizations (admin can see all organizations)
      const organizations = await prisma.organization.findMany({
        include: {
          users: {
            select: {
              id: true,
              role: true
            }
          },
          courses: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }).catch(error => {
        console.error('Error fetching organizations:', error);
        return [];
      });

      console.log('Organizations query result:', organizations.length, 'organizations found');
      console.log('Raw organizations data:', organizations.map(org => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        usersCount: org.users?.length || 0,
        coursesCount: org.courses?.length || 0
      })));

      // Transform organization data
      const transformedOrganizations = organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        usersCount: org.users?.length || 0,
        coursesCount: org.courses?.length || 0,
        settings: org.settings
      }));

      return NextResponse.json(transformedOrganizations);
    } catch (error) {
      console.error('Error fetching admin organizations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);

export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const body = await request.json();
      const { name, domain, settings } = body;

      // Create new organization
      const organization = await prisma.organization.create({
        data: {
          name,
          domain,
          settings: settings || {}
        },
        include: {
          users: true,
          courses: true
        }
      });

      const transformedOrganization = {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        usersCount: organization.users?.length || 0,
        coursesCount: organization.courses?.length || 0,
        settings: organization.settings
      };

      return NextResponse.json(transformedOrganization, { status: 201 });
    } catch (error) {
      console.error('Error creating organization:', error);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
