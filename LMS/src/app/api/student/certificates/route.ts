import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get certificates for the student from the database
    const certificates = await prisma.certificate.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      },
      take: limit
    });

    // Transform certificates to match expected format
    const transformedCertificates = certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      courseId: cert.courseId,
      courseTitle: cert.course.title,
      studentName: cert.user.name || 'Student',
      studentEmail: cert.user.email,
      organizationName: cert.user.organization.name,
      issuedDate: cert.issuedAt.toISOString(),
      downloadUrl: `/api/student/certificates/${cert.id}/download`,
      verificationUrl: `/certificates/verify/${cert.certificateNumber}`,
      status: cert.status,
      type: 'COURSE_COMPLETION',
      grade: 'PASS',
      score: 95, // Placeholder score
      maxScore: 100,
      completionPercentage: 100
    }));

    return NextResponse.json(transformedCertificates);

  } catch (error) {
    console.error('Error fetching student certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
});
