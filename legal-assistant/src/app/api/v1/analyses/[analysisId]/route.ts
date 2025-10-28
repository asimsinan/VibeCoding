import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;

    const analysis = await prisma.documentAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        document: true,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analiz bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        documentId: analysis.documentId,
        analysisType: analysis.analysisType,
        status: analysis.status,
        results: analysis.results,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;

    const analysis = await prisma.documentAnalysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analiz bulunamadı' },
        { status: 404 }
      );
    }

    await prisma.documentAnalysis.delete({
      where: { id: analysisId },
    });

    return NextResponse.json({ message: 'Analiz silindi' });
  } catch (error) {
    return errorHandler(error);
  }
}
