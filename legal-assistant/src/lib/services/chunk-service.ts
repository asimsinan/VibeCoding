/**
 * Document Chunking Service
 * Chunks text into smaller pieces for embedding and RAG
 */

export interface TextChunk {
  text: string;
  chunkIndex: number;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
}

export class ChunkService {
  private readonly chunkSize: number;
  private readonly overlapSize: number;

  constructor(chunkSize: number = 1000, overlapSize: number = 200) {
    this.chunkSize = chunkSize;
    this.overlapSize = overlapSize;
  }

  /**
   * Chunk text into smaller pieces with overlap
   */
  chunkText(text: string): TextChunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let index = 0;
    let chunkIndex = 0;

    while (index < text.length) {
      const endIndex = Math.min(index + this.chunkSize, text.length);
      const chunkText = text.substring(index, endIndex);
      
      chunks.push({
        text: chunkText,
        chunkIndex: chunkIndex++,
        startIndex: index,
        endIndex: endIndex,
      });

      // Move forward, but with overlap
      index = endIndex - this.overlapSize;
    }

    return chunks;
  }

  /**
   * Chunk text by sentences (better for semantic search)
   * Simplified and more robust implementation
   */
  chunkBySentences(text: string): TextChunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    // Split by sentence boundaries - handle Turkish punctuation too
    const sentenceRegex = /[.!?][\s\n]+/g;
    let currentIndex = 0;
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;
    let currentChunk = '';
    let chunkStart = 0;

    const sentences = text.split(sentenceRegex);
    
    for (const sentence of sentences) {
      if (!sentence || sentence.trim().length === 0) continue;
      
      const sentenceWithPunct = sentence + (text.includes(sentence + '.') ? '.' : '');
      const trimmedSentence = sentenceWithPunct.trim();
      
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        const endIndex = chunkStart + currentChunk.length;
        chunks.push({
          text: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          startIndex: chunkStart,
          endIndex: endIndex,
        });

        // Start new chunk with overlap
        const overlap = currentChunk.substring(Math.max(0, currentChunk.length - this.overlapSize));
        currentChunk = overlap + trimmedSentence;
        chunkStart = Math.max(0, endIndex - this.overlapSize);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex: chunkIndex,
        startIndex: chunkStart,
        endIndex: chunkStart + currentChunk.length,
      });
    }

    return chunks;
  }
}

export const chunkService = new ChunkService();

