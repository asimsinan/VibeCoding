import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '';
    const query = searchParams.get('query') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı kimliği gereklidir' },
        { status: 400 }
      );
    }

    let documents;
    if (query) {
      documents = await documentService.searchDocuments(query, userId);
    } else {
      documents = await documentService.getUserDocuments(userId);
    }

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        extractedText: doc.extractedText,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    return errorHandler(error);
  }
};
