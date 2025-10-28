import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';
import fs from 'fs/promises';
import path from 'path';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const document = await documentService.getDocumentById(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      description: document.description,
      filePath: document.filePath,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      extractedText: document.extractedText,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    return errorHandler(error);
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const document = await documentService.getDocumentById(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı' },
        { status: 404 }
      );
    }

    // Delete file from Vercel Blob or filesystem
    if (document.filePath) {
      try {
        if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
          // Vercel Blob URL - delete from blob storage
          try {
            await del(document.filePath);
            console.log('File deleted from Vercel Blob:', document.filePath);
          } catch (blobError) {
            console.warn('Failed to delete from Vercel Blob:', blobError);
            // Continue with database deletion even if blob deletion fails
          }
        } else {
          // Local filesystem path - try to delete
          try {
            await fs.access(document.filePath);
            await fs.unlink(document.filePath);
          } catch (accessError: any) {
            // File doesn't exist (likely temp file that's already been cleaned up)
            console.log('File already deleted or not found:', document.filePath);
          }
        }
      } catch (error) {
        console.warn('Failed to delete file:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database (this will cascade delete chunks and analyses)
    await documentService.deleteDocument(params.id);

    return NextResponse.json({
      message: 'Döküman başarıyla silindi',
    });
  } catch (error) {
    return errorHandler(error);
  }
};
