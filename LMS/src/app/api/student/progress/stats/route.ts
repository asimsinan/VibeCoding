import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Get enrollments for the student
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
                lessons: {
                  include: {
                    progress: {
                      where: {
                        userId: user.id
                      }
                    },
                    quiz: {
                      include: {
                        attempts: {
                          where: {
                            userId: user.id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate overall statistics
    let totalCourses = enrollments.length;
    let completedCourses = 0;
    let totalLessons = 0;
    let completedLessons = 0;
    let totalQuizzes = 0;
    let completedQuizzes = 0;
    let totalStudyTime = 0; // in minutes
    let currentStreak = 0; // days
    let longestStreak = 0; // days

    // Calculate course and lesson progress
    for (const enrollment of enrollments) {
      const course = enrollment.course;
      let courseCompletedLessons = 0;
      let courseTotalLessons = 0;

      for (const module of course.modules) {
        const moduleLessons = module.lessons.length;
        courseTotalLessons += moduleLessons;
        totalLessons += moduleLessons;

        for (const lesson of module.lessons) {
          const lessonProgress = lesson.progress.find(p => p.status === 'COMPLETED');
          if (lessonProgress) {
            courseCompletedLessons++;
            completedLessons++;
            totalStudyTime += 30; // Estimate 30 minutes per completed lesson
          }

          // Count quizzes
          if (lesson.quiz) {
            totalQuizzes++;
            const quizAttempt = lesson.quiz.attempts.find(attempt => attempt.score !== null);
            if (quizAttempt) {
              completedQuizzes++;
            }
          }
        }
      }

      // Course is completed if all lessons are completed
      if (courseCompletedLessons === courseTotalLessons && courseTotalLessons > 0) {
        completedCourses++;
      }
    }

    // Calculate percentages
    const courseProgressPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    const lessonProgressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const quizProgressPercentage = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

    // Calculate average score (simplified - would need more complex logic for actual quiz scores)
    const averageScore = completedQuizzes > 0 ? 85 : 0; // Placeholder average score

    // Calculate study time in hours
    const studyTimeHours = Math.round(totalStudyTime / 60 * 10) / 10; // Round to 1 decimal place

    const stats = {
      totalCourses,
      completedCourses,
      courseProgressPercentage,
      totalLessons,
      completedLessons,
      lessonProgressPercentage,
      totalQuizzes,
      completedQuizzes,
      quizProgressPercentage,
      averageScore,
      totalStudyTime: studyTimeHours,
      currentStreak,
      longestStreak,
      enrolledAt: enrollments.length > 0 ? enrollments[0].enrolledAt.toISOString() : new Date().toISOString()
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching student progress stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress statistics' },
      { status: 500 }
    );
  }
});
