import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/student/quizzes/[id] - Get individual quiz details for a student
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const quizId = pathname.split('/').pop();

      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to access quiz details
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get quiz details with course information
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                enrollments: {
                  some: {
                    userId: userId,
                    status: 'ACTIVE'
                  }
                }
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
          questions: true
        }
      });

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        );
      }

      // Get student's attempts for this quiz
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: quizId,
          userId: userId
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      const quizData = {
        id: quiz.id,
        title: quiz.title,
        courseId: quiz.lesson.module.course.id,
        courseTitle: quiz.lesson.module.course.title,
        lessonTitle: quiz.lesson.title,
        timeLimit: quiz.timeLimit,
        questionCount: quiz.questions.length,
        questions: quiz.questions.map(q => {
          const options = q.options as any || {};
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            options: typeof options === 'object' && !Array.isArray(options)
              ? Object.entries(options).map(([key, text]) => ({
                  id: key,
                  text: text,
                  isCorrect: false // Will be determined during quiz taking
                }))
              : []
          };
        }),
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          submittedAt: attempt.submittedAt?.toISOString(),
          answers: attempt.answers as any[]
        }))
      };

      return NextResponse.json(quizData);
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Failed to fetch quiz details' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
