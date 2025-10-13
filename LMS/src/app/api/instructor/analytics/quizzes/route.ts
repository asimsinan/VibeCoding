import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Get quizzes for courses in the instructor's organization
      const quizzes = await prisma.quiz.findMany({
        where: {
          lesson: {
            module: {
              course: {
                organizationId: authContext.user.organizationId
              }
            }
          }
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          },
          attempts: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }).catch(error => {
        console.error('Error fetching quizzes:', error);
        return [];
      });

      // Transform quiz data with performance metrics
      const quizPerformance = quizzes.map((quiz: any) => {
        const attempts = quiz.attempts || [];
        const totalAttempts = attempts.length;
        
        const averageScore = totalAttempts > 0
          ? Math.round(
              attempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) /
              totalAttempts
            )
          : 0;

        // Since Quiz model doesn't have passingScore, we'll use a default threshold of 70%
        const passingThreshold = 70;
        const passRate = totalAttempts > 0
          ? Math.round(
              (attempts.filter((attempt: any) => 
                (attempt.score || 0) >= passingThreshold
              ).length / totalAttempts) * 100
            )
          : 0;

        return {
          id: quiz.id,
          title: quiz.title,
          courseTitle: quiz.lesson?.module?.course?.title || 'Unknown Course',
          totalAttempts,
          averageScore,
          passRate
        };
      });

      return NextResponse.json(quizPerformance);
    } catch (error) {
      console.error('Error fetching instructor quiz analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz analytics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR] }
);
