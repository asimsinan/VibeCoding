import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const status = searchParams.get('status') || 'ALL';

      console.log('Admin courses request:');
      console.log('User:', authContext.user);
      console.log('OrganizationId:', authContext.user.organizationId);

      // Get courses in the admin's organization
      const courses = await prisma.course.findMany({
        where: {
          organizationId: authContext.user.organizationId,
          ...(status !== 'ALL' && {
            status: status as any
          })
        },
        include: {
          enrollments: {
            select: {
              id: true,
              userId: true,
              status: true,
              enrolledAt: true,
              completedAt: true
            }
          },
          modules: {
            select: {
              id: true,
              title: true,
              order: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }).catch(error => {
        console.error('Error fetching courses:', error);
        return [];
      });

      console.log('Courses query result:', courses.length, 'courses found');

      // Transform course data
      const transformedCourses = courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        status: course.status,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        enrollmentsCount: course.enrollments?.length || 0,
        modulesCount: course.modules?.length || 0
      }));

      return NextResponse.json(transformedCourses);
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
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
      const { title, description, status = 'DRAFT' } = body;

      // Create new course
      const course = await prisma.course.create({
        data: {
          title,
          description,
          status: status as any,
          organizationId: authContext.user.organizationId
        },
        include: {
          enrollments: true,
          modules: true
        }
      });

      const transformedCourse = {
        id: course.id,
        title: course.title,
        description: course.description || '',
        status: course.status,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        enrollmentsCount: course.enrollments?.length || 0,
        modulesCount: course.modules?.length || 0
      };

      return NextResponse.json(transformedCourse, { status: 201 });
    } catch (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);