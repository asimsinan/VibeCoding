export interface DocumentParseResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
  };
}

