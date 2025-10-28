import { PrismaClient } from '@prisma/client';
import type { SearchResult, SearchOptions, SemanticSearchQuery } from './types';
import { chunker } from './chunker';
import { calculateRelevance } from './scoring';

const prisma = new PrismaClient();

export class RAGSearchService {
  /**
   * Search Turkish documents using full-text search
   */
  async searchDocuments(query: SearchOptions & { query: string; userId: string }): Promise<SearchResult> {
    const { query: searchQuery, userId, limit = 10, minRelevance = 0.1 } = query;

    // Use PostgreSQL full-text search with Turkish support
    const documents = await prisma.document.findMany({
      where: {
        userId,
        extractedText: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        extractedText: true,
        description: true
      }
    });

    if (!documents || documents.length === 0) {
      return {
        chunks: [],
        totalMatches: 0,
        query: searchQuery
      };
    }

    // Perform semantic search on each document
    const allChunks: Array<{
      text: string;
      documentId: string;
      title?: string;
      relevance: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    for (const doc of documents) {
      if (!doc.extractedText) continue;

      const chunks = chunker.chunkText(doc.extractedText, doc.id, doc.title || undefined);
      
      for (const chunk of chunks) {
        const relevance = calculateRelevance(chunk.text, searchQuery);
        
        if (relevance >= minRelevance) {
          allChunks.push({
            text: chunk.text,
            documentId: chunk.documentId,
            title: chunk.metadata?.documentTitle,
            relevance,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex
          });
        }
      }
    }

    // Sort by relevance and limit
    allChunks.sort((a, b) => b.relevance - a.relevance);
    const topChunks = allChunks.slice(0, limit);

    return {
      chunks: topChunks.map(chunk => ({
        documentId: chunk.documentId,
        text: chunk.text,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        metadata: {
          documentTitle: chunk.title
        }
      })),
      totalMatches: allChunks.length,
      query: searchQuery
    };
  }

  /**
   * Get context for Gemini API from search results
   */
  async getContextForGemini(query: SemanticSearchQuery): Promise<string> {
    const results = await this.searchDocuments({
      query: query.query,
      userId: query.userId,
      limit: 5,
      minRelevance: 0.2
    });

    const contextParts = results.chunks.map((chunk, index) => {
      const source = chunk.metadata?.documentTitle || 'Belge';
      return `[${index + 1}] ${source}:\n${chunk.text}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Full-text search using PostgreSQL LIKE for Turkish text
   */
  async fullTextSearch(query: SearchOptions & { query: string; userId: string }): Promise<SearchResult> {
    const { query: searchQuery, userId, limit = 10 } = query;

    // Use case-insensitive search with Turkish characters
    const documents = await prisma.document.findMany({
      where: {
        userId,
        AND: [
          { extractedText: { not: null } },
          {
            extractedText: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        extractedText: true
      },
      take: limit
    });

    const chunks: Array<{
      text: string;
      documentId: string;
      startIndex: number;
      endIndex: number;
      relevance: number;
    }> = [];

    for (const doc of documents) {
      if (!doc.extractedText) continue;
      
      const chunks2 = chunker.chunkText(doc.extractedText, doc.id, doc.title || undefined);
      
      for (const chunk of chunks2) {
        const relevance = calculateRelevance(chunk.text, searchQuery);
        chunks.push({
          ...chunk,
          relevance
        });
      }
    }

    // Sort by relevance
    chunks.sort((a, b) => b.relevance - a.relevance);

    return {
      chunks: chunks.slice(0, limit).map(c => ({
        documentId: c.documentId,
        text: c.text,
        startIndex: c.startIndex,
        endIndex: c.endIndex,
        metadata: {
          documentTitle: documents.find(d => d.id === c.documentId)?.title
        }
      })),
      totalMatches: chunks.length,
      query: searchQuery
    };
  }
}

export const ragSearchService = new RAGSearchService();

