import type { DocumentChunk } from './types';

export class DocumentChunker {
  private readonly CHUNK_SIZE: number = 500; // characters
  private readonly OVERLAP_SIZE: number = 50; // characters

  /**
   * Split document text into chunks with overlap
   */
  chunkText(text: string, documentId: string, documentTitle?: string): DocumentChunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);
      
      // Try to end at sentence boundary
      const sentenceEnd = this.findSentenceEnd(text, startIndex, endIndex);
      if (sentenceEnd > startIndex) {
        endIndex = sentenceEnd;
      }

      const chunkText = text.substring(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        chunks.push({
          documentId,
          text: chunkText,
          startIndex,
          endIndex,
          metadata: {
            documentTitle,
            chunkIndex
          }
        });
        chunkIndex++;
      }

      // Move to next chunk with overlap
      startIndex = endIndex - this.OVERLAP_SIZE;
      
      // Prevent infinite loop
      if (startIndex >= endIndex) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  /**
   * Find the end of a sentence in Turkish text
   */
  private findSentenceEnd(text: string, start: number, maxEnd: number): number {
    const sentenceEndRegex = /[.!?]/;
    for (let i = maxEnd - 1; i >= start; i--) {
      if (sentenceEndRegex.test(text[i])) {
        return i + 1;
      }
    }
    return maxEnd;
  }

  /**
   * Chunk text preserving Turkish characters
   */
  chunkTextWithTurkishSupport(text: string, documentId: string, documentTitle?: string): DocumentChunk[] {
    return this.chunkText(text, documentId, documentTitle);
  }
}

export const chunker = new DocumentChunker();

