import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d';

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get instructor's courses with error handling
      const courses = await prisma.course.findMany({
        where: {
          organizationId: authContext.user.organizationId
        },
        include: {
          enrollments: {
            include: {
              user: true
            }
          },
          modules: {
            include: {
              lessons: {
                include: {
                  quiz: {
                    include: {
                      attempts: true
                    }
                  }
                }
              }
            }
          }
        }
      }).catch(error => {
        console.error('Error fetching courses:', error);
        return [];
      });

      // Calculate statistics with null safety
      const totalStudents = new Set(
        courses.flatMap(course => 
          (course.enrollments || []).map(enrollment => enrollment.userId)
        )
      ).size;

      const totalCourses = courses.length;

      const totalQuizzes = courses.reduce((sum, course) => 
        sum + (course.modules || []).reduce((moduleSum, module) => 
          moduleSum + (module.lessons || []).filter(lesson => lesson.quiz).length, 0
        ), 0
      );

      const totalEnrollments = courses.reduce((sum, course) => 
        sum + (course.enrollments || []).length, 0
      );

      // Calculate completion rate
      const completedEnrollments = courses.reduce((sum, course) => 
        sum + (course.enrollments || []).filter(enrollment => 
          enrollment.completedAt !== null
        ).length, 0
      );

      const averageCompletionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

      // Calculate active students (students with activity in the period)
      const activeStudents = new Set(
        courses.flatMap(course => 
          (course.enrollments || [])
            .filter(enrollment => 
              enrollment.enrolledAt && enrollment.enrolledAt >= startDate
            )
            .map(enrollment => enrollment.userId)
        )
      ).size;

      const stats = {
        totalStudents,
        totalCourses,
        totalQuizzes,
        averageCompletionRate,
        totalEnrollments,
        activeStudents
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching instructor analytics stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR] }
);
