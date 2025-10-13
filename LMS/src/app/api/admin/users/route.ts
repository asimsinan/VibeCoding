import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/admin/users - Get users list for admin
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      // Only allow admins to access users list
      if (authContext.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const organizationId = authContext.user.organizationId;

      console.log('Admin users request:');
      console.log('User:', authContext.user);
      console.log('OrganizationId:', organizationId);

      // Get users with organization details
      const users = await prisma.user.findMany({
        where: {
          organizationId: organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      console.log('Users query result:', users.length, 'users found');

      const formattedUsers = users.map(user => ({
        id: user.id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        role: user.role,
        organizationName: user.organization.name,
        isActive: true, // TODO: Add isActive field to User model
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field
        coursesCount: user._count.enrollments,
        studentsCount: 0 // TODO: Calculate based on role
      }));

      return NextResponse.json(formattedUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
