import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateNumber = searchParams.get('certificateNumber');
    const verificationCode = searchParams.get('verificationCode');

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Get the certificate
    const certificate = await prisma.certificate.findUnique({
      where: {
        certificateNumber: certificateNumber
      },
      include: {
        course: {
          select: {
            title: true,
            description: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            organization: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Verify the verification code if provided
    if (verificationCode && certificate.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Return certificate details
    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        courseTitle: certificate.course.title,
        studentName: certificate.user.name,
        organizationName: certificate.user.organization.name,
        issuedDate: certificate.issuedAt.toISOString(),
        status: certificate.status,
        verificationCode: certificate.verificationCode
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
