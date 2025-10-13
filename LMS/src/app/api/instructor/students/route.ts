import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/instructor/students - Get students enrolled in instructor's courses
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const instructorId = authContext.user.id;
      const organizationId = authContext.user.organizationId;
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      // Only allow instructors and admins to access students
      if (!['INSTRUCTOR', 'ADMIN'].includes(authContext.user.role)) {
        return NextResponse.json(
          { error: 'Access denied. Instructor or Admin role required.' },
          { status: 403 }
        );
      }

      // Get students enrolled in instructor's courses
      const enrollments = await prisma.enrollment.findMany({
        where: {
          organizationId: organizationId,
          course: {
            // TODO: Add instructorId filter when instructorId field is added to Course model
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        },
        take: limit
      });

      // Get recent quiz attempts for last activity calculation
      const userIds = enrollments.map(e => e.user.id);
      const recentQuizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: { in: userIds }
        },
        select: {
          userId: true,
          submittedAt: true
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      // Create a map of user last activity from quiz attempts
      const userLastActivity = new Map();
      recentQuizAttempts.forEach(attempt => {
        if (attempt.submittedAt) {
          if (!userLastActivity.has(attempt.userId) || 
              new Date(attempt.submittedAt) > new Date(userLastActivity.get(attempt.userId))) {
            userLastActivity.set(attempt.userId, attempt.submittedAt.toISOString());
          }
        }
      });

      // Group by user to get unique students
      const studentMap = new Map();
      enrollments.forEach(enrollment => {
        if (!studentMap.has(enrollment.user.id)) {
          const lastActivity = userLastActivity.get(enrollment.user.id) || enrollment.user.createdAt.toISOString();
          
          studentMap.set(enrollment.user.id, {
            id: enrollment.user.id,
            firstName: enrollment.user.name?.split(' ')[0] || '',
            lastName: enrollment.user.name?.split(' ').slice(1).join(' ') || '',
            email: enrollment.user.email,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            progress: 0, // Will be calculated based on completed courses
            lastActivity: lastActivity,
            coursesEnrolled: 1,
            completedCourses: enrollment.completedAt ? 1 : 0
          });
        } else {
          const student = studentMap.get(enrollment.user.id);
          student.coursesEnrolled += 1;
          if (enrollment.completedAt) {
            student.completedCourses += 1;
          }
        }
      });

      // Calculate progress based on completed courses
      studentMap.forEach(student => {
        student.progress = student.coursesEnrolled > 0 
          ? Math.round((student.completedCourses / student.coursesEnrolled) * 100)
          : 0;
      });

      const students = Array.from(studentMap.values());

      return NextResponse.json(students);
    } catch (error) {
      console.error('Error fetching instructor students:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instructor students' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR, UserRole.ADMIN] }
);
