import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/instructor/students/export - Export students data to CSV
 */
export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const organizationId = authContext.user.organizationId;
      const { searchParams } = new URL(request.url);
      const separator = searchParams.get('separator') || ','; // Default to comma, can be ';' for semicolon

      // Only allow instructors and admins to export student data
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
        }
      });

      // Group by user to get unique students with their course counts
      const studentMap = new Map();
      enrollments.forEach(enrollment => {
        if (!studentMap.has(enrollment.user.id)) {
          studentMap.set(enrollment.user.id, {
            id: enrollment.user.id,
            name: enrollment.user.name || 'Unknown',
            email: enrollment.user.email,
            role: enrollment.user.role,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            coursesCount: 1,
            courses: [enrollment.course.title]
          });
        } else {
          const student = studentMap.get(enrollment.user.id);
          student.coursesCount += 1;
          student.courses.push(enrollment.course.title);
        }
      });

      const students = Array.from(studentMap.values());

      // Generate CSV content
      const csvHeaders = [
        'Student ID',
        'Name',
        'Email',
        'Role',
        'Courses Enrolled',
        'Course Names',
        'Enrolled Date'
      ];

      const csvRows = students.map((student: any) => [
        student.id,
        student.name,
        student.email,
        student.role,
        student.coursesCount,
        student.courses.join('; '),
        new Date(student.enrolledAt).toLocaleDateString()
      ]);

      // Properly escape CSV content
      const escapeCsvField = (field: any) => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        // If field contains separator, newline, or quote, wrap in quotes and escape quotes
        if (str.includes(separator) || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = [
        csvHeaders.map(escapeCsvField).join(separator),
        ...csvRows.map((row: any) => row.map(escapeCsvField).join(separator))
      ].join('\n');

      // Add BOM for proper UTF-8 encoding in Excel
      const csvWithBOM = '\uFEFF' + csvContent;

      console.log('Exporting CSV with', students.length, 'students');
      console.log('CSV Preview:', csvContent.substring(0, 200) + '...');
      console.log('First row:', csvHeaders.join(','));
      console.log('Sample data row:', csvRows[0]?.join(','));

      return new NextResponse(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="students-export-${organizationId}-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Error exporting students data:', error);
      return NextResponse.json(
        { error: 'Failed to export students data' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['INSTRUCTOR', 'ADMIN'] }
);
