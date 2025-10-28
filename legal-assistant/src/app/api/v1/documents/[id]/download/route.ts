import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/database';
import { errorHandler } from '@/lib/api/error-handler';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    console.log('Download requested for document ID:', id);
    const document = await documentService.getDocumentById(id);

    console.log('Document found:', !!document);
    if (!document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı' },
        { status: 404 }
      );
    }

    console.log('Document filePath:', document.filePath);
    
    // Check if filePath is a URL (Vercel Blob) or a local path
    let fileBuffer: Buffer;
    let fileName: string;
    
    try {
      if (document.filePath.startsWith('http://') || document.filePath.startsWith('https://')) {
        // Vercel Blob URL - fetch the file
        console.log('Fetching from Vercel Blob:', document.filePath);
        const response = await fetch(document.filePath);
        fileBuffer = Buffer.from(await response.arrayBuffer());
        fileName = path.basename(document.filePath);
      } else {
        // Local filesystem path
        fileBuffer = await fs.readFile(document.filePath);
        fileName = path.basename(document.filePath);
      }
      
      console.log('File read successfully, size:', fileBuffer.length);

      // Encode filename for HTTP header (handles Turkish characters)
      const encodedFileName = encodeURIComponent(fileName);
      const asciiFileName = fileName.replace(/[^\x00-\x7F]/g, ''); // ASCII fallback

      // Return the file as a binary response
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': document.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'Dosya okunamadı', details: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 404 }
      );
    }
  } catch (error) {
    return errorHandler(error);
  }
};

