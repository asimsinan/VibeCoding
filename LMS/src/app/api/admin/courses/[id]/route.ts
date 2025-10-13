import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id: courseId } = await params;
      const organizationId = authContext.user.organizationId;


      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: organizationId
        },
        include: {
          modules: {
            orderBy: {
              order: 'asc'
            },
            include: {
              lessons: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  order: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              modules: true
            }
          }
        }
      });

      if (!course) {
        console.log('Course not found:', courseId);
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      console.log('Course found:', course.title);

      // Transform the data to match the expected interface
      const transformedCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        enrollmentsCount: course._count.enrollments,
        modulesCount: course._count.modules,
        modules: course.modules
      };

      return NextResponse.json(transformedCourse);
    } catch (error) {
      console.error('Error fetching course:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course' },
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
      const { id: courseId } = await params;
      const organizationId = authContext.user.organizationId;
      const body = await request.json();

      console.log('Admin update course request:');
      console.log('User:', authContext.user);
      console.log('CourseId:', courseId);
      console.log('OrganizationId:', organizationId);
      console.log('Update data:', body);

      // Check if course exists and belongs to the same organization
      const existingCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: organizationId
        }
      });

      if (!existingCourse) {
        console.log('Course not found:', courseId);
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      console.log('Course found, updating:', existingCourse.title);

      // Update course
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          title: body.title,
          description: body.description,
          status: body.status
        },
        include: {
          modules: {
            orderBy: {
              order: 'asc'
            },
            include: {
              lessons: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  order: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              modules: true
            }
          }
        }
      });

      console.log('Course updated successfully:', updatedCourse.title);

      // Transform the data to match the expected interface
      const transformedCourse = {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        status: updatedCourse.status,
        createdAt: updatedCourse.createdAt.toISOString(),
        updatedAt: updatedCourse.updatedAt.toISOString(),
        enrollmentsCount: updatedCourse._count.enrollments,
        modulesCount: updatedCourse._count.modules,
        modules: updatedCourse.modules
      };

      return NextResponse.json(transformedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }
  })(request);
}
