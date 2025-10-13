import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/student/activities - Get student's recent activities
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Only allow students to access their own activities
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get recent activities from various sources
      const activities: any[] = [];

      // Get recent quiz attempts
      const recentQuizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: userId
        },
        include: {
          quiz: {
            select: {
              title: true,
              lesson: {
                select: {
                  title: true,
                  module: {
                    select: {
                      title: true,
                      course: {
                        select: {
                          title: true
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
          submittedAt: 'desc'
        },
        take: Math.ceil(limit / 2)
      });

      // Get recent progress updates
      const recentProgress = await prisma.progress.findMany({
        where: {
          userId: userId,
          status: 'COMPLETED'
        },
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: Math.ceil(limit / 2)
      });

      // Format quiz attempt activities
      recentQuizAttempts.forEach(attempt => {
        if (attempt.quiz && attempt.quiz.lesson && attempt.quiz.lesson.module && attempt.quiz.lesson.module.course) {
          activities.push({
            id: `quiz-${attempt.id}`,
            type: 'quiz',
            action: 'completed',
            description: `Completed quiz: ${attempt.quiz.title} - Scored ${attempt.score || 0}% in ${attempt.quiz.lesson.module.course.title}`,
            timestamp: attempt.submittedAt,
            user: {
              name: authContext.user.name || 'Student',
              email: authContext.user.email
            }
          });
        }
      });

      // Format progress activities
      recentProgress.forEach(progress => {
        if (progress.lesson && progress.lesson.module && progress.lesson.module.course) {
          activities.push({
            id: `progress-${progress.id}`,
            type: 'lesson',
            action: 'completed',
            description: `Completed lesson: ${progress.lesson.title} in ${progress.lesson.module.course.title}`,
            timestamp: progress.completedAt || progress.createdAt,
            user: {
              name: authContext.user.name || 'Student',
              email: authContext.user.email
            }
          });
        }
      });

      // Sort activities by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const limitedActivities = activities.slice(0, limit);

      return NextResponse.json(limitedActivities);
    } catch (error) {
      console.error('Error fetching student activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student activities' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
