import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

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
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate progress for each course
    const courses = await Promise.all(enrollments.map(async enrollment => {
      const course = enrollment.course;
      let totalLessons = 0;
      let completedLessons = 0;
      let totalQuizzes = 0;
      let completedQuizzes = 0;
      let totalQuizScore = 0;
      let quizAttempts = 0;
      let totalModules = course.modules.length;
      let completedModules = 0;

      // Calculate lesson and quiz progress
      for (const module of course.modules) {
        const moduleLessons = module.lessons.length;
        totalLessons += moduleLessons;
        
        const moduleCompletedLessons = module.lessons.filter(lesson => 
          lesson.progress.some(p => p.status === 'COMPLETED')
        ).length;
        
        completedLessons += moduleCompletedLessons;
        
        // Count quizzes and completed quizzes
        for (const lesson of module.lessons) {
          if (lesson.quiz) {
            totalQuizzes++;
            
            // Check if student has completed this quiz
            const quizAttempt = await prisma.quizAttempt.findFirst({
              where: {
                quizId: lesson.quiz.id,
                userId: user.id,
                score: { not: null }
              },
              orderBy: {
                submittedAt: 'desc'
              }
            });
            
            if (quizAttempt) {
              completedQuizzes++;
              totalQuizScore += quizAttempt.score || 0;
              quizAttempts++;
            }
          }
        }
        
        // Module is completed if all its lessons are completed
        if (moduleCompletedLessons === moduleLessons && moduleLessons > 0) {
          completedModules++;
        }
      }

      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const moduleProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      const averageQuizScore = quizAttempts > 0 ? Math.round((totalQuizScore / quizAttempts) * 100) / 100 : 0;
      
      // Determine course status
      let courseStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (completedLessons > 0) {
        courseStatus = completedLessons === totalLessons ? 'COMPLETED' : 'IN_PROGRESS';
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: 'Course Instructor', // TODO: Add instructor relationship
        thumbnail: null, // TODO: Add thumbnail field
        totalLessons,
        completedLessons,
        totalQuizzes,
        completedQuizzes,
        averageQuizScore,
        progress: progressPercentage,
        status: courseStatus,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        lastAccessed: enrollment.enrolledAt.toISOString(), // Could be enhanced with actual last access tracking
        estimatedTimeRemaining: (totalLessons - completedLessons) * 30 // Estimate 30 minutes per lesson
      };
    }));

    // Sort by last accessed date (most recent first)
    courses.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());

    // Apply limit
    const limitedCourses = courses.slice(0, limit);

    return NextResponse.json(limitedCourses);

  } catch (error) {
    console.error('Error fetching student progress courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course progress' },
      { status: 500 }
    );
  }
});
