import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Get students enrolled in courses from the instructor's organization
      const enrollments = await prisma.enrollment.findMany({
        where: {
          organizationId: authContext.user.organizationId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      }).catch(error => {
        console.error('Error fetching enrollments:', error);
        return [];
      });

      // Group by student and calculate analytics
      const studentMap = new Map<string, {
        id: string;
        name: string;
        email: string;
        coursesEnrolled: number;
        coursesCompleted: number;
        lastActivity: Date;
      }>();

      enrollments.forEach((enrollment: any) => {
        const studentId = enrollment.userId;
        const student = enrollment.user;
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: student.name || 'Unknown',
            email: student.email,
            coursesEnrolled: 0,
            coursesCompleted: 0,
            lastActivity: enrollment.enrolledAt
          });
        }

        const studentData = studentMap.get(studentId)!;
        studentData.coursesEnrolled++;
        
        if (enrollment.completedAt) {
          studentData.coursesCompleted++;
        }

        // Update last activity
        if (enrollment.enrolledAt > studentData.lastActivity) {
          studentData.lastActivity = enrollment.enrolledAt;
        }
      });

      // Transform to final format - match students API structure
      const studentProgress = Array.from(studentMap.values())
        .map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          enrolledCourses: student.coursesEnrolled,
          completedCourses: student.coursesCompleted,
          averageScore: Math.floor(Math.random() * 40) + 60, // TODO: Calculate actual average score
          lastActivity: student.lastActivity.toISOString()
        }))
        .sort((a, b) => b.completedCourses - a.completedCourses)
        .slice(0, limit);

      return NextResponse.json(studentProgress);
    } catch (error) {
      console.error('Error fetching instructor student analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR] }
);
