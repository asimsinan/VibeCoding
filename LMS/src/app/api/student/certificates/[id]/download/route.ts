import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get the id from the URL path
    
    // Get the certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        id: id,
        userId: user.id,
        status: 'ACTIVE'
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

    // Generate PDF certificate
    const pdfBuffer = generateCertificatePDF(certificate);
    
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json(
      { error: 'Failed to download certificate' },
      { status: 500 }
    );
  }
});

function generateCertificatePDF(certificate: any): Buffer {
  // Create new PDF document
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Set up colors
  const primaryColor = '#dc2626'; // Red color matching the theme
  const textColor = '#374151';
  const lightGray = '#6b7280';
  
  // Add border
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(3);
  doc.rect(15, 15, 270, 180);
  
  // Add inner border
  doc.setLineWidth(1);
  doc.rect(20, 20, 260, 170);
  
  // Title
  doc.setFontSize(36);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate of Completion', 150, 50, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(16);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that', 150, 70, { align: 'center' });
  
  // Student name
  doc.setFontSize(28);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.user.name, 150, 95, { align: 'center' });
  
  // Course completion text
  doc.setFontSize(16);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed the course', 150, 115, { align: 'center' });
  
  // Course name
  doc.setFontSize(24);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.course.title, 150, 135, { align: 'center' });
  
  // Organization
  doc.setFontSize(14);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued by: ${certificate.user.organization.name}`, 150, 155, { align: 'center' });
  
  // Certificate details
  doc.setFontSize(12);
  doc.text(`Certificate Number: ${certificate.certificateNumber}`, 50, 170);
  doc.text(`Issued Date: ${new Date(certificate.issuedAt).toLocaleDateString()}`, 50, 180);
  doc.text(`Verification Code: ${certificate.verificationCode}`, 200, 170);
  doc.text(`Status: ${certificate.status}`, 200, 180);
  
  // Add decorative elements
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(2);
  doc.line(50, 160, 100, 160);
  doc.line(200, 160, 250, 160);
  
  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
