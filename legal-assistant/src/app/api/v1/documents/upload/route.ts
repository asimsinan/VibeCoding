import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/database';
import { documentParser } from '@/lib/document-parser';
import { embeddingService } from '@/lib/services/embedding-service';
import { chunkService } from '@/lib/services/chunk-service';
import { errorHandler } from '@/lib/api/error-handler';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const userId = formData.get('userId') as string; // In production, get from session

    console.log('Upload request - file:', file?.name, 'title:', title, 'userId:', userId);

    if (!file || !title || !userId) {
      console.log('Missing fields - file:', !!file, 'title:', !!title, 'userId:', !!userId);
      return NextResponse.json(
        { error: 'Dosya, başlık ve kullanıcı kimliği gereklidir' },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (!documentParser.validateFileExtension(file.name)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Sadece PDF ve DOCX dosyaları kabul edilir.' },
        { status: 400 }
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Dosya boyutu 20MB\'dan büyük olamaz' },
        { status: 413 }
      );
    }

    // Save file to temporary directory for parsing
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const tmpDir = os.tmpdir();
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(tmpDir, fileName);
    
    await fs.writeFile(filePath, fileBuffer);

    // Parse document
    let extractedText = '';
    let embeddings: Array<{
      chunkIndex: number;
      text: string;
      embedding: number[];
      startIndex: number;
      endIndex: number;
    }> = [];
    
    try {
   
      
      const result = await documentParser.parseDocument(filePath);
      extractedText = result.text;
      // Generate embeddings if we have text
      if (extractedText && extractedText.length > 0) {
       
        // Chunk the text
        const chunks = chunkService.chunkBySentences(extractedText);
        
        // Generate embeddings for each chunk
        const texts = chunks.map(chunk => chunk.text);
        try {
          const chunkEmbeddings = await embeddingService.generateEmbeddings(texts);
          
          // Prepare embeddings data (will save after document is created)
          embeddings = chunkEmbeddings.map((embedding, idx) => ({
            chunkIndex: chunks[idx].chunkIndex,
            text: chunks[idx].text,
            embedding,
            startIndex: chunks[idx].startIndex,
            endIndex: chunks[idx].endIndex,
          }));
          
        } catch (embError) {
          console.error('Embedding generation failed:', embError);
          // Continue without embeddings
        }
      }
      
      // Clean up temp file after parsing
      try {
        await fs.unlink(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (error) {
      // Continue even if parsing fails
      console.error('Text extraction failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }

    // Upload file to Vercel Blob storage
    let blobUrl = '';
    try {
      const blob = await put(fileName, fileBuffer, {
        contentType: file.type,
        addRandomSuffix: true,
        access: 'public',
      });
      blobUrl = blob.url;
    } catch (blobError) {
      console.error('Vercel Blob upload failed:', blobError);
      // Continue without blob storage - fallback to temp path
    }

    // Save to database
    const document = await documentService.createDocument({
      title,
      description: description || null,
      filePath: blobUrl || filePath, // Store blob URL or fallback to temp path
      fileSize: file.size,
      mimeType: file.type,
      extractedText: extractedText,
      user: {
        connect: { id: userId }
      }
    });

    // Save chunks with embeddings to DocumentChunk table
    if (embeddings && embeddings.length > 0) {
      try {
        await prisma.documentChunk.createMany({
          data: embeddings.map(chunk => ({
            documentId: document.id,
            chunkText: chunk.text,
            embedding: chunk.embedding as any, // Store as JSON
            chunkIndex: chunk.chunkIndex,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
          })),
        });
        console.log(`Saved ${embeddings.length} chunks to database`);
      } catch (chunkError) {
        console.error('Error saving chunks:', chunkError);
        // Continue even if chunks fail to save
      }
    }

    return NextResponse.json(
      {
        id: document.id,
        title: document.title,
        description: document.description,
        filePath: document.filePath,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      },
      { status: 201 }
    );
  } catch (error) {
    return errorHandler(error);
  }
};

