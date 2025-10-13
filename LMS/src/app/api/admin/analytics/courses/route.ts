import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');

      // Get all courses with analytics
      const courses = await prisma.course.findMany({
        include: {
          enrollments: {
            select: {
              id: true,
              completedAt: true
            }
          },
          modules: {
            include: {
              lessons: {
                include: {
                  quiz: {
                    include: {
                      attempts: {
                        select: {
                          score: true
                        }
                      }
                    }
                  }
                }
              }
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

      // Transform course data with analytics
      const courseAnalytics = courses.map((course: any) => {
        const enrollments = (course.enrollments || []).length;
        const completions = (course.enrollments || []).filter(
          (enrollment: any) => enrollment.completedAt !== null
        ).length;

        // Calculate average score from quiz attempts
        const allQuizAttempts = (course.modules || []).flatMap((module: any) =>
          (module.lessons || []).flatMap((lesson: any) =>
            lesson.quiz?.attempts || []
          )
        );

        const averageScore = allQuizAttempts.length > 0
          ? Math.round(
              allQuizAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) /
              allQuizAttempts.length
            )
          : 0;

        const completionRate = enrollments > 0 
          ? Math.round((completions / enrollments) * 100)
          : 0;

        return {
          id: course.id,
          title: course.title,
          enrollments,
          completions,
          averageScore,
          completionRate
        };
      });

      return NextResponse.json(courseAnalytics);
    } catch (error) {
      console.error('Error fetching admin course analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
