import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/student/dashboard/stats - Get student dashboard statistics
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;

      // Only allow students to access their own stats
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get enrolled courses count
      const enrolledCoursesCount = await prisma.enrollment.count({
        where: {
          userId: userId,
          status: 'ACTIVE'
        }
      });

      // Get completed courses count
      const completedCoursesCount = await prisma.enrollment.count({
        where: {
          userId: userId,
          status: 'COMPLETED'
        }
      });

      // Get total quiz attempts count
      const totalQuizzesCount = await prisma.quizAttempt.count({
        where: {
          userId: userId
        }
      });

      // Get average quiz score
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: userId
        },
        select: {
          score: true
        }
      });

      const averageScore = quizAttempts.length > 0 
        ? Math.round(quizAttempts.reduce((sum: number, attempt: { score: number | null }) => sum + (attempt.score || 0), 0) / quizAttempts.length)
        : 0;

      // Calculate total study time (placeholder - would need actual time tracking)
      const totalStudyTime = 0; // This would be calculated from actual study sessions

      const stats = {
        enrolledCourses: enrolledCoursesCount,
        completedCourses: completedCoursesCount,
        totalQuizzes: totalQuizzesCount,
        averageScore: averageScore,
        totalStudyTime: totalStudyTime
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching student dashboard stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student dashboard statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
