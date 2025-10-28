import { NextRequest, NextResponse } from 'next/server';
import { documentAnalysisService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı kimliği gereklidir' },
        { status: 400 }
      );
    }

    const analyses = await documentAnalysisService.getUserAnalyses(userId);

    return NextResponse.json({
      analyses: analyses.map(analysis => ({
        id: analysis.id,
        documentId: analysis.documentId,
        analysisType: analysis.analysisType,
        status: analysis.status,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      })),
    });
  } catch (error) {
    return errorHandler(error);
  }
};

