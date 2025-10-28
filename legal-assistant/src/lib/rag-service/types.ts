export interface DocumentChunk {
  documentId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: {
    documentTitle?: string;
    chunkIndex?: number;
  };
}

export interface SearchResult {
  chunks: DocumentChunk[];
  totalMatches: number;
  query: string;
}

export interface SearchOptions {
  limit?: number;
  minRelevance?: number;
  includeMetadata?: boolean;
}

export interface SemanticSearchQuery {
  query: string;
  userId: string;
  options?: SearchOptions;
}

