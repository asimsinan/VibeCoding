import { NextRequest, NextResponse } from 'next/server';
import { chatSessionService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, documentId, title } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı kimliği gereklidir' },
        { status: 400 }
      );
    }

    const session = await chatSessionService.createSession({
      userId,
      documentId: documentId || null,
      title: title || null
    });

    return NextResponse.json({
      id: session.id,
      userId: session.userId,
      documentId: session.documentId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }, { status: 201 });
  } catch (error) {
    return errorHandler(error);
  }
};

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

    const sessions = await chatSessionService.getUserSessions(userId);

    return NextResponse.json({
      sessions
    });
  } catch (error) {
    return errorHandler(error);
  }
};

