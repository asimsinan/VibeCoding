import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/instructor/activities - Get instructor activities feed
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const instructorId = authContext.user.id;
      const organizationId = authContext.user.organizationId;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Only allow instructors and admins to access activities
      if (!['INSTRUCTOR', 'ADMIN'].includes(authContext.user.role)) {
        return NextResponse.json(
          { error: 'Access denied. Instructor or Admin role required.' },
          { status: 403 }
        );
      }

      // Get recent activities from various sources
      const activities: any[] = [];

      // Get recent course creations
      const recentCourses = await prisma.course.findMany({
        where: {
          organizationId: organizationId
          // TODO: Add instructorId filter when instructorId field is added to Course model
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      });

      // Get recent enrollments in instructor's courses
      const recentEnrollments = await prisma.enrollment.findMany({
        where: {
          organizationId: organizationId,
          course: {
            // TODO: Add instructorId filter when instructorId field is added to Course model
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          course: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      });

      // Get recent quiz attempts in instructor's courses
      const recentQuizAttempts = await prisma.quizAttempt.findMany({
        where: {
          quiz: {
            lesson: {
              module: {
                course: {
                  organizationId: organizationId
                  // TODO: Add instructorId filter when instructorId field is added to Course model
                }
              }
            }
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          quiz: {
            select: {
              title: true,
              lesson: {
                select: {
                  module: {
                    select: {
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
        take: Math.ceil(limit / 3)
      });

      // Format course creation activities
      recentCourses.forEach(course => {
        activities.push({
          id: `course-${course.id}`,
          type: 'course',
          action: 'created',
          title: `Course created: ${course.title}`,
          description: `Course "${course.title}" was created`,
          timestamp: course.createdAt.toISOString(),
          user: {
            name: authContext.user.name || 'Instructor',
            email: authContext.user.email
          }
        });
      });

      // Format enrollment activities
      recentEnrollments.forEach(enrollment => {
        activities.push({
          id: `enrollment-${enrollment.id}`,
          type: 'enrollment',
          action: 'enrolled',
          title: `Student enrolled in course`,
          description: `${enrollment.user.name} enrolled in "${enrollment.course.title}"`,
          timestamp: enrollment.enrolledAt.toISOString(),
          user: {
            name: enrollment.user.name || 'Student',
            email: enrollment.user.email
          }
        });
      });

      // Format quiz attempt activities
      recentQuizAttempts.forEach(attempt => {
        activities.push({
          id: `quiz-attempt-${attempt.id}`,
          type: 'quiz',
          action: 'completed',
          title: `Quiz completed`,
          description: `${attempt.user.name} completed "${attempt.quiz.title}" in ${attempt.quiz.lesson.module.course.title}`,
          timestamp: attempt.submittedAt?.toISOString() || attempt.createdAt.toISOString(),
          user: {
            name: attempt.user.name || 'Student',
            email: attempt.user.email
          }
        });
      });

      // Sort activities by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const limitedActivities = activities.slice(0, limit);

      return NextResponse.json(limitedActivities);
    } catch (error) {
      console.error('Error fetching instructor activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instructor activities' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);
