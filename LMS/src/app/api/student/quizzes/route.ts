import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'ALL';

    // Get quizzes for courses the student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    });

    // Flatten quizzes and add enrollment status
    const quizzes = [];
    for (const enrollment of enrollments) {
      for (const module of enrollment.course.modules) {
        for (const lesson of module.lessons) {
          // Get quizzes for this lesson
          const lessonQuizzes = await prisma.quiz.findMany({
            where: { lessonId: lesson.id },
            include: {
              attempts: {
                where: { userId: user.id },
                orderBy: { id: 'desc' },
                take: 5 // Get more attempts to find the right one
              }
            }
          });

          for (const quiz of lessonQuizzes) {
            // Find the most relevant attempt: incomplete first, then most recent completed
            const attempts = (quiz as any).attempts || [];
            const incompleteAttempt = attempts.find((attempt: any) => attempt.score === null);
            const latestCompletedAttempt = attempts.find((attempt: any) => attempt.score !== null);
            const latestAttempt = incompleteAttempt || latestCompletedAttempt;
          
            let quizStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
            let score: number | undefined;
            let attemptCount = 0;

            if (latestAttempt) {
              attemptCount = await prisma.quizAttempt.count({
                where: {
                  quizId: quiz.id,
                  userId: user.id
                }
              });

              // Determine status based on whether there's a score
              if (latestAttempt.score !== null) {
                quizStatus = 'COMPLETED';
                score = latestAttempt.score;
              } else {
                quizStatus = 'IN_PROGRESS';
              }
            }

            // Apply status filter
            if (status !== 'ALL' && quizStatus !== status) {
              continue;
            }

            // Get question count for this quiz
            const questionCount = await prisma.question.count({
              where: { quizId: quiz.id }
            });

            quizzes.push({
              id: quiz.id,
              title: quiz.title,
              courseTitle: enrollment.course.title,
              lessonTitle: lesson.title,
              status: quizStatus,
              score,
              maxScore: questionCount, // Each question is worth 1 point
              attemptCount,
              lastAttemptedAt: latestAttempt?.submittedAt?.toISOString(),
              timeLimit: quiz.timeLimit,
              questionCount
            });
          }
        }
      }
    }

    // Sort by last attempted date (most recent first)
    quizzes.sort((a, b) => {
      if (!a.lastAttemptedAt && !b.lastAttemptedAt) return 0;
      if (!a.lastAttemptedAt) return 1;
      if (!b.lastAttemptedAt) return -1;
      return new Date(b.lastAttemptedAt).getTime() - new Date(a.lastAttemptedAt).getTime();
    });

    // Apply limit
    const limitedQuizzes = quizzes.slice(0, limit);

    return NextResponse.json(limitedQuizzes);

  } catch (error) {
    console.error('Error fetching student quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
});
