/**
 * Embedding Service - Generates text embeddings for RAG
 * Uses Vercel AI Gateway via AI SDK
 */

import { aiGatewayService } from '@/lib/ai-gateway/client';

export class EmbeddingService {
  constructor() {
    // Uses AI Gateway service via singleton
  }

  /**
   * Generate embeddings for text
   * Uses AI Gateway with Google's embedding models
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await aiGatewayService.generateEmbedding(text);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch with rate limiting)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await aiGatewayService.generateEmbeddings(texts);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }
}

export const embeddingService = new EmbeddingService();

