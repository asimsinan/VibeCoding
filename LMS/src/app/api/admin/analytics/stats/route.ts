import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      // Get system-wide statistics
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        activeUsers
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.course.count().catch(() => 0),
        prisma.enrollment.count().catch(() => 0),
        prisma.enrollment.count({
          where: { completedAt: { not: null } }
        }).catch(() => 0),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }).catch(() => 0)
      ]);

      // Calculate completion rate
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

      // Calculate average score from quiz attempts
      const quizAttempts = await prisma.quizAttempt.findMany({
        select: { score: true }
      }).catch(() => []);

      const averageScore = quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
            quizAttempts.length
          )
        : 0;

      const stats = {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
        completionRate,
        averageScore
      };

      return NextResponse.json(stats);
    } catch (error) {
      console.error('Error fetching admin analytics stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics statistics' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);
