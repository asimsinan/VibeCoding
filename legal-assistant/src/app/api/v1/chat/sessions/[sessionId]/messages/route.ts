import { NextRequest, NextResponse } from 'next/server';
import { chatMessageService, chatSessionService } from '@/lib/database';
import { geminiService } from '@/lib/gemini-service';
import { embeddingService, EmbeddingService } from '@/lib/services/embedding-service';
import { errorHandler } from '@/lib/api/error-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) => {
  try {
    const body = await request.json();
    const { content, role } = body;

    if (!content || !role) {
      return NextResponse.json(
        { error: 'İçerik ve rol gereklidir' },
        { status: 400 }
      );
    }

    // Save user message
    await chatMessageService.createMessage({
      sessionId: params.sessionId,
      role: 'user' as any,
      content,
    });

    // Get session to check if it exists
    const session = await chatSessionService.getSessionById(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Sohbet oturumu bulunamadı' },
        { status: 404 }
      );
    }
    
    console.log('Session has documentId:', session.documentId);

    // Generate AI response using Gemini with document context
    let aiResponse = 'Cevap alınamadı';
    try {
      console.log('Calling Gemini with API key:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
      
      // If session has a document, retrieve relevant context
      if (session.documentId) {
        console.log('Session has document, fetching document...');
        const { documentService } = await import('@/lib/database');
        const document = await documentService.getDocumentById(session.documentId);
        
        console.log('Document retrieved:', document ? `"${document.title}"` : 'NOT FOUND');
        console.log('Document has extractedText:', document?.extractedText ? 'YES (length: ' + document.extractedText.length + ')' : 'NO');
        
        // Check if document has chunks with embeddings (vector-based RAG)
        const chunks = await prisma.documentChunk.findMany({
          where: { documentId: session.documentId },
          orderBy: { chunkIndex: 'asc' },
        });
        
        if (chunks && chunks.length > 0) {
          console.log(`Document has ${chunks.length} chunks with embeddings, using semantic search`);
          
          // Generate query embedding
          const queryEmbedding = await embeddingService.generateEmbedding(content);
          
          // Find most similar chunks using cosine similarity
          const similarities = chunks.map((chunk: any) => {
            const embedding = chunk.embedding as number[];
            const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, embedding);
            return { ...chunk, similarity };
          });
          
          // Sort by similarity and take top 3 chunks
          similarities.sort((a, b) => b.similarity - a.similarity);
          const topChunks = similarities.slice(0, 3);
          
          console.log(`Found ${topChunks.length} relevant chunks (top similarity: ${topChunks[0]?.similarity?.toFixed(3)})`);
          
          // Build context from relevant chunks
          const relevantContext = topChunks
            .map(chunk => chunk.chunkText)
            .join('\n\n---\n\n');
          
          // Use RAG with semantically relevant chunks
          const response = await geminiService.generateWithContext(
            content,
            relevantContext,
            {
              language: 'Türkçe',
              temperature: 0.7,
              maxTokens: 4096,
            }
          );
          aiResponse = response.text;
        } else if (document?.extractedText) {
          console.log('Using document context for RAG (full text)');
          // Fallback to full-text RAG
          const response = await geminiService.generateWithContext(
            content,
            document.extractedText,
            {
              language: 'Türkçe',
              temperature: 0.7,
              maxTokens: 4096,
            }
          );
          aiResponse = response.text;
        } else {
          console.log('No extracted text, using basic generation');
          // No extracted text, use basic generation
          const response = await geminiService.generateTextWithRetry(content, {
            language: 'Türkçe',
            temperature: 0.7,
            maxTokens: 2048,
          });
          aiResponse = response.text;
        }
      } else {
        console.log('No document in session, using basic generation');
        // No document context, use basic generation
        const response = await geminiService.generateTextWithRetry(content, {
          language: 'Türkçe',
          temperature: 0.7,
          maxTokens: 2048,
        });
        aiResponse = response.text;
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      aiResponse = 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
    }

    // Save AI message
    await chatMessageService.createMessage({
      sessionId: params.sessionId,
      role: 'assistant' as any,
      content: aiResponse,
    });

    return NextResponse.json({
      content: aiResponse,
      role: 'assistant',
    });
  } catch (error) {
    return errorHandler(error);
  }
};

export const GET = async (
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) => {
  try {
    const messages = await chatMessageService.getSessionMessages(params.sessionId);

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role.toLowerCase(),
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    return errorHandler(error);
  }
};
