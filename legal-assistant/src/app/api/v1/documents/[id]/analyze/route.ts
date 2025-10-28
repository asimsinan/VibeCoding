import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { KVKKAnalyzer } from '@/lib/kvkk-analyzer/analyzer';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

const analyzer = new KVKKAnalyzer();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { analysisType } = body;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı' },
        { status: 404 }
      );
    }

    if (!document.extractedText) {
      return NextResponse.json(
        { error: 'Döküman metni bulunamadı. Lütfen dökümanı tekrar yükleyin.' },
        { status: 400 }
      );
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.documentAnalysis.findFirst({
      where: { 
        documentId: id,
        analysisType: analysisType || 'kvkk',
      },
    });

    if (existingAnalysis && existingAnalysis.status === 'completed') {
      return NextResponse.json({
        message: 'Bu döküman için analiz zaten tamamlanmış',
        analysisId: existingAnalysis.id,
        results: existingAnalysis.results,
      });
    }

    // Perform analysis
    const analysisResult = await analyzer.analyzeDocument({
      documentId: id,
      documentText: document.extractedText,
    });

    // Save or update analysis in database
    const analysis = existingAnalysis
      ? await prisma.documentAnalysis.update({
          where: { id: existingAnalysis.id },
          data: {
            analysisType: analysisType || 'kvkk',
            results: analysisResult as any,
            status: 'completed',
          },
        })
      : await prisma.documentAnalysis.create({
          data: {
            documentId: id,
            analysisType: analysisType || 'kvkk',
            results: analysisResult as any,
            status: 'completed',
          },
        });

    return NextResponse.json({
      message: 'Analiz tamamlandı',
      analysisId: analysis.id,
      results: analysisResult,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return errorHandler(error);
  }
}

