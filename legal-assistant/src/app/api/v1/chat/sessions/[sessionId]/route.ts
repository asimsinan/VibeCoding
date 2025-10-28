import { NextRequest, NextResponse } from 'next/server';
import { chatSessionService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) => {
  try {
    const session = await chatSessionService.getSessionById(params.sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      userId: session.userId,
      documentId: session.documentId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    return errorHandler(error);
  }
};

